import { Injectable } from '@angular/core';
import { ToastCustomComponent } from './toast-custom.component';
import { GlobalConfig, IndividualConfig, ToastrService } from 'ngx-toastr';
import { cloneDeep } from 'lodash-es';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { SocketType } from '@shared/enum/socket.enum';
import { EIntegrationsStatus } from '@/app/profile-setting/utils/integrations.interface';
import {
  EToastCustomType,
  SCHEDULE_MSG_FOR_SEND,
  TypeDataFortoast
} from './toastCustomType';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { IReportSpamQueryParams } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import {
  ISendMsgResponseV2,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import { ReminderMessageService } from '@/app/task-detail/services/reminder-message.service';
import {
  ReminderMessageType,
  StatusReminder
} from '@/app/dashboard/modules/inbox/enum/reminder-message.enum';
import { IIgnoreMessageReminder } from '@/app/dashboard/modules/inbox/interfaces/reminder-message.interface';
import { DRAFT_SAVED } from '@services/messages.constants';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { EToastType } from '@/app/toast/toastType';
import { EXPORT_PDF_FILE_TOAST_MESSAGE } from '@services/constants';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { SyncTaskActivityService } from '@services/sync-task-activity.service';
import { ISocketUpdateDecision, displayName } from '@/app/shared';
import { UpdateTaskStepsPayload } from '@/app/task-detail/modules/steps/services/step.service';
import { PhoneNumberFormatPipe } from '@/app/shared';

@Injectable({
  providedIn: 'root'
})
export class ToastCustomService {
  public toastName = {
    exportPDFSyncing: 'syncing-export-pdf-file',
    exportPDFError: 'error-export-pdf-file'
  };
  private options: GlobalConfig;
  public reportSpamSuccess: boolean = false;
  public isErrorToastVisible: boolean = false;
  public dataUndoSpam: IReportSpamQueryParams;
  public dataUndoReminderMsg: IIgnoreMessageReminder;
  private currentDisplayToastIdsMap: Map<string, number> = new Map();
  private isRetryExportPDFFile: boolean = false;

  constructor(
    private toastr: ToastrService,
    private emailApiService: EmailApiService,
    private mailboxSettingService: MailboxSettingService,
    private reminderMessageService: ReminderMessageService,
    private syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private syncTaskActivityService: SyncTaskActivityService,
    private phoneNumberFormat: PhoneNumberFormatPipe
  ) {
    this.options = this.toastr.toastrConfig;
  }

  private handleShowToast(
    message,
    linkUrl,
    toastType: EToastCustomType = EToastCustomType.SUCCESS_WITH_VIEW_BTN,
    timeOut = 6000,
    options?: Partial<IndividualConfig>
  ) {
    const opt = cloneDeep({ ...this.options, ...options });
    opt.toastComponent = ToastCustomComponent;
    opt.toastClass = 'toastCustom';
    opt.timeOut = timeOut;
    opt.enableHtml = true;
    return this.toastr.show(message, linkUrl, opt, toastType);
  }

  getReportSpamSuccess(): boolean {
    return this.reportSpamSuccess;
  }

  getToastError(): boolean {
    return this.isErrorToastVisible;
  }

  setDataUndoSpam(dataUndoSpam) {
    this.dataUndoSpam = dataUndoSpam;
  }

  setDataUndoReminderMsg(dataUndoReminderMsg) {
    this.dataUndoReminderMsg = dataUndoReminderMsg;
  }

  handleUndoReportSpam() {
    this.emailApiService.handleUndoSpam(this.dataUndoSpam).subscribe({
      next: () => {},
      error: (error) => {
        this.showToastError(error);
      }
    });
  }

  handleUndoReminderMessage() {
    const payloadUndo = {
      messageId: this.dataUndoReminderMsg?.messageItem?.messageId,
      status:
        this.dataUndoReminderMsg?.messageItem?.isIgnoreMessage ||
        this.dataUndoReminderMsg?.messageItem?.group_data_index === 1
          ? StatusReminder.IGNORE
          : StatusReminder.UN_IGNORE,
      ignoreTime: this.dataUndoReminderMsg?.ignoreTime,
      ignoreDate: this.dataUndoReminderMsg?.ignoreDate
    };
    this.reminderMessageService
      .updateStatusMessageReminder(payloadUndo)
      .subscribe({
        next: () => {
          this.reminderMessageService.triggerIgnoreMessage$.next({
            messageItem: this.dataUndoReminderMsg.messageItem,
            undoMessage: true,
            indexMessage: this.dataUndoReminderMsg.indexMessage
          });
        },
        error: (error) => {
          this.showToastError(error);
        }
      });
  }

  showToastError(error) {
    this.toastr.clear();
    this.toastr.error(
      error?.error?.message ?? 'Report spam failed. Please try again.'
    );
  }

  handleShowToastByMailBox(message: string, options: Object = {}) {
    // Don't show toast if mailbox setting is private mailbox (don't share mailbox for anyone)
    if (this.mailboxSettingService.mailboxSettingValue?.teamMembers > 1) {
      this.toastr.info(message, null, options);
    }
  }

  handleShowToastForScheduleMgsSend(event, taskType?, showToast?) {
    if (
      event?.data?.jobReminders[0]?.taskType === TaskType.TASK &&
      !showToast
    ) {
      return;
    }
    const dataForToast = {
      conversationType: event?.conversationType,
      conversationId:
        event.data?.[0]?.conversationId ||
        (event.data as ISendMsgResponseV2)?.conversation?.id ||
        (event.data as any)?.jobReminders?.[0]?.conversationId,
      taskId:
        event.data?.[0]?.taskId ||
        (event.data as ISendMsgResponseV2)?.task?.id ||
        (event.data as any)?.jobReminders?.[0]?.taskId,
      isShowToast: true,
      type: SocketType.send,
      mailBoxId: (event.mailBoxId || (event.data as any)?.mailBoxId) ?? '',
      taskType: taskType ?? TaskType.MESSAGE,
      pushToAssignedUserIds: [],
      status:
        event.data?.[0]?.messageType ||
        (event.data as ISendMsgResponseV2)?.task?.status ||
        event.data?.[0]?.status ||
        TaskStatusType.inprogress
    };
    this.openToastCustom(
      dataForToast,
      true,
      EToastCustomType.SUCCESS_WITH_VIEW_BTN
    );
  }

  handleShowToastMessSend(event?: ISendMsgTriggerEvent) {
    const dataForToast = {
      isShowToast: true,
      type:
        event?.type === ISendMsgType.SCHEDULE_MSG
          ? SocketType.send
          : SocketType.newTask,
      taskType: TaskType.MESSAGE
    };
    this.openToastCustom(
      dataForToast,
      true,
      EToastCustomType.SUCCESS_WITHOUT_VIEW_BTN
    );
  }

  handleShowToastForDraft(
    data,
    type?: SocketType,
    taskType?: TaskType,
    status?: TaskStatusType,
    isShowMessageSent: boolean = false
  ) {
    const dataForToast = {
      conversationId: data?.conversation?.id || data?.conversationId,
      taskId: data?.task?.id || data?.taskId,
      mailBoxId: data?.task?.mailBoxId,
      isShowToast: true,
      type: type ?? SocketType.send,
      taskType: taskType ?? TaskType.DRAFT,
      status: status ?? TaskType.DRAFT
    };
    this.openToastCustom(
      dataForToast,
      true,
      EToastCustomType.SUCCESS_WITH_VIEW_BTN,
      isShowMessageSent
    );
  }

  openToastReloadPage() {
    const message = this.generateMessageHtmlForToastConflictDataError();
    this.handleShowToast(message, null, EToastCustomType.CONFLICT_DATA);
  }

  openToastFailedToConnect() {
    const message = this.generateMessageHtmlForToastFailedToConnect();
    this.handleShowToast(message, null, EToastCustomType.FAILED_CONNECT, 3000);
  }

  openToastCustom(
    data: TypeDataFortoast,
    isCurrentUser: boolean = false,
    type: EToastCustomType = EToastCustomType.SUCCESS_WITH_VIEW_BTN,
    isShowMessageSent: boolean = false,
    isHiddenMessage: boolean = false
  ) {
    if (
      (!data.isShowToast ||
        (!data.pushToAssignedUserIds?.includes(
          localStorage.getItem('userId').trim()
        ) &&
          !isHiddenMessage) ||
        data.status === EIntegrationsStatus.SYNCING) &&
      !isCurrentUser
    ) {
      return;
    }

    const taskId = data.newTaskId || data.taskId || data.taskIds?.[0];
    let statusType = data.statusTask || data.newStatus || data.status || '';

    switch (statusType) {
      case TaskStatusType.open:
        statusType = TaskStatusType.inprogress;
        break;
      case TaskStatusType.resolved:
        statusType = TaskStatusType.completed;
        break;
      default:
        break;
    }

    if (statusType === TaskStatusType.resolved)
      statusType = TaskStatusType.completed;

    const generateFolder = (taskType: TaskType) => {
      const isMessage = taskType === TaskType.MESSAGE;
      switch (statusType) {
        case TaskStatusType.completed:
          return isMessage ? 'resolved' : 'completed';
        case TaskStatusType.deleted:
          return isMessage ? 'deleted' : 'cancelled';
        case TaskStatusType.draft:
          return 'draft';
        default:
          return 'all';
      }
    };

    const messageFolder = generateFolder(TaskType.MESSAGE);
    const conversationRoute = this.generateConversationRoute(
      data.conversationType
    );
    const statusTypeQueryString = `${statusType ? 'status=' + statusType : ''}`;

    const mailboxIdQueryString = `${
      !data.mailBoxId ||
      data.taskType === TaskType.TASK ||
      data.isConvertedToTask
        ? ''
        : '&mailBoxId=' + data.mailBoxId
    }`;

    let _params = `inbox/detail/${taskId}`; // TaskType.TASK
    let url = `https://fake.url/${_params}`; // TaskType.TASK
    let linkUrl = `${url}?type=TASK&${statusTypeQueryString}`; // TaskType.TASK
    data.conversationId &&
      (linkUrl = linkUrl + `&conversationId=${data.conversationId}`);
    data?.reminderType &&
      (linkUrl = linkUrl + `&reminderType=${data?.reminderType}`);

    if (
      (data.taskType === TaskType.MESSAGE ||
        data.taskType === TaskType.EMAIL ||
        data.taskType === TaskType.DRAFT) &&
      !data.isConvertedToTask
    ) {
      _params = `inbox/${conversationRoute}/${messageFolder}`;
      url = `https://fake.url/${_params}`;
      linkUrl = `${url}?taskId=${taskId}&${statusTypeQueryString}&inboxType=TEAM_TASK&conversationId=${data.conversationId}`;
    }

    if (data.type === SocketType.moveToFolder && data.threadId) {
      _params = `inbox/mail`;
      url = `https://fake.url/${_params}`;
      linkUrl = `${url}?status=${TaskStatusType.mailfolder}&externalId=${data.mailFolderId}&threadId=${data.threadId}`;
    }

    if (
      data.type === SocketType.moveTaskToNewTaskGroup &&
      data.targetFolderId
    ) {
      url = `https://fake.url/${_params}`;
      linkUrl = `${url}?taskTypeID=${data.targetFolderId}&taskId=${taskId}`;
    }

    linkUrl = data.defaultLink || linkUrl + mailboxIdQueryString;

    this.isErrorToastVisible = type === EToastCustomType.ERROR;

    this.reportSpamSuccess = type === EToastCustomType.SUCCESS_WITH_UNDO_BTN;

    let message = '';
    if (data.defaultMessage) {
      message = this.generateMessageHtml(data.defaultMessage, data.defaultIcon);
    } else {
      message = this.reportSpamSuccess
        ? this.generateMessageHtmlForToastReportSpam(data.title, data?.message)
        : this.getMessageToast(
            data,
            isCurrentUser,
            undefined,
            isShowMessageSent
          );
    }

    this.handleShowToast(message, linkUrl, type);
  }

  generateConversationRoute = (
    conversationType: EConversationType,
    isFolderName: boolean = false
  ) => {
    switch (conversationType) {
      case EConversationType.APP:
        return isFolderName ? 'Trudi® App' : 'app-messages';
      case EConversationType.SMS:
        return 'sms-messages';
      case EConversationType.MESSENGER:
        return 'facebook-messages';
      case EConversationType.WHATSAPP:
        return 'whatsapp-messages';
      case EConversationType.VOICE_MAIL:
        return isFolderName ? 'Voicemail' : 'voicemail-messages';
      default:
        return isFolderName ? 'Inbox' : 'messages';
    }
  };

  handleShowToastTaskDetailSubNav(
    data: TypeDataFortoast,
    type: EToastCustomType = EToastCustomType.SUCCESS_WITH_VIEW_BTN_SUB_NAV
  ) {
    const message = this.generateMessageHtmlForToastTaskDetail(data?.title);
    return this.handleShowToast(message, '', type).onAction;
  }

  private generateMessageHtmlForToastFailedToConnect() {
    return `
      <img class="toast-custom__image size-20" src="assets/icon/icon-warning-red-fit.svg" />
      <div class="toast-custom__body">
        <div class="toast-custom__body-title">Failed to connect</div>
      </div>
    `;
  }

  private generateMessageHtmlForToastConflictDataError() {
    return `
      <img class="toast-custom__image size-20" src="assets/icon/icon-warning-red-fit.svg" />
      <div class="toast-custom__body">
        <div class="toast-custom__body-title">Data conflict detected</div>
      </div>
    `;
  }

  private generateMessageHtmlForTrudiAiWSError() {
    return `
      <img class="toast-custom__image size-20" src="assets/icon/icon-warning-red-fit.svg" />
      <div class="toast-custom__body d-flex flex-1">
        <div class="toast-custom__body-title flex-1 w-auto">Error has occurred. Please try again.</div>
      </div>
    `;
  }

  private generateMessageHtmlForToastTaskDetail(title: string) {
    return `
      <img class="toast-custom__image size-24" src="assets/icon/check-circle-success.svg" />
      <div class="toast-custom__body">
        <div class="toast-custom__body-title">${title}</div>
      </div>
    `;
  }

  private generateMessageHtmlForToastAddItemToTask(
    title: string,
    errorToast = true,
    icon?: string
  ) {
    const iconToast = icon
      ? icon
      : errorToast
      ? 'assets/icon/icon-warning-red-fit.svg'
      : 'assets/icon/active-checkbox-circle.svg';
    return `
      <img class="toast-custom__image size-20" src="${iconToast}" />
      <div class="toast-custom__body d-flex flex-1">
        <div class="toast-custom__body-title flex-1 w-auto">${title}</div>
      </div>
    `;
  }

  private generateMessageHtmlForToastCurrentUser(title: string) {
    return `
      <img class="toast-custom__image size-24" src="assets/icon/check-circle-success.svg" />
      <div class="toast-custom__body">
        <div class="toast-custom__body-title">${title}</div>
      </div>
    `;
  }

  private generateMessageHtmlForToastIntegrateMailboxFail(title: string) {
    return `
      <img class="toast-custom__image size-20" src="assets/icon/icon-warning-red-fit.svg" />
      <div class="toast-custom__body">
        <div class="toast-custom__body-title">${title}</div>
      </div>
    `;
  }

  private generateMessageHtmlForToastReportSpam(
    title?: string,
    message?: string
  ) {
    return `
      <img class="toast-custom__image size-20" src="assets/icon/check-circle-success.svg" />
      <div class="toast-custom__body">
        <div class="toast-custom__body-title">${title}</div>
        <div class="toast-custom__body-message-ellipsis" *ngIf="message">${message}</div>
      </div>
    `;
  }

  private generateMessageHtmlForExportActivityPDFFileToast(message: string) {
    return `
      <img class="toast-custom__image size-20" src="assets/icon/icon-warning-red-fit.svg" />
      <div class="toast-custom__body">
        <div class="toast-custom__body-title">${message}</div>
      </div>
    `;
  }

  private generateMessageHtmlForToast(
    avatar: string,
    title: string,
    message: string,
    titleName: string,
    isUserUnidentified: boolean
  ) {
    let generatedImageHTML = `<img class="toast-custom__image toast-custom__image--avatar size-32" src="${
      avatar || '/assets/icon/_Avatar.svg'
    }" />`;

    if ((avatar?.includes('google_avatar') || !avatar) && !isUserUnidentified) {
      generatedImageHTML = `<div class="toast-custom__image size-32 toast-custom__image--letter">${this.formatAvatarPMLetter(
        titleName
      )}</div>`;
    }
    return (
      generatedImageHTML +
      `<div class="toast-custom__body">
       <div class="toast-custom__body-title">${titleName} ${title}</div>
       <div class="toast-custom__body-message-ellipsis">${message}</div>
       </div>`
    );
  }

  private generateMessageHtmlForInfoToast(title: string, message: string) {
    return `
      <img class="toast-custom__image size-20" src="/assets/images/icons/icon-toast-info.svg" />
      <div class="toast-custom__body">
        <div class="toast-custom__body-title flex-1 w-auto">${title}</div>
        <div class="toast-custom__body-message-ellipsis">${message}</div>
      </div>
    `;
  }

  private formatAvatarPMLetter(pmName: string) {
    const arrName = `${pmName || ''}`.trim().split(' ') || [];
    if (arrName.length >= 2) {
      return arrName[0].charAt(0) + arrName[1].charAt(0);
    } else if (arrName.length === 1) {
      return arrName[0].charAt(0) + (arrName[0]?.charAt(1) || '');
    } else {
      return '';
    }
  }

  private generateMessageForMergeToast() {
    return `
      <img class="toast-custom__image size-24" src="assets/icon/warning-yellow.svg" />
      <div class="toast-custom__body">
        <div class="toast-custom__body-title">We've detected similar replies in your database. Merge?</div>
      </div>
    `;
  }
  private generateMessageForViewSettingAIReply() {
    return `
      <img class="toast-custom__image size-24" src="assets/icon/check-circle-success.svg" />
      <div class="toast-custom__body">
        <div class="toast-custom__body-title">Automated reply ON. <br/>
        Trudi® will reply on your behalf next time.</div>
      </div>
    `;
  }

  private generateMessageHtmlForAutoReopen(title: string) {
    return `
      <div class="toast-custom__body">
        <div class="toast-custom__body-title">${title}</div>
      </div>
      `;
  }

  private generateMessageHtml(message: string, iconType: EToastType) {
    const iconElements = {
      [EToastType.SUCCESS]: `<img class="toast-custom__image size-24" src="assets/icon/check-circle-success.svg" />`,
      [EToastType.ERROR]: `<img class="toast-custom__image size-20" src="assets/icon/icon-warning-red-fit.svg.svg" />`
    };
    let iconElement = iconElements[iconType] || '';
    return `
      ${iconElement}
      <div class="toast-custom__body">
        <div class="toast-custom__body-title">${message}</div>
      </div>
    `;
  }

  private generateTitleForToast(
    taskType: TaskType,
    statusType: TaskStatusType,
    typeSocket: SocketType,
    conversationType?: EConversationType
  ) {
    if (
      [SocketType.changeStatusTask, SocketType.deleteConversation].includes(
        typeSocket
      )
    ) {
      switch (statusType) {
        case TaskStatusType.inprogress:
        case TaskStatusType.open:
          return this.handleTitleMessageReopen(taskType, conversationType);
        case TaskStatusType.completed:
        case TaskStatusType.resolved:
          return taskType === TaskType.MESSAGE
            ? 'resolved your message'
            : 'completed your task';
        case TaskStatusType.deleted:
          return taskType === TaskType.MESSAGE
            ? 'deleted your message'
            : 'cancelled your task';
        default:
          return null;
      }
    }

    if (typeSocket === SocketType.moveTaskToNewTaskGroup)
      return 'moved your task';
    return typeSocket === SocketType.moveConversation
      ? 'moved your message to an existing task'
      : 'converted your message to a task';
  }

  handleTitleMessageReopen(taskType, conversationType) {
    return taskType === TaskType.MESSAGE ||
      [EConversationType.APP, EConversationType.SMS].includes(conversationType)
      ? 'reopened your message'
      : 'reopened your task';
  }
  generateTitleReopenResolved(
    conversationType: EConversationType,
    type: string
  ) {
    const typeLowerCase =
      type === EConversationType.reopened ? 'reopened' : type.toLowerCase();
    switch (conversationType) {
      case EConversationType.APP:
        return `App message ${typeLowerCase}`;
      case EConversationType.VOICE_MAIL:
        return `Voicemail message ${typeLowerCase}`;
      default:
        return `Message ${typeLowerCase}`;
    }
  }

  private generateTitleForToastCurrentUser(
    data,
    type = EToastCustomType.SUCCESS_WITH_UNDO_BTN_REMINDER,
    isShowMessageSent: boolean = false
  ) {
    const taskType = data.taskType;
    const statusType = data.status;
    const typeSocket = data.type;
    const conversationType = data.conversationType;
    const reminderType = data?.reminderType;
    if (
      [SocketType.changeStatusTask, SocketType.deleteConversation].includes(
        typeSocket
      )
    ) {
      switch (statusType) {
        case TaskStatusType.inprogress:
        case TaskStatusType.open:
          if (
            taskType === TaskType.MESSAGE ||
            taskType === TaskType.TASK_DRAFT ||
            conversationType
          ) {
            return this.generateTitleReopenResolved(
              conversationType,
              EConversationType.reopened
            );
          }
          return 'Task reopened';
        case TaskStatusType.completed:
        case TaskStatusType.resolved:
          if (taskType === TaskType.MESSAGE || conversationType) {
            return this.generateTitleReopenResolved(
              conversationType,
              EConversationType.resolved
            );
          }
          return 'Task completed';
        case TaskStatusType.deleted:
          return taskType === TaskType.MESSAGE
            ? 'Message deleted'
            : 'Task cancelled';
        default:
          return null;
      }
    }

    if (
      [
        SocketType.notifySendBulkAndMessageV3Done,
        SocketType.notifySendBulkMessageDone,
        SocketType.notifySendMessageV3Done,
        SocketType.notifySendManyEmailMessageDone
      ].includes(typeSocket) ||
      isShowMessageSent
    )
      return 'Message sent';

    if (typeSocket === SocketType.newTask || typeSocket === SocketType.send) {
      switch (taskType) {
        case TaskType.SCHEDULE:
        case TaskType.MESSAGE:
          if (typeSocket === SocketType.send) {
            return SCHEDULE_MSG_FOR_SEND;
          }
          return 'Message sent';
        case TaskType.DRAFT:
          return DRAFT_SAVED;
        default:
          if (typeSocket === SocketType.send) {
            return SCHEDULE_MSG_FOR_SEND;
          }
          if (
            [
              ReminderMessageType.FOLLOW_UP,
              ReminderMessageType.UNANSWERED
            ].includes(reminderType)
          ) {
            return 'Message sent';
          }
          return 'Task created';
      }
    }

    if (typeSocket === SocketType.syncGmail) {
      switch (statusType) {
        case EMailBoxStatus.ACTIVE:
          return `<span class="font-italic title-toast-success title-mailbox-success">${data.email}</span> has been added`;
        case EMailBoxStatus.FAIL:
          return `<span class="font-italic title-toast-error title-mailbox-error">${data.email}</span> synced fail. Please try again`;
        default:
          return '';
      }
    }

    if ([SocketType.syncImap, SocketType.syncOutlook].includes(typeSocket)) {
      const { title } = data || {};
      this.isErrorToastVisible = true;

      switch (statusType) {
        case EMailBoxStatus.ACTIVE:
          return `<span class="font-italic title-mailbox-success">${title}</span>`;
        case EMailBoxStatus.FAIL:
          return `<span class="font-italic title-mailbox-error">${title}</span>`;
        default:
          return '';
      }
    }

    if (typeSocket === SocketType.moveToFolder) {
      const MESSAGE_MOVE_TOAST = {
        INPROGRESS: `Message moved to ${this.generateConversationRoute(
          data.conversationType,
          true
        )}`,
        COMPLETED: 'Message moved to Resolved',
        DELETED: 'Message moved to Deleted',
        DRAFT: 'Message moved to Draft',
        FOLDER: `Message moved to ${data.folderName} folder`,
        DELETE_TASK_SPAM: 'Message deleted and reported as spam',
        DELETE_TASK_SPAM_OUTLOOK: 'Message deleted and reported as junk'
      };
      return `${MESSAGE_MOVE_TOAST[statusType]}`;
    }

    if (typeSocket === SocketType.messageToTask) {
      if (data.targetFolderName) {
        return `1 message moved to ${data.targetFolderName} folder`;
      }
      return `Moved your message`;
    }

    if (typeSocket === SocketType.moveTaskToNewTaskGroup) {
      if (data.targetFolderName) {
        return `1 task moved to ${data.targetFolderName} folder`;
      }
      return `Moved your task`;
    }

    if (type === EToastCustomType.SUCCESS_WITH_UNDO_BTN_REMINDER) {
      return data.title;
    }
    return typeSocket === SocketType.moveConversation
      ? 'Message moved to an existing task'
      : 'Message converted to task ';
  }

  private getMessageToast(
    data,
    isCurrentUser: boolean = false,
    type = EToastCustomType.SUCCESS_WITH_UNDO_BTN_REMINDER,
    isShowMessageSent: boolean = false
  ) {
    if (
      [
        SocketType.syncGmail,
        SocketType.syncImap,
        SocketType.syncOutlook
      ].includes(data.type)
    ) {
      const titleHTML = this.generateTitleForToastCurrentUser(
        data,
        undefined,
        isShowMessageSent
      );
      if (data.status === EMailBoxStatus.ACTIVE) {
        return this.generateMessageHtmlForToastCurrentUser(titleHTML);
      }
      if (data.status === EMailBoxStatus.FAIL) {
        return this.generateMessageHtmlForToastIntegrateMailboxFail(titleHTML);
      }
    }

    if (isCurrentUser) {
      const titleHTML = this.generateTitleForToastCurrentUser(
        data,
        type,
        isShowMessageSent
      );

      return this.generateMessageHtmlForToastCurrentUser(titleHTML);
    }

    const nameForWhatsapp = `${data?.firstName || data?.lastName}`?.trim();
    const fullName = `${data.firstName ?? ''} ${data.lastName ?? ''}`?.trim();
    let name = fullName || data.email || 'Unknown';
    let message = `${data.taskTitle || data.taskName} • ${name}`;
    let titleName = data?.pmName || data?.fbUsername;
    let isUserUnidentified: boolean = false;

    if (
      data.isAutoReopen &&
      ![
        EConversationType.MESSENGER,
        EConversationType.WHATSAPP,
        EConversationType.APP,
        EConversationType.VOICE_MAIL
      ].includes(data.conversationType)
    ) {
      const _title = `${
        data.taskTitle || data.taskName
      } was reopened by ${name}`;
      return this.generateMessageHtmlForAutoReopen(_title);
    }

    if (data.taskType === TaskType.TASK) {
      message = `${data.taskTitle || data.taskName} • ${
        data.propertyShortenStreetline || data.propertyShortName || name
      }`;
    }

    if (data.conversationType === EConversationType.VOICE_MAIL) {
      const {
        fromPhoneNumber,
        isTemporary,
        firstName,
        lastName,
        isChangeStatusByPM,
        pmName
      } = data;
      const phoneNumberFormat =
        this.phoneNumberFormat.transform(fromPhoneNumber);
      isUserUnidentified = isTemporary;
      titleName = !isChangeStatusByPM
        ? isUserUnidentified
          ? 'A user'
          : firstName || lastName || 'Unknown'
        : pmName;
      message = `Voicemail - ${
        isTemporary
          ? phoneNumberFormat
          : firstName || lastName || phoneNumberFormat
      }`;
    }

    if (data.conversationType === EConversationType.MESSENGER) {
      message = `Messenger - ${data.fbUsername || 'Unknown'}`;
    }

    if (data.conversationType === EConversationType.APP) {
      message = `Trudi® App - ${data.firstName || data.lastName || 'Unknown'}`;
    }

    if (data.conversationType === EConversationType.WHATSAPP) {
      message = `WhatsApp - ${data?.phoneNumber || nameForWhatsapp || ''}`;
    }

    if (data.conversationType === EConversationType.SMS) {
      ({ titleName, message, isUserUnidentified } =
        this.handleShowSmsToast(data));
    }

    if (
      data.conversationType === EConversationType.WHATSAPP &&
      !data?.isChangeStatusByPM
    ) {
      isUserUnidentified =
        !data?.isChangeStatusByPM &&
        data?.conversationType === EConversationType.WHATSAPP;
      titleName = 'A user';
    }

    // if (data.conversationType === EConversationType.SMS) {
    //   ({ titleName, message, isUserUnidentified } =
    //     this.handleShowSmsToast(data));
    // }

    return this.generateMessageHtmlForToast(
      data?.googleAvatar,
      this.generateTitleForToast(
        data.taskType,
        data.statusTask || data.newStatus || data.status,
        data.type,
        data?.conversationType
      ),
      message,
      titleName,
      isUserUnidentified
    );
  }

  handleShowSmsToast(data) {
    if (!data) return {};
    const { phoneNumber, pmName, newStatus, firstName, lastName } = data;
    const phoneNumberFormat = this.phoneNumberFormat.transform(phoneNumber);
    const isReopenStatus = newStatus === EConversationType.open;
    const message = `SMS - ${
      isReopenStatus
        ? phoneNumberFormat
        : firstName || lastName || phoneNumberFormat
    }`;
    const titleName = isReopenStatus ? 'A user' : pmName;
    return { titleName, message, isUserUnidentified: isReopenStatus };
  }

  handleShowMergeToast() {
    const message = this.generateMessageForMergeToast();
    this.handleShowToast(message, null, EToastCustomType.WARNING_MERGE_REPLIES);
  }

  handleShowSettingAIReply() {
    const message = this.generateMessageForViewSettingAIReply();
    this.handleShowToast(
      message,
      null,
      EToastCustomType.SUCCESS_AUTOMATED_REPLY
    );
  }

  getToastConfig(event: ISendMsgTriggerEvent, isTypeMessage: boolean = false) {
    if (!event?.data) {
      return {
        type:
          event?.type === ISendMsgType.SCHEDULE_MSG
            ? SocketType.send
            : SocketType.newTask,
        pushToAssignedUserIds: []
      };
    }

    const firstEventData = event.data[0];
    const eventDataAsResponse = event.data as ISendMsgResponseV2;
    const jobRemindersData = event.data['jobReminders']?.[0];

    return {
      conversationId:
        firstEventData?.conversationId ||
        eventDataAsResponse?.conversation?.id ||
        jobRemindersData?.conversationId,
      taskId:
        firstEventData?.taskId ||
        eventDataAsResponse?.task?.id ||
        jobRemindersData?.taskId,
      isShowToast: true,
      type:
        event?.type === ISendMsgType.SCHEDULE_MSG
          ? SocketType.send
          : SocketType.newTask,
      mailBoxId: event.mailBoxId || event.data?.['mailBoxId'],
      taskType: !isTypeMessage ? event.data?.['task']?.type : TaskType.MESSAGE,
      pushToAssignedUserIds: [],
      status:
        firstEventData?.messageType ||
        eventDataAsResponse?.task?.status ||
        firstEventData?.status ||
        TaskStatusType.inprogress,
      reminderType: event?.reminderType
    };
  }

  handleShowDownloadPDFToast(toastType: EToastType, isTask: boolean = false) {
    const message =
      EXPORT_PDF_FILE_TOAST_MESSAGE[isTask ? 'task' : 'conversation'][
        toastType
      ];

    this.removeToastByName('exportPDFSyncing');

    switch (toastType) {
      case EToastType.SYNCING:
        const syncingToast = this.toastr.show(
          message,
          '',
          { disableTimeOut: true },
          EToastType.SYNCING
        );

        this.currentDisplayToastIdsMap.set(
          this.toastName.exportPDFSyncing,
          syncingToast.toastId
        );
        this.isRetryExportPDFFile = false;
        break;
      case EToastType.SUCCESS:
        this.syncMessagePropertyTreeService.setStoreExportConversationFilePayload(
          null
        );
        this.toastr.show(message, '', null, EToastType.SUCCESS);
        this.isRetryExportPDFFile = false;
        break;
      case EToastType.ERROR:
        const errorToast = this.handleShowToast(
          this.generateMessageHtmlForExportActivityPDFFileToast(message),
          '',
          isTask
            ? EToastCustomType.FAILED_EXPORT_TASK_ACTIVITY_PDF_FILE
            : EToastCustomType.FAILED_EXPORT_CONVERSATION_HISTORY_PDF_FILE,
          3000
        );

        errorToast.onHidden.subscribe(() => {
          if (!this.isRetryExportPDFFile) {
            this.syncMessagePropertyTreeService.setStoreExportConversationFilePayload(
              null
            );
            this.syncTaskActivityService.setStoreExportTaskActivityPayload(
              null
            );
          }
        });

        this.currentDisplayToastIdsMap.set(
          this.toastName.exportPDFError,
          errorToast.toastId
        );
        break;
    }
  }

  removeToastByName(name: string) {
    const syncingToastId = this.currentDisplayToastIdsMap.get(
      this.toastName[name]
    );
    if (!syncingToastId) return;

    this.toastr.clear(syncingToastId);
    this.currentDisplayToastIdsMap.delete(this.toastName[name]);
  }

  handleRetryExportActivityPDFFile(toastType: EToastCustomType) {
    this.isRetryExportPDFFile = true;
    this.removeToastByName('exportPDFError');
    const isTask =
      toastType === EToastCustomType.FAILED_EXPORT_TASK_ACTIVITY_PDF_FILE;

    setTimeout(() => {
      if (isTask) {
        this.syncTaskActivityService.exportTaskActivityWithStoreData();
      } else {
        this.syncMessagePropertyTreeService.exportConversationFileWithStoreData();
      }
    }, 500);
  }

  handleShowAiSocketError() {
    this.handleShowToast(
      this.generateMessageHtmlForTrudiAiWSError(),
      null,
      EToastCustomType.SUCCESS_WITHOUT_VIEW_BTN,
      3000,
      {
        closeButton: true,
        messageClass: 'd-flex flex-1'
      }
    );
  }

  handleShowToastAddItemToTask(message, errorToast = true, icon?: string) {
    this.handleShowToast(
      this.generateMessageHtmlForToastAddItemToTask(message, errorToast, icon),
      null,
      EToastCustomType.SUCCESS_WITHOUT_VIEW_BTN,
      3000,
      {
        closeButton: true,
        messageClass: 'd-flex flex-1'
      }
    );
  }

  handleShowToastReloadWorkflow(socketData: ISocketUpdateDecision) {
    const pmName = displayName(socketData.firstName, socketData.lastName);
    return this.handleShowToast(
      this.generateMessageHtmlForInfoToast(
        'Task workflow updated',
        `${pmName} changed task workflow`
      ),
      null,
      EToastCustomType.INFO_RELOAD_WORKFLOW,
      5000,
      {
        closeButton: true,
        messageClass: 'd-flex flex-1'
      }
    );
  }

  handleShowToastIgnoredStep(body: UpdateTaskStepsPayload) {
    const title = body.isIgnored ? 'Step ignored' : 'Step unignored';
    return this.handleShowToast(
      this.generateMessageHtml(title, EToastType.SUCCESS),
      null,
      EToastCustomType.IGNORED_STEP_WITH_UNDO_BTN,
      5000,
      {
        closeButton: true,
        messageClass: 'd-flex flex-1'
      }
    );
  }
}
