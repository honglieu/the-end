import { ApiService } from './api.service';
import { ElementRef, Injectable } from '@angular/core';
import { conversations } from 'src/environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';
import { CallTypeEnum } from '@shared/enum/share.enum';
import { UserConversation } from '@shared/types/conversation.interface';
import { TaskItem } from '@shared/types/task.interface';
import {
  ECallTooltipType,
  EMessageComeFromType
} from '@shared/enum/messageType.enum';
import {
  combineNames,
  displayName,
  handleTemplateTypeTicket,
  isHtmlContent
} from '@shared/feature/function.feature';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { TIME_FORMAT } from './constants';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';
import { EAddOn } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { EConversationType } from '@/app/shared';
import dayjs from 'dayjs';

export interface CallButtonState {
  enableCallBtn: {
    voiceCall: boolean;
    videoCall: boolean;
  };
  isProgressCall: boolean;
  callBtnTooltip: string;
  showVideoCallBtn: boolean;
  callTooltipType: {
    voice: ECallTooltipType;
    video: ECallTooltipType;
  };
}

interface IRequestCall {
  conversationId: string;
  type: CallTypeEnum;
}
@Injectable()
export class MessageService {
  private dragDropMessageTrigger = new BehaviorSubject<string>('');
  public callButtonData = new BehaviorSubject<CallButtonState>(null);
  public requestToCall = new BehaviorSubject<IRequestCall>(null);
  public requestForwardEmailHeader = new BehaviorSubject<UserConversation>(
    null
  );
  public requestShowUserInfo = new BehaviorSubject<any>(null);
  public requestShowUserProfile = new BehaviorSubject<any>(null);
  public requestDataMsgDetail = new BehaviorSubject<
    [TaskItem, UserConversation]
  >(null);
  public dragDropMessageTrigger$ = this.dragDropMessageTrigger.asObservable();
  public isActiveCallMessage = new BehaviorSubject<number>(null);
  public selectedFileIdBS = new BehaviorSubject<string>('');

  public getNewMessagesSubject: Subject<any> = new Subject();
  public getMessagesSubject: Subject<any> = new Subject();
  public currentDate;
  private imageDetail = new BehaviorSubject<any>(null);
  private messageChangeIframeId = new BehaviorSubject<string>(null);
  public triggerUseMasterDB = new BehaviorSubject<boolean>(false);

  constructor(
    private apiService: ApiService,
    private agencyDateFormatService: AgencyDateFormatService,
    private titleCasePipe: TrudiTitleCasePipe
  ) {}

  onMessageDragging(currentFileProp: string): void {
    this.dragDropMessageTrigger.next(currentFileProp);
  }

  public getMessages(body: { date: Date; conversationId: string }): void {
    this.currentDate = body.date;
    this.apiService
      .postIntervalAPI(conversations, 'get-messages', {
        date: this.currentDate,
        conversationId: body.conversationId
      })
      .subscribe((res) => {
        this.currentDate = res.date;
        this.getMessagesSubject.next(res);
      });
  }

  getNumberOfReceiver(
    landlord: string,
    tenant: string,
    supplier: string,
    external?: string,
    contact?: string
  ) {
    return [landlord, tenant, supplier, contact, external]
      .filter(Boolean)
      .join(', ');
  }

  setMessageChangeIframeId(value: string) {
    this.messageChangeIframeId.next(value);
  }

  getMessageChangeIframeId() {
    return this.messageChangeIframeId;
  }

  setImageDetail(value: any) {
    this.imageDetail.next(value);
  }

  getImageDetail() {
    return this.imageDetail.asObservable();
  }

  addEventForImage(elementRef: ElementRef) {
    const imagesInMessage =
      elementRef.nativeElement.querySelectorAll('.image-detail');
    for (let item = 0; item <= imagesInMessage.length - 1; item++) {
      imagesInMessage?.[item]?.addEventListener(
        'click',
        this.setImageDetail.bind(this)
      );
    }
  }

  removeEventForImage(elementRef: ElementRef) {
    const imagesInMessage =
      elementRef.nativeElement.querySelectorAll('.image-detail');
    for (let item = 0; item <= imagesInMessage.length - 1; item++) {
      imagesInMessage?.[item]?.removeEventListener(
        'click',
        this.setImageDetail.bind(this)
      );
    }
  }

  mapReplyMessageTicket(item): string {
    const template = [item]
      ?.flatMap((message) => {
        if (message?.emailMetadata?.from?.length > 0) {
          const sender = message?.emailMetadata?.from[0];
          const mapTicket = {
            ...message,
            options: {
              ...message?.options,
              response: {
                ...message?.options?.response,
                payload: {
                  ...message?.options?.response?.payload,
                  ticket: {
                    ...message?.options?.response?.payload?.ticket,
                    firstName: sender?.firstName,
                    lastName: sender?.lastName
                  }
                }
              }
            }
          };
          return [mapTicket];
        } else {
          return [message];
        }
      })
      .filter(Boolean)
      .reverse()
      .map((item) => {
        let templateAll = [];
        let templateSender = '';
        let ticketFile = '';
        const payloadTicket = item.options?.response?.payload?.ticket;
        const {
          DATE_FORMAT_DAYJS,
          DATE_AND_TIME_FORMAT,
          DATE_AND_TIME_FORMAT_DAYJS
        } = this.agencyDateFormatService.getDateFormat();

        const INVALID_DATE = 'Invalid date';
        const suggestedDate =
          payloadTicket?.availability &&
          payloadTicket?.availability !== INVALID_DATE
            ? payloadTicket?.availability
            : payloadTicket?.available_date;

        const isCreateFromChannel = [
          EConversationType.MESSENGER,
          EConversationType.SMS,
          EConversationType.EMAIL,
          EConversationType.VOICE_MAIL,
          EConversationType.APP
        ].includes(item?.options?.response?.payload?.ticket?.createdFrom);

        const availabilityDateFormat = isCreateFromChannel
          ? dayjs(suggestedDate, 'DD/MM/YYYY').format(
              `dddd ${DATE_FORMAT_DAYJS}`
            ) || ''
          : this.agencyDateFormatService.formatTimezoneDate(
              payloadTicket?.availability?.split(' ')?.[0],
              `${'dddd' + ' ' + DATE_FORMAT_DAYJS}`
            );

        if (item.messageType === 'TICKET' && payloadTicket) {
          const templateTicket = handleTemplateTypeTicket(
            item?.options?.response?.type,
            payloadTicket,
            availabilityDateFormat,
            item?.options?.response?.payload?.ticket?.createdFrom,
            item?.customFontSetting
          );
          const createdFromMapping = {
            [EMessageComeFromType.MOBILE]: EMessageComeFromType.APP,
            [EMessageComeFromType.SMS]: EMessageComeFromType.SMS,
            [EMessageComeFromType.MESSENGER]: this.titleCasePipe.transform(
              payloadTicket?.createdFrom
            ),
            [EMessageComeFromType.WHATSAPP]: EAddOn.WHATSAPP,
            default: payloadTicket?.createdFrom?.replace(/_/g, '').toLowerCase()
          };
          const createdFrom =
            createdFromMapping[payloadTicket?.createdFrom] ||
            createdFromMapping.default;
          const timeStamp = this.agencyDateFormatService.formatTimezoneDate(
            payloadTicket?.createdAt,
            DATE_AND_TIME_FORMAT_DAYJS
          );
          const displayName =
            item?.channelUserName ||
            combineNames(payloadTicket?.firstName, payloadTicket?.lastName);
          const timestampAndSenderName = `<p style='font-size: ${
            item?.customFontSetting ? item?.customFontSetting.fontSize : '11pt'
          }; font-family: ${
            item?.customFontSetting?.fontStyle
          }'>${timeStamp} from ${displayName}</p></br>`;
          ticketFile +=
            timestampAndSenderName +
            `${templateTicket} </br>` +
            `<p style='font-size: ${
              item?.customFontSetting
                ? item?.customFontSetting.fontSize
                : '11pt'
            }; font-family: ${item?.customFontSetting?.fontStyle}'>${
              payloadTicket?.status
            } via ${createdFrom} ${this.agencyDateFormatService.formatTimezoneDate(
              payloadTicket?.createdAt,
              DATE_AND_TIME_FORMAT
            )}</p>`;
        }
        const indexEmail = item.message?.indexOf("div id='email-signature'>");
        const message = item.message?.slice(0, indexEmail);

        const checkContentMessage =
          (message || isHtmlContent(item.message)) &&
          !item.file &&
          item.messageType === 'text' &&
          item.textContent;
        if (checkContentMessage || item.messageType === 'TICKET') {
          templateSender += `<p><span style="font-weight: 600;">${displayName(
            item.firstName,
            item.lastName
          )}</span> &nbsp; &nbsp;<span style="font-weight: 500;">${this.agencyDateFormatService.formatTimezoneDate(
            item.createdAt,
            TIME_FORMAT
          )}</span></p>`;

          templateAll.push(ticketFile);
        }
        return templateAll.filter((res) => !!res.length).join('\n');
      })
      ?.filter((res) => !!res.length)
      ?.join('\n\n');
    return `${template}`;
  }
}
