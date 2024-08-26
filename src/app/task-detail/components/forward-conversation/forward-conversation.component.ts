import { TitleCasePipe } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  first,
  lastValueFrom,
  map,
  of,
  switchMap,
  takeUntil,
  throttleTime
} from 'rxjs';
import {
  AgencyDateFormatService,
  RegionDateFormat
} from '@/app/dashboard/services/agency-date-format.service';
import { TIME_FORMAT } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { ASSIGN_TO_MESSAGE } from '@services/messages.constants';
import { TaskService } from '@services/task.service';
import { TaskType } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { displayName, isHtmlContent } from '@shared/feature/function.feature';
import { EDefaultBtnDropdownOptions } from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { TaskItem } from '@shared/types/task.interface';
import { EMessageComeFromType } from '@shared/enum/messageType.enum';
import { EOptionType } from '@shared/enum/optionType.enum';
import { FormatDateTimePipe } from '@shared/pipes/format-date-time.pipe';
import { FormatTimePipe } from '@shared/pipes/format-time.pipe';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { SyncAttachmentType } from '@shared/enum/inbox.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { cloneDeep, isEqual } from 'lodash-es';

@Component({
  selector: 'forward-conversation',
  templateUrl: './forward-conversation.component.html',
  styleUrls: ['./forward-conversation.component.scss']
})
export class ForwardConversationComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() popupState = {} as { isShowForwardConversation: boolean };
  @Input() taskDetailViewMode: EViewDetailMode = EViewDetailMode.TASK;
  @Input() isSyncedAttachment: boolean = true;
  @Input() threadId: string = null;
  @Input() taskId: string = null;
  public destroy$ = new Subject<void>();
  public prefillFiles: File[] = [];
  public EDefaultBtnDropdownOptions = EDefaultBtnDropdownOptions;

  public rawMsg: string = '';
  public showSendMsg: boolean = false;
  public listOfFiles = [];
  public prefillVariables;
  public dateFormat: RegionDateFormat;
  public currentConversation;
  public isTaskType: boolean = false;
  TaskType = TaskType;
  public forwardConversationConfigs = {
    'header.title': 'Forward conversation',
    'header.showDropdown': false,
    'body.prefillTitle': '',
    'body.isShowNegative': true,
    'footer.buttons.showBackBtn': false,
    'otherConfigs.isCreateMessageType': true,
    'otherConfigs.isForwardConversation': true,
    'footer.buttons.sendType': ISendMsgType.BULK_EVENT || ''
  };
  private currentMailboxId: string;
  public conversationId: string = null;
  public attachmentSync = {
    attachmentLoadKey: null
  };

  constructor(
    private agencyDateFormatService: AgencyDateFormatService,
    private conversationService: ConversationService,
    private filesService: FilesService,
    private toastService: ToastrService,
    private toastCustomService: ToastCustomService,
    private taskService: TaskService,
    private sharedMessageViewService: SharedMessageViewService,
    private titleCasePipe: TitleCasePipe,
    private formatTime: FormatTimePipe,
    private formatDateTime: FormatDateTimePipe,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe,
    public inboxService: InboxService
  ) {}

  ngOnInit(): void {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((mailBoxId) => {
        if (!mailBoxId) return;
        this.currentMailboxId = mailBoxId;
      });
    this.subscribeSyncAttachmentEvent();
    this.subcribeToCurrentTask();
    this.getListHistoryMessage();
    this.loadFiles();
    this.subscribeTriggerReloadAttachment();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isSyncedAttachment']?.currentValue !== null) {
      this.forwardConversationConfigs['footer.buttons.disableSendBtn'] =
        !this.isSyncedAttachment;
    }
  }

  subscribeSyncAttachmentEvent() {
    // outlook gmail
    this.taskService.triggerSyncAttachment
      .pipe(
        takeUntil(this.destroy$),
        throttleTime(300),
        distinctUntilChanged((prev, curr) => isEqual(prev, curr))
      )
      .subscribe((threadIds) => {
        if (!threadIds?.includes(this.threadId)) return;
        this.conversationService.syncAttachment({
          mailBoxId: this.currentMailboxId,
          threadIds: [this.threadId],
          type: SyncAttachmentType.PORTAL_FOLDER
        });
      });
  }

  subcribeToCurrentTask() {
    const taskStream =
      this.taskDetailViewMode !== EViewDetailMode.MESSAGE
        ? this.taskService.currentTask$
        : this.sharedMessageViewService.prefillCreateTaskData$;

    taskStream.pipe(takeUntil(this.destroy$)).subscribe((currentTask) => {
      this.handleCurrentTask(currentTask);
    });
  }

  handleCurrentTask(currentTask: TaskItem) {
    const isTaskType = currentTask?.taskType === TaskType.TASK;
    this.forwardConversationConfigs['otherConfigs.isCreateMessageType'] =
      !isTaskType;
    this.forwardConversationConfigs['footer.buttons.sendType'] = !isTaskType
      ? ISendMsgType.BULK_EVENT
      : '';
    this.isTaskType = isTaskType;
  }

  public handlePopupState(state: Partial<typeof this.popupState>) {
    for (const stateKey of Object.keys(state)) {
      this.popupState[stateKey] = state[stateKey];
    }
  }

  public loadFiles() {
    this.conversationId =
      this.taskDetailViewMode === EViewDetailMode.MESSAGE
        ? this.sharedMessageViewService.prefillCreateTaskDataValue
            .conversations[0]?.id
        : this.conversationService.currentConversation.getValue().id;
    const attachments$ = this.filesService.getAttachmentFilesDocument().pipe(
      takeUntil(this.destroy$),
      map((documents) => {
        if (!Array.isArray(documents)) return [];
        let files = [];
        for (const document of documents) {
          const conversaionFiles =
            document?.propertyDocuments
              ?.map((element) => ({
                ...element,
                thumbnail: this.filesService.getThumbnail(element),
                fileIcon: this.filesService.getFileIcon(element?.name),
                fileTypeDot: this.filesService.getFileTypeDot(element?.name),
                conversationId: document.conversationId
              }))
              ?.filter(
                (element) => element.conversationId === this.conversationId
              ) || [];
          files = [...files, ...conversaionFiles];
        }
        return files;
      })
    );

    const callFiles$ = this.filesService
      .getCallFiles()
      .pipe(
        map((files) =>
          files.filter((file) => file.conversationId === this.conversationId)
        )
      );

    combineLatest([attachments$, callFiles$])
      .pipe(
        takeUntil(this.destroy$),
        map(([attachments, files]) => {
          return [...(attachments || []), ...(files || [])];
        }),
        first((files) => Array.isArray(files) && files?.length > 0),
        map((files) =>
          files.map((file) => {
            const fileType = this.filesService.getFileTypeDot(file.name);
            return {
              ...file,
              mediaType: fileType
            };
          })
        )
      )
      .subscribe((files) => (this.prefillFiles = files));
  }

  getListHistoryMessage() {
    if (this.taskDetailViewMode === EViewDetailMode.MESSAGE) {
      this.sharedMessageViewService.prefillCreateTaskData$
        .pipe(
          takeUntil(this.destroy$),
          switchMap((currentTask) => {
            const currentConversation = currentTask?.conversations[0];
            this.forwardConversationConfigs = {
              ...this.forwardConversationConfigs,
              'body.prefillTitle': currentConversation?.categoryName ?? ''
            };
            if (!currentConversation) return of(null);
            return this.conversationService.getAllHistoryOfConvesationV2(
              currentConversation.id
            );
          })
        )
        .subscribe((listMessage) => {
          if (listMessage) {
            this.mapDataWithTemplate(listMessage);
          }
        });
    } else {
      this.conversationService.currentConversation
        .pipe(
          takeUntil(this.destroy$),
          switchMap((currentConversation) => {
            this.forwardConversationConfigs = {
              ...this.forwardConversationConfigs,
              'body.prefillTitle': currentConversation?.categoryName ?? ''
            };
            if (!currentConversation) return of(null);
            return this.conversationService.getAllHistoryOfConvesationV2(
              currentConversation.id
            );
          })
        )
        .subscribe((listMessage) => {
          if (listMessage) {
            this.mapDataWithTemplate(listMessage);
          }
        });
    }
  }

  mapDataWithTemplate(data) {
    let bulkMessageId = '';
    const template = data
      ?.flatMap((message) => {
        if (
          message?.messageType === 'ticket' &&
          message?.conversationLog?.length > 0
        ) {
          const conversationLogWithTicket =
            message?.conversationLog.filter(
              (logItem) => logItem.options?.response?.payload?.ticket
            ) || [];
          const logItemWithTicket = conversationLogWithTicket?.find(
            (ticketApp) =>
              ticketApp?.options?.response?.payload?.ticket?.conversationId ===
              message?.conversationId
          );
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
                    firstName:
                      logItemWithTicket?.options?.response?.payload?.ticket
                        ?.firstName,
                    lastName:
                      logItemWithTicket?.options?.response?.payload?.ticket
                        ?.lastName
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
        let templateMessage = '';
        let templateContactCard = '';
        const payloadTicket = item.options?.response?.payload?.ticket;
        if (item.bulkMessageId) {
          bulkMessageId = item.bulkMessageId;
        }

        if (item.messageType === 'ticket' && payloadTicket) {
          const templateTicket = this.handleTemplateTypeTicket(
            item?.options?.response?.type,
            payloadTicket
          );
          const createdFromHandler =
            payloadTicket?.createdFrom === EMessageComeFromType.MOBILE
              ? EMessageComeFromType.APP
              : payloadTicket?.createdFrom;
          const createdFrom = createdFromHandler
            ?.replace(/_/g, '')
            .toLowerCase();
          ticketFile += `\n<div style="display: flex; align-items: center;"><span style="font-weight: 600;">${displayName(
            payloadTicket?.firstName,
            payloadTicket?.lastName
          )}</span><em></em> &nbsp; &nbsp;<span style="font-weight: 500;">${this.handleFormatTime(
            payloadTicket?.createdAt
          )}</span></div>\n`;
          ticketFile +=
            templateTicket +
            `<p style="font-size: 12px; line-height: 20px; font-weight: 500">${
              payloadTicket?.status
            } via ${createdFrom} ${this.handleDateTimeFormat(
              payloadTicket?.createdAt
            )}</p>`;
        }

        const indexEmail = item.message?.indexOf("div id='email-signature'>");
        const message = item.message?.slice(0, indexEmail);

        const checkContentMessage =
          (message || isHtmlContent(item.message)) &&
          !item.file &&
          item.messageType === 'text' &&
          item.textContent;

        if (checkContentMessage || item.messageType === 'ticket') {
          templateSender += `<p><span style="font-weight: 600;">${displayName(
            item.firstName,
            item.lastName
          )}</span> &nbsp; &nbsp;<span style="font-weight: 500;">${this.handleFormatTime(
            item.createdAt
          )}</span></p>`;

          if (!payloadTicket) {
            templateAll.push(templateSender);

            let messageRes = '';
            if (isHtmlContent(item.message)) {
              const newDOC = new DOMParser().parseFromString(
                item.message,
                'text/html'
              );
              const styleDocs = newDOC.querySelectorAll('style');
              const bodyDoc = newDOC.querySelector('body');
              if (styleDocs?.length) {
                styleDocs.forEach((s) => {
                  messageRes += s.outerHTML;
                });
              }
              if (bodyDoc) {
                messageRes += bodyDoc.outerHTML;
              }

              if (messageRes) {
                messageRes = messageRes
                  .replace(/(\r\n|\n|\r)/gm, '')
                  .replace(/\s+/g, ' ')
                  .trim();
                templateAll.push(messageRes);
              }
            } else {
              messageRes = item.message?.replace(/(\r\n|\n|\r)/gm, '');
              if (messageRes) {
                templateMessage += `<div>${messageRes}</div>`;
                templateAll.push(templateMessage);
              }
            }
          } else {
            templateAll.push(ticketFile);
          }
        }

        if (item.options?.contacts) {
          item.options.contacts.map((contact, i) => {
            contact.phoneNumber = this.phoneNumberFormatPipe.transform(
              contact.phoneNumber
            );
            const checkPhoneNumber = this.checkHasValue(contact?.phoneNumber);
            const checkEmail = this.checkHasValue(contact?.email);
            const checkAddress = this.checkHasValue(contact?.address);
            const checkContactLink = this.checkHasValue(contact?.landingPage);
            const contactLink = this.handleLink(contact?.landingPage);
            const { color, background } = this.handleColorAndBackgroundTitle(
              contact?.title
            );
            const title = this.handleTitle(contact?.type);
            const isSupplier = title === EUserPropertyType.SUPPLIER;
            const phoneNumber =
              `<div style="word-break: break-all; width: 100%; margin-bottom: 8px; gap: 4px; display: flex; align-items: center">` +
              `<div style="margin-top:2px; display:flex; align-items: flex-start;">` +
              `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.6 10.7854V12.4714C13.6007 12.6279 13.5686 12.7829 13.5057 12.9263C13.4429 13.0697 13.3507 13.1984 13.2352 13.3043C13.1196 13.4101 12.9832 13.4906 12.8346 13.5408C12.686 13.5909 12.5286 13.6096 12.3724 13.5955C10.6396 13.4075 8.97503 12.8166 7.51258 11.8701C6.15195 11.0072 4.99838 9.8559 4.13378 8.49797C3.18207 7.03178 2.58981 5.36247 2.40496 3.62528C2.39089 3.46986 2.4094 3.31322 2.4593 3.16534C2.50921 3.01745 2.58943 2.88155 2.69484 2.7663C2.80026 2.65105 2.92857 2.55897 3.07159 2.49592C3.21462 2.43286 3.36924 2.40023 3.5256 2.40008H5.21499C5.48829 2.39739 5.75323 2.49398 5.96045 2.67183C6.16766 2.84969 6.30301 3.09667 6.34126 3.36675C6.41257 3.90632 6.5448 4.43611 6.73545 4.94602C6.81122 5.14718 6.82762 5.3658 6.7827 5.57597C6.73779 5.78615 6.63345 5.97907 6.48204 6.13187L5.76686 6.84563C6.56852 8.25267 7.73583 9.41768 9.14566 10.2177L9.86084 9.50398C10.014 9.35287 10.2073 9.24874 10.4178 9.20391C10.6284 9.15909 10.8475 9.17545 11.0491 9.25107C11.56 9.44134 12.0908 9.57332 12.6315 9.64448C12.905 9.683 13.1548 9.82051 13.3334 10.0309C13.512 10.2412 13.6069 10.5097 13.6 10.7854Z" stroke="#646464" stroke-width="0.88" stroke-linecap="round" stroke-linejoin="round"/></svg>` +
              `</div>` +
              `<div style="display: flex; align-items: center">` +
              `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; ${checkPhoneNumber}">${this.showValue(
                contact?.phoneNumber,
                'no phone number'
              )}</div>` +
              `</div>` +
              `</div>`;
            const email =
              `<div style="word-break: break-all; width: 100%; ${
                isSupplier ? 'margin-bottom: 8px;' : ''
              } gap: 4px; display: flex; align-items: center">` +
              `<div style="margin-top:2px; display:flex; align-items: flex-start;">` +
              `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.6737 4.57674V11.433C14.6737 12.4645 13.8376 13.3006 12.8062 13.3006H3.19373C2.16231 13.3006 1.32617 12.4645 1.32617 11.433V4.56702C1.32617 3.5356 2.16231 2.69946 3.19373 2.69946H12.8062C13.8333 2.69946 14.6667 3.52864 14.6737 4.55414C14.6739 4.56168 14.6739 4.56922 14.6737 4.57674ZM2.34865 4.32491C2.45378 3.95727 2.79233 3.68817 3.19373 3.68817H12.8062C13.2076 3.68817 13.5461 3.9573 13.6513 4.32497L8 8.09248L2.34865 4.32491ZM2.31488 5.49068V11.433C2.31488 11.9184 2.70835 12.3119 3.19373 12.3119H12.8062C13.2915 12.3119 13.685 11.9184 13.685 11.433V5.49075L8.27421 9.09794C8.10816 9.20865 7.89183 9.20865 7.72578 9.09794L2.31488 5.49068Z" fill="#646464"/></svg>` +
              `</div>` +
              `<div style="display: flex; align-items: center">` +
              `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; ${checkEmail}">${this.showValue(
                contact?.email,
                'no email'
              )}</div>` +
              `</div>` +
              `</div>`;
            const address =
              `<div style="word-break: break-all; width: 100%; margin-bottom: 8px; gap: 4px; display: flex; align-items: center">` +
              `<div style="margin-top:2px; display:flex; align-items: flex-start;">` +
              `<svg style="margin-top:2px" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.0007 2.6135C6.85497 2.6135 5.75616 3.06864 4.946 3.8788C4.13584 4.68896 3.6807 5.78777 3.6807 6.9335C3.6807 8.60724 4.76826 10.2235 5.94916 11.4701C6.5298 12.0829 7.11206 12.5845 7.54971 12.933C7.72807 13.075 7.88177 13.1911 8.0007 13.2785C8.11963 13.1911 8.27333 13.075 8.4517 12.933C8.88934 12.5845 9.47161 12.0829 10.0522 11.4701C11.2331 10.2235 12.3207 8.60724 12.3207 6.9335C12.3207 5.78777 11.8656 4.68896 11.0554 3.8788C10.2452 3.06864 9.14644 2.6135 8.0007 2.6135ZM8.0007 13.8668C7.73445 14.2662 7.73432 14.2661 7.73418 14.266L7.73381 14.2658L7.73273 14.2651L7.72927 14.2627L7.71724 14.2546C7.70698 14.2476 7.69231 14.2376 7.6735 14.2246C7.63589 14.1985 7.58174 14.1605 7.51342 14.1112C7.37682 14.0125 7.18326 13.8684 6.9517 13.684C6.48934 13.3158 5.87161 12.7841 5.25225 12.1303C4.03315 10.8435 2.7207 8.9931 2.7207 6.9335C2.7207 5.53316 3.27699 4.19017 4.26718 3.19998C5.25737 2.20979 6.60036 1.6535 8.0007 1.6535C9.40105 1.6535 10.744 2.20979 11.7342 3.19998C12.7244 4.19017 13.2807 5.53316 13.2807 6.9335C13.2807 8.9931 11.9683 10.8435 10.7492 12.1303C10.1298 12.7841 9.51206 13.3158 9.04971 13.684C8.81815 13.8684 8.62459 14.0125 8.48799 14.1112C8.41966 14.1605 8.36552 14.1985 8.32791 14.2246C8.3091 14.2376 8.29442 14.2476 8.28417 14.2546L8.27214 14.2627L8.26868 14.2651L8.2676 14.2658L8.26722 14.266C8.26708 14.2661 8.26696 14.2662 8.0007 13.8668ZM8.0007 13.8668L8.26696 14.2662C8.10573 14.3737 7.89568 14.3737 7.73445 14.2662L8.0007 13.8668ZM8.0007 5.8135C7.38214 5.8135 6.8807 6.31494 6.8807 6.9335C6.8807 7.55206 7.38214 8.0535 8.0007 8.0535C8.61926 8.0535 9.1207 7.55206 9.1207 6.9335C9.1207 6.31494 8.61926 5.8135 8.0007 5.8135ZM5.9207 6.9335C5.9207 5.78475 6.85195 4.8535 8.0007 4.8535C9.14946 4.8535 10.0807 5.78475 10.0807 6.9335C10.0807 8.08226 9.14946 9.0135 8.0007 9.0135C6.85195 9.0135 5.9207 8.08226 5.9207 6.9335Z" fill="#646464"/></svg>` +
              `</div>` +
              `<div style="display: flex; align-items: center">` +
              `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; ${checkAddress}">${this.showValue(
                contact?.address,
                'no property'
              )}</div>` +
              `</div>` +
              `</div>`;
            const website =
              `<div style="word-break: break-all; width: 100%; gap: 4px; display: flex; align-items: center">` +
              `<div style="display:flex; align-items: flex-start;">` +
              `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_9293_2706)"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.83186 7.52018H4.87377C5.00563 5.48991 5.7145 3.5441 6.90976 1.9093C4.16667 2.39709 2.04884 4.69257 1.83186 7.52018ZM8.00018 2.06765C6.7348 3.61839 5.97858 5.52294 5.83599 7.52018H10.1644C10.0218 5.52294 9.26556 3.61839 8.00018 2.06765ZM10.1644 8.48018C10.0218 10.4774 9.26556 12.382 8.00018 13.9327C6.7348 12.382 5.97858 10.4774 5.83599 8.48018H10.1644ZM4.87377 8.48018H1.83186C2.04884 11.3078 4.16667 13.6033 6.90976 14.0911C5.7145 12.4563 5.00563 10.5105 4.87377 8.48018ZM9.0906 14.0911C10.2859 12.4563 10.9947 10.5105 11.1266 8.48018H14.1685C13.9515 11.3078 11.8337 13.6033 9.0906 14.0911ZM14.1685 7.52018H11.1266C10.9947 5.48991 10.2859 3.5441 9.0906 1.9093C11.8337 2.39709 13.9515 4.69257 14.1685 7.52018ZM0.853516 8.00018C0.853516 4.05319 4.05319 0.853516 8.00018 0.853516C11.9472 0.853516 15.1468 4.05319 15.1468 8.00018C15.1468 11.9472 11.9472 15.1468 8.00018 15.1468C4.05319 15.1468 0.853516 11.9472 0.853516 8.00018Z" fill="#646464"/></g><defs><clipPath id="clip0_9293_2706"><rect width="16" height="16" fill="white"/></clipPath></defs></svg>` +
              `</div>` +
              `<div style="display: flex; align-items: center; gap: 4px; flex: 1">` +
              `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; ${checkContactLink}">${this.showValue(
                contact?.landingPage,
                'no website'
              )}</div>` +
              `<a style="display: ${
                contact?.landingPage ? 'flex' : 'none'
              }; align-items: center;" href="${contactLink}" target="_blank">` +
              `<svg style="color: #00AA9F" width="16" height="16" viewBox="0 0 16 16" fill="#00AA9F" xmlns="http://www.w3.org/2000/svg"><path d="M13.6871 2.17678C13.5821 2.07961 13.4236 2.00429 13.2805 2H8.51273C8.22165 2.0156 7.87075 2.25265 7.8587 2.58332C7.84678 2.90903 8.15616 3.2083 8.48181 3.19765L11.8366 3.19765L7.59066 7.40941C7.35635 7.64372 7.35635 8.02361 7.59066 8.25798C7.82496 8.49229 8.20492 8.49229 8.43923 8.25798L12.651 4.14453V7.37683C12.6513 7.66664 12.9395 8.00844 13.2653 8C13.5911 7.99163 13.845 7.63632 13.8486 7.3459L13.8639 2.58339C13.8591 2.42368 13.8002 2.28942 13.6871 2.17678Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2 3.00001C2 2.44772 2.44772 2.00001 3 2.00001H5.16364C5.52513 2.00001 5.81818 2.28782 5.81818 2.64286C5.81818 2.9979 5.52513 3.28572 5.16364 3.28572H3.30909V12.7143H12.6909V10.6786C12.6909 10.3235 12.984 10.0357 13.3455 10.0357C13.707 10.0357 14 10.3235 14 10.6786V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3.00001Z" fill="currentColor"/></svg>` +
              `</a>` +
              `</div>` +
              `</div>`;
            templateContactCard +=
              `<div class="nonedit" style="width: 302px; border-radius: 8px; padding: 12px; border: 1px solid rgba(166, 166, 166, 0.3); background: #FFF; gap: 4px; position: relative; cursor: default; outline: none;">` +
              `<div style="display: flex">` +
              `<div style="font-size: 14px; line-height: 20px; font-style: normal; font-weight: 600;">` +
              `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; color: #202020">${this.titleCasePipe.transform(
                displayName(contact?.firstName, contact?.lastName)
              )}</div>` +
              `<div style="display: flex; align-items: center; gap: 4px; border-radius: 24px; word-break: break-word; max-width: max-content; font-size: 12px; line-height: 16px; font-style: normal; font-weight: 500 !important; color: ${color}; background: ${background}; margin-top: 8px; margin-bottom: 8px; height: 20px; padding: 2px 8px;"><span>${this.titleCasePipe.transform(
                title
              )}</span></div>` +
              `</div>` +
              `</div>` +
              `<div style="color: #646464; font-weight: 500; font-size: 12px;">` +
              phoneNumber +
              `${isSupplier ? '' : address}` +
              email +
              `${isSupplier ? website : ''}` +
              `</div>` +
              `</div> ${i !== item.options?.contacts?.length - 1 ? '\n' : ''}`;
          });
          templateAll.push(templateContactCard);
        }

        return templateAll.filter((res) => !!res.length).join('\n');
      })
      ?.filter((res) => !!res.length)
      ?.join('\n\n');
    this.rawMsg = `<div id="reply_quote" class="gmail_quote">${template}</div>`;
  }

  handleLink(url: string) {
    const regex =
      /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return `${regex.test(url) ? '' : 'https://'}${url}`;
  }

  handleTemplateTypeTicket(type: EOptionType, payloadTicket) {
    let template = '';
    switch (type) {
      case EOptionType.RESCHEDULE_INSPECTION_REQUEST:
        const suggestedDate = this.generateTemplate(
          'Suggested date:',
          this.handleDayTimeFormat(payloadTicket?.availability?.split(' ')?.[0])
        );
        const suggestedTime = this.generateTemplate(
          'Suggested time:',
          payloadTicket?.time_availability
        );
        const reason = this.generateTemplate(
          'Reason:',
          payloadTicket?.reschedule_reason
        );
        const formatRescheduleTemplate = [
          suggestedDate,
          suggestedTime,
          reason
        ].join('');
        template = formatRescheduleTemplate;
        break;

      case EOptionType.VACATE_REQUEST:
        const type = this.generateTemplate(
          'Type',
          payloadTicket?.vacate_type?.[0]?.value
        );
        const moveOutDate = this.generateTemplate(
          'Intended move out date',
          payloadTicket?.move_out_date
        );
        const note = this.generateTemplate('Note', payloadTicket?.note);

        const formatVacateTemplate = [type, moveOutDate, note].join('');
        template = formatVacateTemplate;
        break;
      default:
        const defaultTemplate = this.generateTemplate(
          '',
          payloadTicket?.maintenance_object || payloadTicket?.general_inquiry
        );
        template = defaultTemplate;
        break;
    }
    return template;
  }

  generateTemplate(label: string, value: string, lastValue?: boolean) {
    if (!value) return '';
    if (!label)
      return `<p style="font-size: 12px; line-height: 20px; font-weight: 400; word-break: break-word; white-space: pre-line; max-width: 250px;">${value}</p>\n`;
    const template = `<p style="font-size: 12px; line-height: 20px; font-weight: 600">${label}</p><p style="font-size: 12px; line-height: 20px; font-weight: 400">${value}</p>`;
    return lastValue ? template : template + '\n';
  }

  handleDayTimeFormat(date: string) {
    const format =
      this.agencyDateFormatService.getDateFormat().DATE_FORMAT_DAYJS;

    return this.agencyDateFormatService.formatTimezoneDate(
      date,
      `${'dddd' + ' ' + format}`
    );
  }

  handleTitle(type: string) {
    if (!type) return '';
    const checkTitle = type.includes('_');
    if (type.includes(EUserPropertyType.LANDLORD)) {
      return type
        .replace(EUserPropertyType.LANDLORD, EUserPropertyType.OWNER)
        .split('_')
        .join(' ');
    }

    if (checkTitle) {
      return type.split('_').join(' (').concat(')');
    }

    switch (type) {
      case EUserPropertyType.OTHER:
        return 'Other contact';
      default:
        return type;
    }
  }

  showValue(value: string, noValueString: string) {
    return value ? value : `(${noValueString})`;
  }

  checkHasValue(value: string) {
    return value ? '' : 'color: #999999; font-style: italic; font-weight: 400;';
  }

  handleColorAndBackgroundTitle(value: string) {
    const text = value.toLowerCase();
    if (text.includes('owner') || text.includes('landlord')) {
      return {
        color: 'var(--brand-500, #00AA9F)',
        background: 'var(--brand-100, #E1F8F5)'
      };
    }

    if (text.includes('tenant')) {
      return {
        color: 'var(--tenant-500, #FFBF41)',
        background: 'var(--tenant-100, #FFF9EB)'
      };
    }

    if (text.includes('supplier')) {
      return {
        color: '#695ECD',
        background: '#E5E9FA'
      };
    }

    return { color: '#E1024F', background: '#FFE1E7' };
  }

  handleDateTimeFormat(date) {
    const format =
      this.agencyDateFormatService.getDateFormat().DATE_AND_TIME_FORMAT;

    return this.agencyDateFormatService.formatTimezoneDate(date, format);
  }

  handleFormatTime(time) {
    return this.agencyDateFormatService.formatTimezoneDate(time, TIME_FORMAT);
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.handlePopupState({ isShowForwardConversation: false });
        if (event?.isDraft) {
          return;
        }
        !this.isTaskType &&
          this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE);
        break;
      default:
        break;
    }
  }

  private async _getAttachmentFiles(id: string) {
    const response = await lastValueFrom(
      this.filesService.getAttacmentsByTask(id)
    );
    this.filesService.setAttachmentFilesDocument(response);
  }

  async subscribeTriggerReloadAttachment() {
    this.taskService.triggerReloadHistoryAfterSync
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (res) => {
        if (!res.status || this.attachmentSync.attachmentLoadKey !== res.key)
          return;
        const task = this.sharedMessageViewService.prefillCreateTaskDataValue;
        if (task?.conversations?.[0]) {
          task.conversations[0].isSyncedAttachment = true;
        }
        await Promise.all([
          this._getAttachmentFiles(this.taskId),
          this.reGetMessages()
        ]);
        this.forwardConversationConfigs['footer.buttons.disableSendBtn'] =
          false;
        this.forwardConversationConfigs = cloneDeep(
          this.forwardConversationConfigs
        );
      });
  }

  async reGetMessages() {
    const listMessage = await lastValueFrom(
      this.conversationService.getAllHistoryOfConvesationV2(this.conversationId)
    );
    if (!listMessage) return;
    this.mapDataWithTemplate(listMessage);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
