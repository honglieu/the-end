import { transition, trigger, useAnimation } from '@angular/animations';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  closeViewConversation,
  openViewConversation
} from '@/app/dashboard/animation/triggerViewConversationsAnimation';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  listCalendarTypeDot
} from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { MessageService } from '@services/message.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { EConversationType } from '@shared/enum/conversationType.enum';
import {
  EMessageComeFromType,
  EMessageType
} from '@shared/enum/messageType.enum';
import { EOptionType } from '@shared/enum/optionType.enum';
import { UserConversation } from '@shared/types/conversation.interface';
import { FileCarousel } from '@shared/types/file.interface';
import { IMessage } from '@shared/types/message.interface';

@Component({
  selector: 'view-conversation',
  templateUrl: './view-conversation.component.html',
  styleUrls: ['./view-conversation.component.scss'],
  animations: [
    trigger('openClose', [
      transition(':enter', [useAnimation(openViewConversation)]),

      transition(':leave', [useAnimation(closeViewConversation)])
    ])
  ]
})
export class ViewConversationComponent implements OnInit, OnDestroy {
  @ViewChild('scrollDown') private scrollDown: ElementRef;
  public isShowViewConversation: boolean = false;
  public isShowViewConversationBS;
  public listofmessages: IMessage[] = [];
  public currentConversation: UserConversation;
  public destroyRef: () => void;
  public checkIsShowViewConversation: () => void;
  public filterMsg: (value) => void;
  public mapHistoryChatMessage: (
    message: IMessage,
    index: number,
    hasCreateConversationMessageBefore?: boolean
  ) => void;
  public groupMessageViaEmail: (messages: IMessage[]) => void;
  public parseMessageToObject: (messages: any) => any;
  public getCategoryDitails: (value) => any;
  public listofTicketCategory: any = [];
  public detectUserRole: (
    userType: string,
    type: string,
    userId: string,
    isSendFromEmail?: boolean,
    messageType?: EMessageType
  ) => string;
  private unsubscribe = new Subject<void>();
  public conversationType = EConversationType;
  public messagesType = EMessageType;
  public scrollBottomTimeOut: NodeJS.Timeout = null;
  private pageIndex: number = 0;
  public totalPagesOfConversationWithTrudi: number = 0;
  public arrayImageCarousel: FileCarousel[] = [];
  public initialIndex: number;
  public isShowCarousel = false;
  public isCarousel: boolean = false;
  public popupModalPosition = ModalPopupPosition;
  public EOptionType = EOptionType;
  public messageType;
  createdFrom: EMessageComeFromType;
  private eventChangeQuoteSizeHandler: (e: Event) => void;

  constructor(
    public conversationService: ConversationService,
    private filesService: FilesService,
    public userService: UserService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.subscribeIsShowViewConversation();
    this.mapMessageProperties();
    this.scrollToBottom();
    this.subscribeEventChangeHeightIframe();
  }

  public getTicketDetails(id) {
    const categoryDetail = this.listofTicketCategory.find((el) => el.id === id);
    if (!categoryDetail) {
      return {};
    }
    return categoryDetail;
  }

  mapMessageProperties() {
    if (!this.listofmessages) return;
    this.listofmessages = this.listofmessages.map((message) => {
      message.messageType = message.messageType.toUpperCase() as EMessageType;
      if (message.messageType === EMessageType.actionLink) {
        const categoryDetail = this.getCategoryDitails(
          message.actionLink.topicId
        );
        message.color = categoryDetail.color;
        message.svg = categoryDetail.svg;
      } else if (
        message.messageType === EMessageType.ticket &&
        (message.options?.ticket?.ticketCategoryId ||
          message.options?.ticketCategoryId)
      ) {
        if (message.options.type === 'MUlTIPLE_TASK') {
          message.ticketCategoryInfo = this.getTicketDetails(
            message.options.ticket.ticketCategoryId
          );
        } else {
          message.ticketCategoryInfo = this.getTicketDetails(
            message.options.ticketCategoryId
          );
        }
      }
      if (message.isSendFromEmail) {
        if (typeof message.message === 'string') {
          message.message = message.message
            .replace(/\r/g, '')
            .replace(/\n{3,}/g, '\n\n');
        } else {
          message.message = message.message.map((item) => {
            item.value = item.value
              .replace(/\r/g, '')
              .replace(/\n{3,}/g, '\n\n');
            return item;
          });
        }
      }
      return message;
    });
  }

  manageCarouselState(event) {
    if (event.state) {
      this.filesService
        .getFileListInConversation(this.currentConversation.id)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res: FileCarousel[]) => {
          if (res && res.length) {
            this.arrayImageCarousel = res
              .map((el) => ({
                ...el,
                fileType: this.filesService.getFileTypeDot(el.fileName),
                extension: this.filesService.getFileExtensionWithoutDot(
                  el.fileName || el.name
                ),
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
              (el) => el.propertyDocumentId === event.imageId
            );
            if (this.initialIndex === -1) {
              const fileDownload = res?.find(
                (item) => item?.propertyDocumentId === event?.imageId
              );
              this.filesService.downloadResource(
                fileDownload?.mediaLink,
                fileDownload?.fileName || fileDownload?.name
              );
            } else {
              this.isShowCarousel = event.state;
              this.isCarousel = event.state;
            }
          }
        });
    } else {
      this.isShowCarousel = event.state;
      this.isCarousel = event.state;
      this.initialIndex = null;
    }
  }

  loadHistory(conversationId: string, isUpdate: boolean) {
    this.pageIndex++;
    if (this.pageIndex < this.totalPagesOfConversationWithTrudi) {
      this.conversationService
        .getHistoryOfConversationWithTrudi(conversationId, this.pageIndex)
        .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
        .subscribe((res) => {
          if (res && res.list.length) {
            this.totalPagesOfConversationWithTrudi = res.totalPages;
            const sortedData = [];
            res.list = this.groupMessageViaEmail(res.list);
            res.list
              .reverse()
              .filter((element) => this.filterMsg(element))
              .forEach((element, idx) => {
                this.mapHistoryChatMessage(element, idx);
                sortedData.push({
                  ...element,
                  senderType: this.detectUserRole(
                    element.userType,
                    element.type,
                    element.userId,
                    element.isSendFromEmail,
                    element?.messageType
                  )
                });
              });
            this.listofmessages = [...sortedData, ...this.listofmessages];

            this.mapMessageProperties();
          }
        });
    }
  }

  scrollToBottom(): void {
    this.scrollBottomTimeOut = setTimeout(() => {
      if (this.scrollDown) {
        this.scrollDown.nativeElement.scrollTop =
          this.scrollDown.nativeElement.scrollHeight;
      }
    }, 0);
  }

  handleClickOutside(): void {
    this.isShowViewConversationBS.next(false);
  }

  handleAnimationEnd(): void {
    if (!this.isShowViewConversation) this.destroyRef();
  }

  subscribeIsShowViewConversation() {
    this.isShowViewConversationBS
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow) => {
        this.isShowViewConversation = isShow;
      });
  }

  calculateElementHeight(inputHeight: number): string | void {
    if (!inputHeight || inputHeight < 0) return;
    return `calc(100vh - ${inputHeight}px)`;
  }

  subscribeEventChangeHeightIframe() {
    this.eventChangeQuoteSizeHandler = (e: CustomEvent) => {
      this.messageService.setMessageChangeIframeId(e.detail?.messageId);
    };
    window.document.addEventListener(
      'eventChangeQuoteSize',
      this.eventChangeQuoteSizeHandler,
      false
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    clearTimeout(this.scrollBottomTimeOut);
    if (this.eventChangeQuoteSizeHandler) {
      window.document.removeEventListener(
        'eventChangeQuoteSize',
        this.eventChangeQuoteSizeHandler,
        false
      );
    }
  }
}
