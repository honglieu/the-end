import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CompanyService } from '@services/company.service';
import { FilesService } from '@services/files.service';
import { MessageService } from '@services/message.service';
import { TaskType } from '@shared/enum/task.enum';
import { ActionLinkService } from '@services/action-link.service';
import {
  isHtmlContent,
  mapThreeDotsForMessage,
  removeQuote
} from '@shared/feature/function.feature';
import {
  ISelectedReceivers,
  ETypeMessage
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { IMessageReminder } from '@/app/dashboard/modules/inbox/interfaces/reminder-message.interface';
import {
  listDocumentTypeDot,
  listThumbnailExtension
} from '@services/constants';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { cloneDeep } from 'lodash-es';

enum MessageType {
  text = 'text',
  url = 'url'
}

@Component({
  selector: 'popover-message-reminder',
  templateUrl: './popover-message-reminder.component.html',
  styleUrls: ['./popover-message-reminder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1 })),
      transition(':enter', [style({ opacity: 0 }), animate(300)]),
      transition(':leave', [animate(300, style({ opacity: 0 }))])
    ])
  ]
})
export class PopoverMessageReminderComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  @Input() message: IMessageReminder;
  @Input() draftUpdating: boolean = false;
  @Output() updatePosition = new EventEmitter<boolean>();
  @Output() destroy = new EventEmitter<boolean>();
  @Output() onEditDraft = new EventEmitter<boolean>();
  public messageType = MessageType;
  public isRmEnvironment: boolean = false;
  public isShowIframeContent: boolean;
  public contactsList: ISelectedReceivers[] = [];
  public htmlContent: string = '';
  private unsubscribe = new Subject<void>();
  readonly TaskType = TaskType;
  public readonly typeMessage = ETypeMessage;
  public emailQuote: HTMLDivElement;
  public isShowQuote: boolean = false;
  public widthPopover = 500;
  public maxWidthTo = 0;
  public maxWidthCc = 0;

  private cleanupShowEmailQuote: () => void;

  constructor(
    public actionLinkService: ActionLinkService,
    public filesService: FilesService,
    private messageService: MessageService,
    private elr: ElementRef,
    private agencyService: AgencyService,
    public inboxService: InboxService,
    private cdr: ChangeDetectorRef,
    private companyService: CompanyService
  ) {}

  ngAfterViewInit() {
    if (this.isShowIframeContent) {
      this.htmlContent = mapThreeDotsForMessage(
        {
          message: this.message?.textContent,
          id: this.message?.id
        },
        'message',
        true
      );
      this.cdr.markForCheck();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']?.currentValue) {
      this.message = cloneDeep(this.message);
      this.message.textContent = this.replaceRegexEmailUrl(
        this.message?.textContent,
        this.message?.mailMessageId
      );
      this.message.options = this.jsonParse(this.message?.options);
      this.message.textContent = removeQuote(this.message.textContent);

      this.setFileTypeMessage();
    }
  }

  ngOnInit(): void {
    this.bindShowContent();
    this.getCurrentCompany();
    this.setWidthPopover();
  }

  getCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((agency) => {
        if (agency) {
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(agency);
        }
      });
  }

  setWidthPopover() {
    const width = document
      .querySelector('#virtual-reminder-list')
      .querySelector('.msg-reminder-item-block')?.clientWidth;
    this.widthPopover = (width / 100) * 76;
    this.maxWidthTo = (this.widthPopover / 100) * 38;
    this.maxWidthCc = (this.widthPopover / 100) * 24;
  }

  setFileTypeMessage() {
    this.message.propertyDocuments?.forEach((item) => {
      let checkFileType = '';
      const fileTypeDot = this.filesService.getFileTypeDot(item.fileType?.name);
      if (!item?.fileType?.name && !fileTypeDot) return;
      item.type =
        this.filesService.getFileTypeDot(item.fileType?.name) || fileTypeDot;
      if (listThumbnailExtension.includes(fileTypeDot)) {
        item.type = fileTypeDot;
      }
      item.fileIcon = this.filesService.getFileIcon(item.fileType?.name);

      if (item.name) {
        checkFileType = this.filesService.getFileTypeDot(item?.name);
      } else {
        checkFileType = this.filesService.getFileTypeSlash(item.fileType?.name);
      }
      if (!item?.thumbMediaLink) {
        if (checkFileType === 'video') {
          item.thumbMediaLink = '/assets/images/icons/video.svg';
        } else {
          item.thumbMediaLink = item?.mediaLink;
        }
      }

      item.isShowFile = true;
      switch (this.filesService.getFileTypeSlash(item?.fileType?.name)) {
        case 'video':
        case 'photo':
          if (!item.files) {
            item.files = {
              mediaList: []
            };
          }
          item.files.mediaList.push({ ...item });
          break;
        case 'audio':
          if (!item.files) {
            item.files = {
              audioList: []
            };
          }
          item.files.audioList.push({ ...item });
          break;
        case 'file':
          if (
            listDocumentTypeDot.some((extension) =>
              item.name.includes(extension)
            )
          ) {
            if (!item.files) {
              item.files = {
                fileList: []
              };
            }
            item.files.fileList.push({ ...item });
          } else {
            if (!item.files) {
              item.files = {
                unSupportedList: []
              };
            }
            item.files.unSupportedList.push({
              ...item,
              isShowFile: true
            });
          }
          break;
      }
      if (!item?.extension) {
        item.extension = this.filesService.getFileExtensionWithoutDot(
          item?.name
        );
      }
    });
    const orderBy = ['photo', 'audio', 'video'];
    this.message.propertyDocuments = this.message?.propertyDocuments.sort(
      (a, b) => {
        return (
          orderBy.indexOf(
            this.filesService.getFileTypeSlash(a?.fileType?.name)
          ) -
          orderBy.indexOf(this.filesService.getFileTypeSlash(b?.fileType?.name))
        );
      }
    );
  }

  replaceRegexEmailUrl(message: string, id?: string) {
    if (!message) return '';
    const ignoreChar = ['<p', '<ol', '<ul', '<table', '<br', '<div'];
    if (ignoreChar.some((char) => message.includes(char))) return message;
    if (!id) {
      message = message.replace(/<|>/g, '');
    }
    return message;
  }

  jsonParse(value: string | {}) {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  }

  bindShowContent() {
    if (isHtmlContent(this.message.textContent)) {
      this.isShowIframeContent = true;
    } else {
      this.isShowIframeContent = false;
    }
  }

  onLoadIframe() {
    this.updatePosition.emit(true);
  }

  handleEditDraft() {
    this.onEditDraft.emit(true);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.messageService.removeEventForImage(this.elr);
    if (this.cleanupShowEmailQuote) {
      this.cleanupShowEmailQuote();
    }
    this.destroy.emit(true);
  }
}
