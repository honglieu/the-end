import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { EMessageEmailStatusEnum } from '@shared/enum/mesageEmailStatus.enum';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  TIME_FORMAT,
  listCalendarTypeDot,
  listDocumentTypeDot,
  listThumbnailExtension
} from '@services/constants';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { EmailItem } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { FilesService } from '@services/files.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { map } from 'rxjs';
import {
  formatNameHasEmail,
  isHtmlContent,
  mapThreeDotsForMessage
} from '@shared/feature/function.feature';
import { ETooltipQuoteMessage } from '@shared/types/message.interface';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';
import { EFileExtension } from '@shared/enum/extensionFile.enum';

@Component({
  selector: 'email-view-detail-message',
  templateUrl: './email-view-detail-message.component.html',
  styleUrls: ['./email-view-detail-message.component.scss']
})
export class EmailViewDetailMessageComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('contentMessageWrap') private contentMessageWrap: ElementRef;
  @Input() message: EmailItem;
  @Input() lastItem: boolean = false;

  isShowBoxInfo = false;
  messageEmailStatusEnum = EMessageEmailStatusEnum;
  eUserPropertyType = EUserPropertyType;
  isShowIframeContent: boolean;
  senderName: string;
  senderEmail: string;
  senderFormatted: string;
  recipientName: string;
  recipientEmail: string;
  recipientFormatted: string;
  ccName: string;
  ccEmail: string;
  ccFormatted: string;
  ccFormattedCollapse: string;
  bccFormatted: string;
  bccFormattedCollapse: string;
  bccName: string;
  bccEmail: string;
  popupModalPosition = ModalPopupPosition;
  isShowCarousel: boolean = false;
  arrayImageCarousel = [];
  initialIndex: number;
  TIME_FORMAT = TIME_FORMAT;
  public isCollapseMess = true;
  public htmlContent: string = '';

  private emailQuote: HTMLDivElement;
  private isShowQuote: boolean = false;
  public countMetaData: { to: number; cc: number; bcc: number } = {
    to: 0,
    cc: 0,
    bcc: 0
  };

  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$.pipe(
    map((format) => TIME_FORMAT + ' ' + format)
  );

  constructor(
    public filesService: FilesService,
    private agencyDateFormatService: AgencyDateFormatService,
    private elr: ElementRef,
    private cdr: ChangeDetectorRef,
    private taskDetailService: TaskDetailService
  ) {}

  ngAfterViewInit() {
    this.htmlContent = mapThreeDotsForMessage({
      message: this.message.htmlContent,
      id: this.message.id
    });
    this.cdr.markForCheck();
    this.showEmailQuote();
  }

  showEmailQuote() {
    this.emailQuote = this.elr.nativeElement.querySelector('div.gmail_quote');
    if (this.emailQuote) {
      const content =
        this.elr.nativeElement.querySelector('div.html-content')?.children?.[0];
      this.emailQuote.style.whiteSpace = 'normal';
      this.emailQuote.classList.add('mt-12');
      const divEmpty = document.createElement('div');
      const btnWrapper = document.createElement('button');
      const tooltipElement = document.createElement('span');
      const btnElement = document.createElement('img');

      btnElement.src = '/assets/icon/show-more-icon.svg';
      btnWrapper.classList.add('btn-toggle-est', 'gmail-quote-button');
      tooltipElement.classList.add('tooltip-quote', 'gmail-quote-tooltip');
      tooltipElement.innerHTML = ETooltipQuoteMessage.SHOW_QUOTE;
      btnWrapper.appendChild(btnElement);
      btnWrapper.appendChild(tooltipElement);
      btnWrapper.addEventListener('click', () => {
        this.onToggleQuote(this.emailQuote);
        tooltipElement.innerHTML = this.isShowQuote
          ? ETooltipQuoteMessage.HIDE_QUOTE
          : ETooltipQuoteMessage.SHOW_QUOTE;
      });
      content && content?.parentNode?.insertBefore(divEmpty, content);
      this.emailQuote.parentNode.insertBefore(btnWrapper, this.emailQuote);
      this.emailQuote?.classList.add('hide');
    }
  }

  onToggleQuote = (elementQuote) => {
    if (elementQuote.classList.contains('hide')) {
      elementQuote?.classList.remove('hide');
      this.isShowQuote = false;
    } else {
      elementQuote?.classList.add('hide');
      this.isShowQuote = true;
    }
  };

  ngOnInit(): void {
    this.bindShowContent();
    this.initializeContactInfo('sender', this.message?.sender);
    this.initializeContactInfo('recipient', this.message?.recipient);
    this.initializeContactInfo('cc', this.message?.cc);
    this.initializeContactInfo('bcc', this.message?.bcc);
    this.setFileTypeMessage();
    this.expandLastMsg();
    this.taskDetailService.triggerShowMsgInfoDropdown.subscribe((item) => {
      if (item !== this.message.id) {
        this.isShowBoxInfo = false;
      }
    });
  }

  setFileTypeMessage() {
    this.message.attachments.forEach((item) => {
      let checkFileType = '';
      item.name = item.fileName;
      item.createdAt = this.message?.timestamp;
      const fileTypeDot = this.filesService.getFileTypeDot(item.fileType);
      if (!item?.fileType && !fileTypeDot) return;
      item.type =
        this.filesService.getFileTypeDot(item.fileType) || fileTypeDot;
      if (listThumbnailExtension.includes(fileTypeDot)) {
        item.type = fileTypeDot;
      }
      item.fileIcon = this.filesService.getFileIcon(item.fileType);
      item.mediaLink = item.content;

      if (item.fileName) {
        checkFileType = this.filesService.getFileTypeDot(item.fileName);
      } else {
        checkFileType = this.filesService.getFileTypeSlash(item.fileType);
      }
      if (!item?.thumbMediaLink) {
        if (checkFileType === 'video') {
          item.thumbMediaLink = '/assets/images/icons/video.svg'; //icon fallback
        } else {
          item.thumbMediaLink = item.content;
        }
      }

      item.fileType = { id: item.id, name: item.fileType };
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
              item.fileName.includes(extension)
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
          item.fileName
        );
      }
    });
    const orderBy = ['photo', 'audio', 'video'];
    this.message.attachments = this.message.attachments.sort((a, b) => {
      return (
        orderBy.indexOf(this.filesService.getFileTypeSlash(a?.fileType?.name)) -
        orderBy.indexOf(this.filesService.getFileTypeSlash(b?.fileType?.name))
      );
    });
  }

  loadFile(fileId) {
    if (
      !listCalendarTypeDot
        .map((item) => item?.replace(/\./g, ''))
        .includes(fileId?.extension)
    ) {
      this.isShowCarousel = true;
      if (this.message.attachments && this.message.attachments.length) {
        this.arrayImageCarousel = this.message.attachments
          .map((el) => ({
            ...el,
            fileType: this.filesService.getFileTypeDot(el.fileName),
            extension: this.filesService.getFileExtensionWithoutDot(
              el.fileName || el.name
            ),
            thumbMediaLink:
              el.extension === EFileExtension.DOCX ||
              el.extension === EFileExtension.DOC
                ? '/assets/images/icons/doc.svg'
                : el.extension === EFileExtension.PDF
                ? '/assets/images/icons/pdf.svg'
                : el.thumbMediaLink,
            isUnsupportedFile: !ACCEPT_ONLY_SUPPORTED_FILE.includes(
              this.filesService.getFileExtensionWithoutDot(
                el.fileName || el.name
              )
            )
          }))
          .filter((el) => {
            return !listCalendarTypeDot
              .map((item) => item?.replace(/\./g, ''))
              .includes(el?.extension);
          });

        this.initialIndex = this.arrayImageCarousel.findIndex(
          (item) =>
            item?.id ===
            this.message.attachments.find((file) => file?.id === fileId?.id)?.id
        );
      }
    } else {
      this.isShowCarousel = false;
      this.initialIndex = null;
      this.filesService.downloadResource(
        fileId.mediaLink,
        fileId.fileName || fileId.name
      );
    }
  }

  bindShowContent() {
    if (isHtmlContent(this.message.htmlContent)) {
      this.isShowIframeContent = true;
    } else {
      this.isShowIframeContent = false;
    }
  }

  calculateCount(inputString: string) {
    return inputString.split(',').length > 2
      ? inputString.split(',').length - 2
      : 0;
  }

  initializeContactInfo(type: string, inputString: string) {
    if (inputString) {
      switch (type) {
        case 'recipient':
          this.countMetaData = {
            ...this.countMetaData,
            to: this.calculateCount(inputString)
          };
          break;
        case 'cc':
          this.countMetaData = {
            ...this.countMetaData,
            cc: this.calculateCount(inputString)
          };
          break;
        case 'bcc':
          this.countMetaData = {
            ...this.countMetaData,
            bcc: this.calculateCount(inputString)
          };
          break;
        default:
          break;
      }
      const contactListCollapse = inputString.split(',');
      const nameList = contactListCollapse.map(
        (contact) => this.getNameAndEmail(contact).name
      );
      const emailList = contactListCollapse.map(
        (contact) => this.getNameAndEmail(contact).email
      );
      const formattedListCollapse = contactListCollapse.map((contact) =>
        this.formatNameAndEmail(this.getNameAndEmail(contact))
      );
      const contactList = inputString.split(',').slice(0, 2);
      const formattedList = contactList.map((contact) =>
        this.formatNameAndEmail(this.getNameAndEmail(contact), false)
      );

      this[`${type}Name`] = nameList.join(', ');
      this[`${type}Email`] = emailList.join(', ');
      this[`${type}FormattedCollapse`] = formattedList.join(', ');
      this[`${type}Formatted`] = formattedListCollapse.join(', ');
    } else {
      this[`${type}Name`] = '';
      this[`${type}Email`] = '';
      this[`${type}Formatted`] = '';
    }
  }

  getNameAndEmail(inputString: string) {
    inputString = inputString.trim();
    const nameRegex = /"?(.+?)"?\s*</;
    const emailRegex = /<(.+?)>/;
    const validEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const nameMatches = nameRegex.exec(inputString);
    const emailMatches = emailRegex.exec(inputString);
    let name = nameMatches ? nameMatches[1] : '';
    let email = emailMatches ? emailMatches[1] : '';
    if (!email && !name) {
      if (validEmailRegex.test(inputString)) {
        email = inputString;
      } else {
        name = inputString;
      }
    }

    if (name?.trim() === email?.trim()) {
      return { email };
    } else {
      return { name, email };
    }
  }

  formatNameAndEmail(
    data: { name?: string; email?: string },
    hasEmail: boolean = true
  ) {
    if (data.name) {
      if (!hasEmail) {
        return `<span class="name-text font-semi-bold">${formatNameHasEmail(
          data.name
        )}</span>`;
      }
      if (data.email) {
        return `<span class="name-text">${data.name}</span> &lt;${data.email}&gt;`;
      } else {
        return `<span class="name-text">${data.name}</span>`;
      }
    } else {
      if (!hasEmail) {
        return `<span class="name-text font-semi-bold">${formatNameHasEmail(
          data.email
        )}</span>`;
      }
      return `&lt;${data.email}&gt;`;
    }
  }

  handleShowBoxInfo(msgId) {
    this.isShowBoxInfo = !this.isShowBoxInfo;
    this.taskDetailService.triggerShowMsgInfoDropdown.next(msgId);
  }

  collapseMess() {
    this.isCollapseMess = !this.isCollapseMess;
    this.isShowBoxInfo = false;
    !this.isCollapseMess && this.showEmailQuote();
  }

  manageCarouselState(event) {
    this.isShowCarousel = false;
    this.initialIndex = null;
  }

  messageTrackBy(index: number) {
    return index;
  }

  expandLastMsg() {
    if (!this.message?.isRead) {
      this.isCollapseMess = this.message?.isRead;
      return;
    }
    if (this.lastItem) {
      this.isCollapseMess = !this.lastItem;
    }
  }

  ngOnDestroy() {}
}
