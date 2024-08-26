import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Observer, Subject, interval } from 'rxjs';
import { distinctUntilChanged, filter, share, takeWhile } from 'rxjs/operators';
import { WebSocketSubject } from 'rxjs/webSocket';
import { UserService as AppUserService } from '@services/user.service';
import { IRentManagerInspection } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/interfaces/rent-manager-inspection.interface';
import { IRentManagerIssue } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { webSocketUrl } from 'src/environments/environment';
import { UserService } from '@/app/dashboard/services/user.service';
import { SocketType } from '@shared/enum/socket.enum';
import { CurrentUser } from '@shared/types/user.interface';
import { RMWidgetData } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { IRentManagerNote } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/interfaces/rent-manager-notes.interface';
import {
  ICurrentNoteViewedSocket,
  IEditNoteMentionSocket,
  INewNoteMentionSocket,
  ISocketAssignContact,
  ISocketChangeConversationProperty,
  ISocketChangeOwner,
  ISocketConvertMultipleTask,
  ISocketData,
  ISocketEmailClientFolder,
  ISocketEndSession,
  ISocketMailBox,
  ISocketMailboxMember,
  ISocketMessageToTask,
  ISocketMoveConversations,
  ISocketMoveMessageToFolder,
  ISocketMoveTaskToNewGroup,
  ISocketNewConversationLog,
  ISocketNewMailBoxFolder,
  ISocketNewMailMessage,
  ISocketNewUnreadNoteData,
  ISocketOutlookMailBox,
  ISocketPullNewArrear,
  ISocketReminderResponse,
  ISocketSecondaryContact,
  ISocketSeenConversation,
  ISocketSyncAttachmentEmailClient,
  ISocketSyncMailboxProgress,
  ISocketSyncConversationToCRM,
  ISocketUnreadCountConversationInTask,
  ISocketUpdateMsgFolder,
  ISocketUserProfileUpdate,
  SocketAgencyAction,
  SocketAgencyTopics,
  SocketBulkCreateTask,
  SocketCallData,
  SocketJob,
  SocketMessage,
  SocketNotificationData,
  SocketNotifySendBulkMessageDoneData,
  SocketNotifySendManyEmailMessageDone,
  SocketNotifySyncPropertyDocumentToPTData,
  SocketSendData,
  SocketUnreadCountData,
  SocketUnreadTask,
  SocketUpdateAgencyStatus,
  SocketUpdateMessageViaEmailStatus,
  SocketUserMailBoxUnread,
  SocketWidgetCallData,
  ISocketReloadInternalNoteData,
  ISocketVersionUpdateRequest,
  ISocketSyncTaskActivityToPT,
  ISocketBulkMail,
  ISocketChangeStatusTask,
  ISocketGenerateMessageSummary,
  ISocketTranscriptCompleted,
  ISocketDeleteLinkedConversation,
  ISocketMoveConversation,
  ISocketPageFacebookMessenger,
  ISocketNewTicket,
  ISocketSeenEmailFolder,
  ISocketUpdateTaskStep,
  ISocketUpdateDecision,
  ISocketPageWhatsAppMessenger,
  ISocketReadTicket,
  ISocketTicketChange,
  ISocketPmJoinConversation
} from './../shared/types/socket.interface';
import { Auth0Service } from './auth0.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { ITaskGroup } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { captureExceptionToSentry } from '@/app/sentry';
import { IMessage } from '@shared/types/message.interface';
import { CompanyService } from './company.service';
import { EMessageConversationType } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { Router } from '@angular/router';
import { EMessageComeFromType } from '@/app/shared/enum';
import { IFacebookMessageReaction } from '../dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';

@Injectable({
  providedIn: 'root'
})
export class RxWebsocketService {
  private reconnectionObservable: Observable<number>;
  private pingReconnectionObservable: Observable<number>;
  private socket: WebSocketSubject<any>;
  private connectionObserver: Observer<boolean>;
  public connectionStatus: Observable<boolean>;
  public onSocketNotifySendBulkMessageDone =
    new Subject<SocketNotifySendBulkMessageDoneData>();
  public onSocketSend = new Subject<SocketSendData>();
  // must use for typing message
  // when change conversation we will keep data for typing message
  public onTypingMessage$ = new BehaviorSubject<SocketSendData>(null);
  public onSocketCall = new Subject<SocketCallData>();
  public onSocketTask = new Subject<any>();
  public onSocketRemider = new Subject<void>();
  // TODO: onSocketTask fix any type and onSocketTask should catch socket for task list
  public onSocketMessage = new Subject<SocketMessage>();
  // TODO: delete onSocketCountTask after delete sidebar-navigation
  public onSocketCountTask = new Subject<SocketUnreadCountData>();
  public onSocketStatisticTask = new Subject<SocketUnreadTask>();
  public onSocketStatisticTaskChannel = new Subject<SocketUnreadTask>();
  public onSocketNotification = new Subject<SocketNotificationData>();
  public onSocketConv = new Subject<any>();
  public onSocketFileUpload = new Subject<SocketWidgetCallData>();
  public onSocketFileCall = new Subject<SocketWidgetCallData>();
  public onSocketBulkMessage = new Subject<any>();
  public onSocketSync = new Subject<any>();
  public onSocketPing = new Subject<any>();
  public onSocketMarkRead = new Subject<any>();
  public onSocketVoiceStatus = new Subject<any>();
  public onSocketVoiceCall = new Subject<any>();
  public onSocketBulkEmail = new Subject<ISocketBulkMail>();
  public onSocketNewInvoice = new Subject<any>();
  public onSocketMaintenanceNotes = new Subject<any>();
  public onSocketJob = new Subject<SocketJob>();
  public onSocketTopics = new Subject<SocketAgencyTopics>();
  public onSocketAgencyAction = new Subject<SocketAgencyAction>();
  public onSocketNotifySyncPropertyDocumentToPT =
    new Subject<SocketNotifySyncPropertyDocumentToPTData>();
  public onSocketUpdateAgencyStatus = new Subject<SocketUpdateAgencyStatus>();
  public onSocketUpdateAgencyTimezone = new Subject<ISocketData<string>>();
  public onSocketMessageViaEmail =
    new Subject<SocketUpdateMessageViaEmailStatus>();
  public onSocketUpdateRole = new Subject<CurrentUser>();
  public onSocketUpdateTaskStatus = new Subject<any>();
  public onSocketReiformTokenUpdate = new Subject<{ reiToken: string }>();
  public onSocketServiceIssue = new Subject<ISocketData<IRentManagerIssue>>();
  public onSocketPurchaseOrder = new Subject<ISocketData<any>>();
  public onSocketSyncMailBox = new Subject<ISocketMailBox>();
  public onSocketMailboxFolder = new Subject<ISocketNewMailBoxFolder>();
  public onSocketSyncSpamMailBox = new Subject<ISocketData<any>>();
  public onSocketServiceNote = new Subject<ISocketData<IRentManagerNote>>();
  public onSocketIssueInvoiceDetail = new Subject<ISocketData<any>>();
  public onSocketChangeOwner = new Subject<ISocketChangeOwner>();
  public onSocketUpdateMailboxMember = new Subject<ISocketMailboxMember>();
  public onSocketUpdatePermissionMailBox = new Subject<ISocketData<any>>();
  public onSocketDeactivatedUser = new Subject<ISocketData<any>>();
  public onSocketSyncCalendar = new Subject<ISocketOutlookMailBox>();
  public onSocketSyncRmInspection = new Subject<
    ISocketData<IRentManagerInspection>
  >();
  public onSocketSyncRmWidget = new Subject<ISocketData<RMWidgetData>>();
  public onSocketConvertMultipleTask =
    new Subject<ISocketConvertMultipleTask>();
  public onSocketSyncMailboxProgress =
    new Subject<ISocketSyncMailboxProgress>();
  public onSocketSyncResolveNote = new Subject<ISocketSyncConversationToCRM>();
  public onSocketSyncConversationToPT =
    new Subject<ISocketSyncConversationToCRM>();
  public onSocketNewNoteMention = new Subject<
    ISocketData<INewNoteMentionSocket>
  >();
  public onSocketEditNoteMention = new Subject<
    ISocketData<IEditNoteMentionSocket>
  >();
  public onSocketArchiveMailbox = new Subject<void>();
  public onSocketMoveConversations = new Subject<ISocketMoveConversations>();
  public onSocketMoveConversation = new Subject<ISocketMoveConversation>();
  public onSocketMoveMessageToFolder =
    new Subject<ISocketMoveMessageToFolder>();
  public onSocketMoveEmailStatus = new Subject<any>();
  public onSocketBulkCreateTasks = new Subject<SocketBulkCreateTask>();
  public onSocketMessageToTask = new Subject<ISocketMessageToTask>();
  public onSocketTaskFolder = new Subject<ISocketData<unknown>>();
  public onSocketCurrentNoteViewed = new Subject<ICurrentNoteViewedSocket>();
  public onSocketSeenConversation = new Subject<ISocketSeenConversation>();
  public onSocketSeenEmailFolder = new Subject<ISocketSeenEmailFolder>();
  public onSocketTaskGroup = new Subject<ISocketData<ITaskGroup>>();
  public onSocketMoTaskToGroup = new Subject<ISocketMoveTaskToNewGroup>();
  public onSocketUserProfile = new Subject<ISocketUserProfileUpdate>();
  public onSocketPromotion = new Subject();
  public onSocketNotifySendV3MessageDone =
    new Subject<SocketNotifySendBulkMessageDoneData>();
  public onSocketNotifySendBulkAndV3MessageDone =
    new Subject<SocketNotifySendBulkMessageDoneData>();
  private readonly reconnectInterval: number = 5000;
  private reconnectAttempts: number = 10;
  private webSocketUrl: string = webSocketUrl;
  private wsEndpoint: string;
  private selectedUser: CurrentUser;
  private companyId: string;
  public onSocketPullNewArrear = new Subject<ISocketPullNewArrear>();
  public onSyncAttachmentMailClient =
    new Subject<ISocketSyncAttachmentEmailClient>();
  public onSocketEmailClientFolder = new Subject<ISocketEmailClientFolder>();
  public onSocketUpdateMsgFolder = new Subject<ISocketUpdateMsgFolder>();
  public onSocketNewMessageConversationLog = new Subject<IMessage>();
  public onSocketEndSessionConversationLog = new Subject<ISocketEndSession>();
  public onSocketNewConversationLog = new Subject<ISocketNewConversationLog>();
  public onSocketNotifySendManyEmailMessageDone =
    new Subject<SocketNotifySendManyEmailMessageDone>();
  public onSocketUserMailBoxUnread = new Subject<SocketUserMailBoxUnread>();
  public onSocketNewUnreadNoteData = new Subject<ISocketNewUnreadNoteData>();
  public onSocketReloadInternalNoteData =
    new Subject<ISocketReloadInternalNoteData>();
  public onSocketAssignContact = new Subject<ISocketAssignContact>();
  public onSocketUnreadConversationInTask =
    new Subject<ISocketUnreadCountConversationInTask>();
  public onSocketDeleteDraft = new Subject<SocketSendData>();
  public onSocketReminderMessage = new Subject<ISocketReminderResponse>();
  public onSocketNewMailMessage = new Subject<ISocketNewMailMessage>();
  public onSocketDeleteSecondaryContact =
    new Subject<ISocketSecondaryContact>();
  public onSocketChangeConversationProperty =
    new Subject<ISocketChangeConversationProperty>();
  public onSocketVersionUpdateRequest =
    new Subject<ISocketVersionUpdateRequest>();
  public onSocketSyncTaskActivityToPT =
    new Subject<ISocketSyncTaskActivityToPT>();
  public onSocketChangeStatusTaskToTaskDetail =
    new Subject<ISocketChangeStatusTask>();
  public onSocketGenerateMessageSummary =
    new Subject<ISocketGenerateMessageSummary>();

  public onSocketTranscriptCompleted =
    new Subject<ISocketTranscriptCompleted>();

  public onSocketDeleteLinkedConversation =
    new Subject<ISocketDeleteLinkedConversation>();

  public onSocketFacebookPageAction =
    new Subject<ISocketPageFacebookMessenger>();
  public onSocketWhatsappPageAction =
    new Subject<ISocketPageWhatsAppMessenger>();
  public onSocketNewTicket = new Subject<ISocketNewTicket>();
  public onSocketUpdateTaskStep = new Subject<ISocketUpdateTaskStep>();
  public onSocketUpdateDecision = new Subject<ISocketUpdateDecision>();
  public onSocketReadTicket = new Subject<ISocketReadTicket>();
  public onSocketTicketChange = new Subject<ISocketTicketChange>();
  public onSocketPmJoinConversation = new Subject<ISocketPmJoinConversation>();
  public onSocketMessageReaction = new Subject<IFacebookMessageReaction>();

  constructor(
    private auth0Service: Auth0Service,
    private userService: UserService,
    private appUserService: AppUserService,
    private toastCustomService: ToastCustomService,
    private router: Router,
    private companyService: CompanyService
  ) {
    this.connectionStatus = new Observable<boolean>((observer) => {
      this.connectionObserver = observer;
    }).pipe(share(), distinctUntilChanged());

    this.connectionStatus.subscribe((isConnected) => {
      if (
        !this.reconnectionObservable &&
        typeof isConnected === 'boolean' &&
        !isConnected
      ) {
        this.reconnect();
      } else {
        this.pingReconnect();
      }
    });

    this.userService
      .getSelectedUser()
      .pipe(filter((res) => res && !!res.id))
      .subscribe((res) => {
        this.selectedUser = res;

        this.wsEndpoint =
          this.webSocketUrl +
          `?Authorization=Bearer ${this.auth0Service.getAccessToken()}&userId=${
            res.id
          }`;
      });

    this.companyService
      .getCurrentCompanyId()
      .pipe(filter(Boolean))
      .subscribe((companyId) => {
        this.companyId = companyId;
      });
  }

  defaultResultSelector = (e: MessageEvent) => {
    return JSON.parse(e.data);
  };

  defaultSerializer = (data: any): string => {
    return JSON.stringify(data);
  };

  connect(selectedUser): void {
    if (!this.wsEndpoint) {
      this.connectionObserver.next(false);
      this.wsEndpoint =
        this.webSocketUrl +
        `?Authorization=Bearer ${this.auth0Service.getAccessToken()}&userId=${
          selectedUser.id
        }`;
    }
    if (
      (!this.socket || this.socket.closed) &&
      this.wsEndpoint &&
      this.wsEndpoint !== ''
    ) {
      this.socket = new WebSocketSubject({
        url: this.wsEndpoint,
        closeObserver: {
          next: (e: CloseEvent) => {
            this.socket = null;
            this.connectionObserver.next(false);
          }
        },
        openObserver: {
          next: (e: Event) => {
            this.connectionObserver.next(true);
          }
        }
      });
      this.socket
        .pipe(
          distinctUntilChanged(
            (prev, curr) =>
              curr?.socketTrackId && prev?.socketTrackId === curr.socketTrackId
          )
        )
        .subscribe(
          (data) => {
            this.filterSocketType(data);
          },
          (error: Event) => {
            if (!this.socket) {
              this.reconnect();
            }
          }
        );
    }
  }

  pingReconnect() {
    this.pingReconnectionObservable = interval(30000);
    this.pingReconnectionObservable.subscribe(() => {
      const param = {
        type: 'PING',
        userId: this.selectedUser.id,
        Authorization: 'Bearer ' + this.auth0Service.getAccessToken()
      };
      this.send(param);
    });
  }

  reconnect(): void {
    this.reconnectionObservable = interval(this.reconnectInterval).pipe(
      takeWhile((index) => {
        return index < this.reconnectAttempts && !this.socket;
      })
    );
    this.reconnectionObservable.subscribe(
      () => {
        this.connect(this.selectedUser);
      },
      null,
      () => {
        this.reconnectionObservable = null;
        if (!this.socket) {
          this.socketComplete();
          this.connectionObserver.complete();
        }
      }
    );
  }

  send(data: any): void {
    this.socket.next(data);
  }

  checkIgnoreCurrentUser(fromUserId: string) {
    if (!fromUserId) return true;
    if (localStorage.getItem('userId').trim() === fromUserId.trim())
      return false; // update => false
    return true;
  }

  filterSocketType(data) {
    if (window.location.href.includes('attic') && data?.env !== 'attic') {
      return;
    }

    if (data.type === SocketType.newMessageReaction) {
      this.onSocketMessageReaction.next(data);
      return;
    }

    if (data.type === SocketType.ticketChange) {
      this.onSocketTicketChange.next(data);
      return;
    }

    if (
      SocketType.newMessages === data.type &&
      data.conversationType === EMessageComeFromType.MESSENGER
    ) {
      this.onSocketStatisticTaskChannel.next(data);
    }

    if (
      [
        SocketType.assignTask,
        SocketType.newMessages,
        SocketType.deleteConversation,
        SocketType.changeStatusTask,
        SocketType.messageToTask,
        SocketType.updateTask
      ].includes(data.type || data.params?.type)
    ) {
      this.onSocketRemider.next();
    }

    if (
      data.type === SocketType.facebookPageAction &&
      data.companyId === this.companyId
    ) {
      this.onSocketFacebookPageAction.next(data.data);
      return;
    }

    if (
      data.type === SocketType.whatsappPageAction &&
      data.companyId === this.companyId
    ) {
      this.onSocketWhatsappPageAction.next(data.data);
      return;
    }

    if (
      [
        SocketType.deleteSecondaryEmail,
        SocketType.deleteSecondaryPhone,
        SocketType.deleteInternalContact
      ].includes(data.type)
    ) {
      if (data.companyId === this.companyId) {
        this.onSocketDeleteSecondaryContact.next(data);
      }
      return;
    }

    if ((data.type || data.params?.type) === SocketType.markRead) {
      this.onSocketMarkRead.next(data);
      return;
    }

    if (data.type === SocketType.deleteLinkedConversation) {
      this.onSocketDeleteLinkedConversation.next(data);
      return;
    }

    if (data.type === SocketType.taskActivity) {
      this.onSocketSyncTaskActivityToPT.next(data);
      return;
    }

    if (data.type === SocketType.deleteDraftMessage) {
      this.onSocketDeleteDraft.next(data);
      return;
    }

    if (data.type === SocketType.messageReminder) {
      this.onSocketReminderMessage.next(data);
      return;
    }

    if (data.type === SocketType.newMailMessage) {
      this.onSocketNewMailMessage.next(data);
      return;
    }

    if (data.type === SocketType.assignContact) {
      this.onSocketAssignContact.next(data);
      return;
    }

    if (data.type === SocketType.newMessageConversationLog) {
      this.onSocketNewMessageConversationLog.next(data.message);
      return;
    }

    if (data.type === SocketType.endSessionConversationLog) {
      this.onSocketEndSessionConversationLog.next(data);
      return;
    }

    if (data.type === SocketType.newConversationLog) {
      this.onSocketNewConversationLog.next(data);
      return;
    }

    if (data.type === SocketType.updateMsgFolder) {
      this.onSocketUpdateMsgFolder.next(data);
      return;
    }

    if (data.type === SocketType.emailClientFolder) {
      this.onSocketEmailClientFolder.next(data);
      return;
    }

    if (data.type === SocketType.syncAttachmentEmailClient) {
      this.onSyncAttachmentMailClient.next(data);
      return;
    }

    if (data.type === SocketType.pullNewArrear) {
      this.onSocketPullNewArrear.next(data);
      return;
    }

    if (data.type === SocketType.syncResolveNote) {
      this.onSocketSyncResolveNote.next(data);
      return;
    }

    if (data.type === SocketType.syncConversationPT) {
      this.onSocketSyncConversationToPT.next(data);
      return;
    }

    if (data.type === SocketType.archiveMailbox) {
      this.onSocketArchiveMailbox.next();
      return;
    }

    if (data.type === SocketType.updateUserProfile) {
      this.onSocketUserProfile.next(data);
      return;
    }

    if (
      [SocketType.promotionChange, SocketType.promotionPublished].includes(
        data.type
      )
    ) {
      this.onSocketPromotion.next({
        ...data,
        promotionType:
          data.type === SocketType.promotionChange
            ? SocketType.promotionChange
            : SocketType.promotionPublished
      });
      return;
    }

    if (data.type === SocketType.updateAgencyStatus) {
      this.onSocketUpdateAgencyStatus.next(data);
      return;
    }

    if (
      [
        SocketType.notifySendBulkMessageDone,
        SocketType.notifySendManyEmailMessageDone
      ].includes(data.type)
    ) {
      this.onSocketNotifySendBulkMessageDone.next(data);
      return;
    }

    if (data.type === SocketType.emailStatusChange) {
      this.onSocketMessageViaEmail.next(data);
      return;
    }

    if (data.type === SocketType.notifySyncPropertyDocumentToPT) {
      return this.onSocketNotifySyncPropertyDocumentToPT.next(data);
    }

    if (data.type === SocketType.agencyAction) {
      this.onSocketAgencyAction.next(data);
      return;
    }

    if (data.type === SocketType.transcriptCompleted) {
      this.onSocketTranscriptCompleted.next(data);
      return;
    }

    if (data.type === SocketType.reiformTokenUpdate) {
      this.onSocketReiformTokenUpdate.next(data);
      return;
    }

    if (data.type === SocketType.versionUpdateRequest) {
      this.onSocketVersionUpdateRequest.next(data);
      return;
    }

    if ((data.type || data.params?.type) === SocketType.send) {
      this.onSocketSend.next(data);
      this.onTypingMessage$.next(data);
      return;
    }

    if (data.type === SocketType.changeConversationProperty) {
      this.onSocketChangeConversationProperty.next(data);
      return;
    }

    if (data.type === SocketType.moveMessageToFolder) {
      this.onSocketMoveMessageToFolder.next(data);
      return;
    }

    if (data.type === SocketType.userMailBoxUnread) {
      this.onSocketUserMailBoxUnread.next(data);
      return;
    }
    if (data.type === SocketType.unreadCountConversationInTask) {
      this.onSocketUnreadConversationInTask.next(data);
      return;
    }

    if (data.type === SocketType.changeConversationProperty) {
      this.onSocketChangeConversationProperty.next(data);
      return;
    }

    if (
      data.type !== SocketType.voiceStatus &&
      data.type !== SocketType.sync &&
      data.type !== SocketType.editInternalNote &&
      data.type !== SocketType.deleteNotification &&
      (!data || (data.companyId || data.data?.companyId) !== this.companyId)
    ) {
      return;
    }

    if ((data.type || data.params?.type) == SocketType.changeStatusTask) {
      this.onSocketMessage.next(data);
      if (data.taskType === TaskType.TASK) {
        this.onSocketTask.next(data);
      }
      this.onSocketUpdateTaskStatus.next(data);
    }
    if (data.type === SocketType.updateTask) {
      this.onSocketTask.next(data);
    }
    if (this.checkIgnoreCurrentUser(data.fromUserId || data.data?.fromUserId)) {
      // Hide toasts mentioned changes related to PM items, if any customer complains we might reinstate

      // if (
      //   [SocketType.messageToTask, SocketType.moveConversation].includes(
      //     data.type || data.params?.type
      //   )
      // ) {
      //   this.toastCustomService.openToastCustom(data);
      // }

      // if (
      //   ([SocketType.changeStatusTask].includes(
      //     data.type || data.params?.type
      //   ) &&
      //     [
      //       EMessageConversationType.SMS,
      //       EMessageConversationType.APP,
      //       EMessageConversationType.EMAIL,
      //       EMessageConversationType.VOICE_MAIL,
      //       EMessageConversationType.MESSENGER,
      //       EMessageConversationType.WHATSAPP
      //     ].includes(data?.conversationType)) ||
      //   data.newStatus === TaskStatusType.deleted
      // ) {
      //   const taskDetailRoute = '/inbox/detail/';
      //   if (this.router.url.includes(taskDetailRoute)) {
      //     this.onSocketChangeStatusTaskToTaskDetail.next(data);
      //   } else {
      //     this.toastCustomService.openToastCustom(data);
      //   }
      // }

      if (SocketType.deleteConversation === data.type) {
        const _data = {
          taskId: data.task.id,
          agencyId: data.agencyId,
          googleAvatar: data.googleAvatar,
          isShowToast: data.isShowToast,
          firstName: data.task.firstName,
          lastName: data.task.lastName,
          type: data.type,
          fromUserId: data.fromUserId,
          mailBoxId: data.mailBoxId,
          taskName: data.task.title,
          taskType: data.task.type,
          email: data.task.email,
          status: data.task.status,
          pushToAssignedUserIds: data.task.pushToAssignedUserIds,
          pmName: data.pmName,
          isAutoReopen: data?.isAutoReopen || false
        };

        this.toastCustomService.openToastCustom(_data);
      }

      // Hide toasts mentioned changes related to PM items, if any customer complains we might reinstate

      // if (
      //   SocketType.moveTaskToNewTaskGroup === (data.type || data.data?.type)
      // ) {
      //   const responseData = data.data;
      //   for (const element of responseData.tasks || responseData.data?.tasks) {
      //     if (
      //       element.assignToAgents.some(
      //         (item) => item.id === localStorage.getItem('userId').trim()
      //       )
      //     ) {
      //       if (!responseData.isAutoReopen) {
      //         const _data = {
      //           firstName: responseData?.firstName,
      //           lastName: responseData?.lastName,
      //           taskId: element.id,
      //           type: responseData.type,
      //           fromUserId: responseData.fromUserId,
      //           mailBoxId: responseData.mailBoxId,
      //           taskName: element.title,
      //           taskType: element.type,
      //           googleAvatar: responseData.googleAvatar,
      //           isShowToast: responseData.isShowToast,
      //           propertyShortenStreetline: element?.property?.shortenStreetline,
      //           pushToAssignedUserIds: element.assignToAgents.map(
      //             (item) => item.id
      //           ),
      //           pmName: responseData.pmName
      //         };
      //         this.toastCustomService.openToastCustom(_data);
      //       }
      //     }
      //   }
      // }
    }

    if (
      [
        SocketType.deleteConversation,
        SocketType.changeStatusTask,
        SocketType.updateAgencyTopics
      ].includes(data.type || data.params?.type)
    ) {
      if (data.conversationType === EMessageComeFromType.MESSENGER) {
        this.onSocketStatisticTaskChannel.next(data);
        return;
      }

      this.onSocketStatisticTask.next(data);
      return;
    }

    if (data.type === SocketType.serviceIssue) {
      if (data.companyId === this.companyId) {
        this.onSocketServiceIssue.next(data);
      }
      return;
    }

    if (data.type === SocketType.serviceIssuePurchaseOrder) {
      if (data.companyId === this.companyId) {
        this.onSocketPurchaseOrder.next(data);
      }
      return;
    }

    if (data.type === SocketType.historyNote) {
      if (data.companyId === this.companyId) {
        this.onSocketServiceNote.next(data);
      }
      return;
    }

    if (data.type === SocketType.serviceIssueInvoiceDetail) {
      if (data.companyId === this.companyId) {
        this.onSocketIssueInvoiceDetail.next(data);
      }
      return;
    }

    if (data.type === SocketType.convertMultipleTask) {
      if (data.companyId === this.companyId) {
        this.onSocketConvertMultipleTask.next(data);
      }
      return;
    }

    if (data.type === SocketType.syncMailboxProgress) {
      if (data.companyId === this.companyId) {
        this.onSocketSyncMailboxProgress.next(data);
      }
      return;
    }

    switch (data.type) {
      case SocketType.messageToTask:
        if (data.companyId === this.companyId)
          this.onSocketMessageToTask.next(data);
        break;
      default:
        break;
    }

    // if (data.type === SocketType.syncResolveNote) {
    //   this.onSocketSyncResolveNote.next(data);
    //   return;
    // }

    if (data.type === SocketType.readTicket) {
      this.onSocketReadTicket.next(data);
      return;
    }

    if (data.type === SocketType.newTicket) {
      this.onSocketNewTicket.next(data);
      return;
    }

    if (data.type === SocketType.generateMessageSummary) {
      this.onSocketGenerateMessageSummary.next(data);
      return;
    }

    if (data.type === SocketType.moveConversation && data?.isMoveMultiple) {
      this.onSocketMoveConversations.next(data);
      return;
    }

    if (data.type === SocketType.moveConversation && !data?.isMoveMultiple) {
      this.onSocketMoveConversation.next(data);
      return;
    }

    if (data.type === SocketType.moveMessageStatus) {
      this.onSocketMoveEmailStatus.next(data);
      return;
    }

    if (data.type === SocketType.moveConversation) {
      this.onSocketConv.next(data);
      return;
    }

    if (data.type === SocketType.seenState) {
      this.onSocketSeenConversation.next(data);
      if (data.conversationType === EMessageComeFromType.MESSENGER) {
        this.onSocketStatisticTaskChannel.next(data);
      } else {
        this.onSocketStatisticTask.next(data);
      }
      return;
    }

    if (data.type === SocketType.seenEmailFolder) {
      this.onSocketSeenEmailFolder.next(data);
      return;
    }

    if (data.type === SocketType.updateTaskStep) {
      this.onSocketUpdateTaskStep.next(data);
      return;
    }

    if (
      !this.checkIgnoreCurrentUser(data.fromUserId || data.data?.fromUserId)
    ) {
      return;
    }

    switch (data.type || data.data?.type) {
      case SocketType.createdTaskGroup:
      case SocketType.updatedTaskGroup:
      case SocketType.deletedTaskGroup:
        this.onSocketTaskGroup.next(data);
        return;
      case SocketType.moveTaskToNewTaskGroup:
        this.onSocketMoTaskToGroup.next(data);
        return;
      case SocketType.messageToTask:
        this.onSocketMessage.next(data);
        this.onSocketTask.next(data);
        return;
    }

    if (
      [
        SocketType.addNotification,
        SocketType.updateNotification,
        SocketType.reloadNotification,
        SocketType.deleteNotification
      ].includes(data.type || data.params?.type)
    ) {
      this.onSocketNotification.next(data);
      return;
    }

    if ([SocketType.shareMailboxMember].includes(data.type)) {
      this.onSocketUpdateMailboxMember.next(data);
      return;
    }

    if (
      [SocketType.unreadTask].includes(
        data.type || data.params?.type || data.data?.type
      )
    ) {
      this.onSocketStatisticTask.next(data);
      this.onSocketStatisticTaskChannel.next(data);
      return;
    }

    if ((data.type || data.params?.type) === SocketType.call) {
      this.onSocketCall.next(data);
      return;
    }

    if (
      [SocketType.fileUpload, SocketType.newFileMessage].includes(
        data.type || data.params?.type
      )
    ) {
      this.onSocketFileUpload.next(data);
      return;
    }

    if ((data.type || data.params?.type) === SocketType.fileCall) {
      this.onSocketFileCall.next(data);
      return;
    }

    if ((data.type || data.params?.type) === SocketType.bulkMessage) {
      this.onSocketBulkMessage.next(data);
      return;
    }

    if ((data.type || data.params?.type) === SocketType.maintenanceNoteUpdate) {
      this.onSocketMaintenanceNotes.next(data);
      return;
    }

    if ((data.type || data.params?.type) === SocketType.ping) {
      this.onSocketPing.next(data);
      return;
    }

    if (data.type === SocketType.agencyTimezoneChanged) {
      this.onSocketUpdateAgencyTimezone.next(data);
      return;
    }

    if (
      [
        SocketType.sync,
        SocketType.syncSendInvoice,
        SocketType.syncPTMaintenace
      ].includes(data.type || data.params?.type)
    ) {
      this.onSocketSync.next(data);
      return;
    }

    if ((data.type || data.params?.type) === SocketType.assignTask) {
      this.onSocketStatisticTask.next(data);
      this.onSocketStatisticTaskChannel.next(data);
    }

    if (
      [
        SocketType.newMessages,
        SocketType.assignTask,
        SocketType.changeStatusTask,
        SocketType.updateTask
      ].includes(data.type || data.params?.type)
    ) {
      this.onSocketMessage.next(data);
    }

    if (
      [
        SocketType.task,
        SocketType.newTask,
        SocketType.newTasks,
        SocketType.newMessages,
        SocketType.assignTask,
        SocketType.updateTask,
        SocketType.permanentlyDeleteTask
      ].includes(data.type || data.params?.type)
    ) {
      this.onSocketTask.next(data);
      return;
    }

    if (
      [
        SocketType.newConversation,
        SocketType.deleteConversation,
        SocketType.newFileMessage
      ].includes(data.type || data.params?.type)
    ) {
      this.onSocketConv.next(data);
      return;
    }

    if ((data.type || data.params?.type) === SocketType.voiceStatus) {
      this.onSocketVoiceStatus.next(data);
      return;
    }

    if ((data.type || data.params?.type) === SocketType.voiceCall) {
      this.onSocketVoiceCall.next(data);
      return;
    }

    if ((data.type || data.params?.type) === SocketType.bulkEmail) {
      this.onSocketBulkEmail.next(data);
      return;
    }

    if ((data.type || data.params?.type) === SocketType.newInvoice) {
      this.onSocketNewInvoice.next(data);
      return;
    }

    if (
      [
        SocketType.forceCompleteJob,
        SocketType.completeJob,
        SocketType.updatedJob,
        SocketType.removedJob,
        SocketType.newScheduleJob
      ].includes(data.type)
    ) {
      this.onSocketJob.next(data);
      return;
    }

    if ((data.type || data.params?.type) === SocketType.updateAgencyTopics) {
      this.onSocketTopics.next(data);
      return;
    }

    if (data.type === SocketType.updateRole) {
      this.appUserService
        .handleUpdateRoleRealTime(data?.userId)
        .subscribe((data) => {
          if (!data) return;
          this.onSocketUpdateRole.next(data);
        });
      return;
    }

    if (data.type === SocketType.changeOwner) {
      this.onSocketChangeOwner.next(data);
      return;
    }

    if (data.type === SocketType.deactivatedUser) {
      this.onSocketDeactivatedUser.next(data);
      if (this.selectedUser?.id === data?.userId) {
        captureExceptionToSentry(
          {
            message: 'FORCED_LOGOUT:ERROR - filterSocketType - deactivatedUser'
          },
          { level: 'error' }
        );
        this.auth0Service.handleLogout();
      }
      return;
    }

    if (data.type === SocketType.updatePublicFacing) {
      this.appUserService.setCurrentUser(false).subscribe();
      return;
    }

    if (data.type === SocketType.syncGmail) {
      this.onSocketSyncMailBox.next(data);
      return;
    }

    if (data.type === SocketType.newMailboxFolder) {
      this.onSocketMailboxFolder.next(data);
      return;
    }

    if (data.type === SocketType.syncNewSpamGmail) {
      this.onSocketSyncSpamMailBox.next(data);
      return;
    }

    if (data.type === SocketType.updatePermissionMailBoxMember) {
      this.onSocketUpdatePermissionMailBox.next(data);
      return;
    }

    if (data.type === SocketType.syncCalendar) {
      this.onSocketSyncCalendar.next(data);
      return;
    }

    if (data.type === SocketType.rmInspection) {
      this.onSocketSyncRmInspection.next(data);
      return;
    }

    if (data.type === SocketType.rmNewTenant) {
      this.onSocketSyncRmWidget.next(data);
      return;
    }

    if (data.type === SocketType.newInternalNote) {
      this.onSocketNewNoteMention.next(data);
      return;
    }

    if (data.type === SocketType.editInternalNote) {
      this.onSocketEditNoteMention.next(data);
      return;
    }

    if (data.type === SocketType.bulkCreateTasks) {
      this.onSocketBulkCreateTasks.next(data);
      return;
    }

    if (
      [
        SocketType.deletedTaskFolder,
        SocketType.updateTaskFolder,
        SocketType.createTaskFolder
      ].includes(data.type)
    ) {
      this.onSocketTaskFolder.next(data);
      return;
    }

    if (data.type === SocketType.currentNoteViewed) {
      this.onSocketCurrentNoteViewed.next(data);
      return;
    }

    if (data.type === SocketType.notifySendMessageV3Done) {
      this.onSocketNotifySendV3MessageDone.next(data);
      return;
    }

    if (data.type === SocketType.notifySendBulkAndMessageV3Done) {
      this.onSocketNotifySendBulkAndV3MessageDone.next(data);
      return;
    }

    if (data.type === SocketType.notifySendManyEmailMessageDone) {
      this.onSocketNotifySendManyEmailMessageDone.next(data);
      return;
    }

    if (data.type === SocketType.newUnreadNoteData) {
      this.onSocketNewUnreadNoteData.next(data);
      return;
    }

    if (data.type === SocketType.reloadInternalNote) {
      this.onSocketReloadInternalNoteData.next(data);
      return;
    }

    if (data.type === SocketType.updateDecision) {
      this.onSocketUpdateDecision.next(data);
      return;
    }

    if (data.type === SocketType.pmJoinConversation) {
      this.onSocketPmJoinConversation.next(data);
      return;
    }
  }

  socketComplete() {
    this.onSocketUserProfile.complete();
    this.onSocketSend.complete();
    this.onSocketCall.complete();
    this.onSocketPing.complete();
    this.onSocketFileUpload.complete();
    this.onSocketFileCall.complete();
    this.onSocketMarkRead.complete();
    this.onSocketBulkMessage.complete();
    this.onSocketSync.complete();
    this.onSocketTask.complete();
    this.onSocketConv.complete();
    this.onSocketVoiceStatus.complete();
    this.onSocketVoiceCall.complete();
    this.onSocketBulkEmail.complete();
    this.onSocketNewInvoice.complete();
    this.onSocketMessage.complete();
    this.onSocketStatisticTask.complete();
    this.onSocketStatisticTaskChannel.complete();
    this.onSocketJob.complete();
    this.onSocketTopics.complete();
    this.onSocketMessageViaEmail.complete();
    this.onSocketUpdateRole.complete();
    this.onSocketAgencyAction.complete();
    this.onSocketReiformTokenUpdate.complete();
    this.onSocketSyncMailBox.complete();
    this.onSocketSyncSpamMailBox.complete();
    this.onSocketChangeOwner.complete();
    this.onSocketUpdatePermissionMailBox.complete();
    this.onSocketDeactivatedUser.complete();
    this.onSocketArchiveMailbox.complete();
    this.onSocketPromotion.complete();
    this.onSocketNewNoteMention.complete();
    this.onSocketEditNoteMention.complete();
    this.onSocketMoveConversations.complete();
    this.onSocketMoveMessageToFolder.complete();
    this.onSocketMoveEmailStatus.complete();
    this.onSocketCurrentNoteViewed.complete();
    this.onSocketTaskGroup.complete();
    this.onSocketMoTaskToGroup.complete();
    this.onSocketUpdateMsgFolder.complete();
    this.onSocketUserMailBoxUnread.complete();
    this.onSocketNewUnreadNoteData.complete();
    this.onSocketNewMailMessage.complete();
    this.onSocketSyncConversationToPT.complete();
    this.onSocketRemider.complete();
    this.onSocketChangeConversationProperty.complete();
    this.onSocketReloadInternalNoteData.complete();
    this.onSocketTranscriptCompleted.complete();
    this.onSocketDeleteLinkedConversation.complete();
    this.onSocketPmJoinConversation.complete();
    this.onSocketMessageReaction.complete();
  }
}
