import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ViewChildren,
  QueryList,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  Subject,
  Observable,
  takeUntil,
  map,
  distinctUntilChanged,
  debounceTime,
  filter,
  combineLatest
} from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import {
  trudiUserId,
  DEBOUNCE_SOCKET_TIME,
  CONVERSATION_CATEGORIES,
  ErrorMessages
} from '@services/constants';
import {
  MessageStatus,
  ConversationService
} from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { HeaderService } from '@services/header.service';
import { LoadingService } from '@services/loading.service';
import { PopupService, PopupState } from '@services/popup.service';
import { PropertiesService } from '@services/properties.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SendMessageService } from '@services/send-message.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { TenantLandlordRequestService } from '@services/tenant-landlord-request.service';
import { TrudiService } from '@services/trudi.service';
import { UserService } from '@services/user.service';
import { PrefillValue } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { EHeaderTitle } from '@shared/components/select-people-popup/select-people-popup.component';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { EMessageType } from '@shared/enum/messageType.enum';
import { SocketType } from '@shared/enum/socket.enum';
import { TaskStatusType, TaskType, TaskNameId } from '@shared/enum/task.enum';
import { ETrudiType } from '@shared/enum/trudi';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { replaceMessageToOneLine } from '@shared/feature/function.feature';
import { UserConversation } from '@shared/types/conversation.interface';
import { IFile } from '@shared/types/file.interface';
import { SocketSendData, SocketCallData } from '@shared/types/socket.interface';
import { ITaskDetail } from '@shared/types/task.interface';
import {
  TaskDetailPet,
  LeaseRenewalRequestTrudiResponse,
  TrudiResponse
} from '@shared/types/trudi.interface';
import { UnhappyStatus } from '@shared/types/unhappy-path.interface';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { TrudiScheduledMsgService } from '@/app/trudi-scheduled-msg/services/trudi-scheduled-msg.service';
import {
  ISendMsgTriggerEvent,
  ESentMsgEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';

type UserConversationOption = Partial<UserConversation>;

@Component({
  selector: 'app-conversation',
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.scss']
})
export class ConversationComponent implements OnInit, OnDestroy {
  @Input() visible = true;
  @Output() isReadEvent = new EventEmitter<boolean>();
  @ViewChildren('convNav') convNav: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChild('scrollDown') scrollDown: ElementRef;
  @ViewChild('menu') menu: ElementRef;
  public taskStatusType = TaskStatusType;
  public status = MessageStatus;
  public currentConvId: string;
  public currentStatus: MessageStatus;
  public currentNotificationId: string = '';
  public currentProperty: any;
  public conversationSearch = '';
  public listOfConversations: UserConversationOption[] = [];
  private unsubscribe = new Subject<void>();
  public conversationId: string;
  public taskId: string;
  public taskType?: TaskType;
  public TaskTypeEnum = TaskType;
  public popupModalPosition = ModalPopupPosition;
  public isShowQuitConfirmModal = false;
  public isShowSelectPeopleModal = false;
  public isShowSendMessageModal = false;
  public isShowCreateTaskByCategory = false;
  public isShowEditDetailLandlordTenantTask = false;
  public isProcessingForwardRequest = false;
  public isShowEditHeader = false;
  public haveSelectedRecipients = false;
  public resetSendMessageModal = false;
  public isShowSecceessMessageModal = false;
  public isShowAddFilesModal = false;
  public moveConversationState = false;
  public isShowForwardViaEmail = false;
  public conversationForward: UserConversationOption;
  public countCheckbox = 0;
  public selectedFiles: IFile[] = [];
  public trudiUserId = trudiUserId;
  public isLoading = false;
  public taskAreaHeight: number;
  public items = [];
  public fileIdDropdown: string;
  public activeActionGroupIndex: number;
  public taskTypeId: TaskNameId;
  public titleInputDetail: string;
  public taskDetailData: ITaskDetail | TaskDetailPet = null;
  public requestTitle = '';
  public isRead: boolean = false;
  public currentMailBoxId: string;
  public TYPE_TRUDI = ETrudiType;
  public propertyId;
  private currentAgencyId: string;

  selectedUser = [];
  disableCreateNewConversation$ = new Observable<boolean>();
  currentActiveIndex = -1;
  targetConvId = '';
  currentSearch = '';
  currentStatusData = '';
  currentAssignedToData = '';
  currentTopicData = '';
  currentPropertyManager = '';
  conversationType = EConversationType;
  selectedConversationToResolve: UserConversationOption;
  userPropertyType = EUserPropertyType;
  public currentTaskDeleted: boolean = false;
  isUnHappyPath = false;
  public isSupplierOrOther: boolean = false;
  public isShowSelectPeopleBtn: boolean = true;
  unHappyStatus: UnhappyStatus;
  dataPrefill: PrefillValue;
  mediaFilesInConversation: number = 0;
  EHeaderTitle = EHeaderTitle;
  isShowTrudiSendMsg = false; // todo: remove unused code
  createNewConversationConfigs = {
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'body.prefillReceivers': false
  };

  public currentTaskTitle: string = '';
  public isClickSendTask: boolean = false;
  public isMaintenanceFlow: boolean = false;
  public isShowAddressMoveConversation: boolean = false;
  public errorMessage: string;
  public isShowModalWarning: boolean = false;
  public MessageStatus = MessageStatus;
  public conversationIdMoveTask: string;

  constructor(
    private propertyService: PropertiesService,
    public conversationService: ConversationService,
    private agencyService: AgencyService,
    private activatedRoute: ActivatedRoute,
    private websocketService: RxWebsocketService,
    private agentUserService: AgentUserService,
    private filesService: FilesService,
    public popupService: PopupService,
    public userService: UserService,
    public taskService: TaskService,
    public readonly sharedService: SharedService,
    private headerService: HeaderService,
    private loadingService: LoadingService,
    private sendMessageService: SendMessageService,
    private toastService: ToastrService,
    private tenantLandlordRequestService: TenantLandlordRequestService,
    private trudiService: TrudiService,
    private trudiScheduledMsgService: TrudiScheduledMsgService,
    private inboxService: InboxService,
    private toastCustomService: ToastCustomService
  ) {
    this.activatedRoute.paramMap
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res && res.get('taskId')) {
          this.taskId = res.get('taskId');
        }
      });
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.conversationId = res.get('conversationId');
          this.currentNotificationId = res.get('notificationId');
        }
      });
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.isShowTrudiSendMsg = false;
        this.conversationService.reloadConversationList.next(true);
        break;

      default:
        break;
    }
  }

  handleResolve(conversation: UserConversationOption, e: Event) {
    e.stopPropagation();
    this.closeMenuOptions();
    if (conversation.scheduleMessageCount) {
      this.errorMessage = ErrorMessages.RESOLVE_CONVERSATION;
      this.isShowModalWarning = true;
      this.closeMenuOptions();
      return;
    }
    this.selectedConversationToResolve = conversation;
    const summaryMsg = '';
    this.loadingService.stopLoading();
    this.conversationService
      .updateStatus(
        EConversationType.resolved,
        conversation?.id,
        this.conversationService.currentConversation?.value?.isSendViaEmail,
        summaryMsg
      )
      .subscribe((res) => {
        if (res) {
          const dataForToast = {
            conversationId: conversation?.id,
            taskId: conversation?.taskId,
            isShowToast: true,
            type: SocketType.changeStatusTask,
            mailBoxId: this.currentMailBoxId,
            taskType: TaskType.MESSAGE,
            status: TaskStatusType.resolved,
            pushToAssignedUserIds: []
          };
          this.toastCustomService.openToastCustom(
            dataForToast,
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );
          this.loadingService.stopLoading();
          this.conversationService.currentUserChangeConversationStatus(
            EMessageType.solved
          );
          this.conversationService.setUpdatedConversation(
            res.id,
            EConversationType.resolved
          );
          this.conversationService.reloadConversationList.next(true);
          this.taskService.reloadTaskArea$.next(true);
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.resetSendMessageModal = true;
    this.popupService.isShowActionLinkModal.next(false);
    this.conversationService.reloadConversationList.next(false);
    this.conversationService.conversationSearch.next('');
    this.conversationService.resetCurrentPropertyId();
    this.conversationService.resetConversationList();
    this.conversationService.resetSearchAddressFromUsers();
    this.conversationService.currentConversationId.next(null);
  }

  onSearch(event) {
    const value: string = event.target.value || '';
    this.conversationSearch = value.trim();
  }

  setHeight(e: number) {
    this.taskAreaHeight = e;
  }

  ngOnInit() {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailBoxId) => {
        if (mailBoxId) this.currentMailBoxId = mailBoxId;
      });

    this.loadingService.onLoading();
    combineLatest([this.taskService.currentTask$, this.activatedRoute.paramMap])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([currentTask, res]) => {
        if (currentTask?.agencyId && res && res.get('taskId')) {
          this.currentAgencyId = currentTask.agencyId;
          this.conversationService.currentAgencyId = this.currentAgencyId;
          this.taskId = res.get('taskId');
          this.taskService.currentTaskId$.next(this.taskId);
          this.conversationService
            .getListOfConversationsByTaskId(this.taskId)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res: UserConversationOption[]) => {
              if (res) {
                this.listOfConversations = res;
                this.mapConversationProperties();
                this.taskService.checkAllConversationsInTaskIsRead(
                  this.taskId || this.taskService.currentTaskId$.getValue(),
                  this.taskService.currentTask$.getValue()
                    ?.status as TaskStatusType,
                  this.listOfConversations as UserConversation[]
                );
                this.selectFirstConversationInList();
                this.loadingService.stopLoading();
              }
            });
        }
      });

    this.disableCreateNewConversation$ = this.activatedRoute.paramMap.pipe(
      takeUntil(this.unsubscribe),
      map(() => Boolean(localStorage.getItem('agencyId')))
    );
    this.conversationService.isLoading$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isLoading) => {
        this.isLoading = isLoading;
      });

    this.conversationService.reloadConversationList
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.reloadListConversation();
      });

    this.currentStatus = this.conversationService.currentStatus;
    this.conversationService.updatedConversationList
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.listOfConversations = res;
          this.mapConversationProperties();
          this.taskService.checkAllConversationsInTaskIsRead(
            this.taskService.currentTaskId$.getValue(),
            this.taskService.currentTask$.getValue()?.status as TaskStatusType,
            this.listOfConversations as UserConversation[]
          );
          this.checkLengthOfListConvToHandleUrl();
          this.conversationService.setListOfConversation(
            this.listOfConversations
          );
        }
      });
    this.conversationService.conversationList
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.listOfConversations = res;
          this.mapConversationProperties();
          this.taskService.checkAllConversationsInTaskIsRead(
            this.taskService.currentTaskId$.getValue(),
            this.taskService.currentTask$.getValue()?.status as TaskStatusType,
            this.listOfConversations as UserConversation[]
          );
          this.checkLengthOfListConvToHandleUrl();
          this.conversationService.setListOfConversation(
            this.listOfConversations
          );
        }
      });

    this.conversationService.joinConversation$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((state) => {
        if (state) {
          this.moveConversationToTopList(
            state.conversationId,
            state.conversationStatus,
            state.messageStatus
          );
        }
      });

    this.conversationService.currentConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res && res.id) {
          this.currentConvId = res.id;
        }
      });

    this.conversationService.changeConversationStatus
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res && res.id === MessageStatus.resolved) {
          this.selectConversationTab(res);
        }
        if (res && res.id === MessageStatus.reopen) {
          this.currentStatus = this.status.open;
          this.conversationService.reloadConversationList.next(true);
        }
      });

    this.websocketService.onSocketTask
      .pipe(
        distinctUntilChanged(),
        debounceTime(200),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        if (
          res &&
          res.type === SocketType.changeStatusTask &&
          (res.taskIds?.includes(this.taskId) || res.taskId === this.taskId)
        ) {
          this.taskService.currentTask$.next({
            ...this.taskService.currentTask$.value,
            status: res.newStatus
          });

          this.headerService.headerState$.next({
            ...this.headerService.headerState$.value,
            currentStatus: res.newStatus,
            currentTask: this.taskService.currentTask$.value
          });

          const currentConversation =
            this.conversationService.currentConversation?.getValue();
          if (
            currentConversation &&
            res.newStatus === TaskStatusType.inprogress
          ) {
            this.conversationService.trudiChangeConversationStatus(
              EMessageType.open
            );
            this.conversationService.setUpdatedConversation(
              currentConversation.id,
              EConversationType.reopened
            );
          }
          this.conversationService.reloadConversationList.next(true);
        }
      });

    this.websocketService.onSocketSend
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        filter((socket) => socket.taskId === this.taskId),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        this.conversationService.reloadConversationList.next(true);
      });

    this.websocketService.onSocketNewInvoice
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        filter((socket) => socket.taskId === this.taskId),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        this.taskService.reloadTaskDetail.next(true);
      });

    this.websocketService.onSocketCall
      .pipe(
        distinctUntilChanged(),
        debounceTime(200),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        const data = res;
        try {
          const index = this.listOfConversations.findIndex(
            (el) => el.id === data.conversationId
          );
          if (index > -1) {
            this.listOfConversations[index] = {
              ...this.listOfConversations[index],
              updatedAt: new Date().toISOString(),
              message: 'Call in progress',
              isRead: this.checkConversationIsReadSocket(data),
              lastUser: {
                ...this.listOfConversations[index].lastUser,
                avatar: data.googleAvatar || data.callerAvatar,
                firstName: data.senderName || data.callerFirstName,
                lastName: data.lastName || data.callerLastName,
                type: 'AGENT',
                id: data.userId
              },
              isSendViaEmail: data.isSendFromEmail
            };
            this.listOfConversations = this.conversationService.sortData(
              this.listOfConversations
            );
            this.mapConversationProperties();
            this.taskService.checkAllConversationsInTaskIsRead(
              this.taskService.currentTaskId$.getValue(),
              this.taskService.currentTask$.getValue().status as TaskStatusType,
              this.listOfConversations as UserConversation[]
            );
          } else {
            // call api get list conversation when create new conversation
            // this.conversationService.reloadConversationList.next(true);
          }
        } catch (e) {
          console.log(e);
        }
      });
    this.websocketService.onSocketConv
      .pipe(
        distinctUntilChanged(),
        debounceTime(200),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        const data = res;
        this.handleMoveConversationRealTime(data);
      });
    this.websocketService.onSocketBulkMessage
      .pipe(
        distinctUntilChanged(),
        debounceTime(200),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        const data = res;
        this.handleBulkMessageRealTime(data);
      });

    this.subscribeCurrentTask();

    this.taskService.clickSendTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isClickSendTask = res;
      });

    this.trudiScheduledMsgService.scheduleMessageCount$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((msg) => {
        if (!msg) return;
        this.listOfConversations = this.listOfConversations.map(
          (conversation: UserConversation) => {
            if (msg.conversationId === conversation.id) {
              conversation.scheduleMessageCount = msg.count;
            }
            conversation.lastMessage = this.getLastMessage(conversation);
            return conversation;
          }
        );
      });
  }

  checkConversationIsReadSocket(socket: SocketSendData | SocketCallData) {
    if (socket.userId === trudiUserId) {
      return true;
    }
    if (
      socket.userType === 'SUPPLIER' ||
      socket.userType === 'USER' ||
      !socket.userType
    ) {
      return false;
    }
    return true;
  }

  handleEditTask() {
    this.taskTypeId =
      this.taskService.currentTask$.getValue().trudiResponse?.setting[
        'taskNameId'
      ];
    const dataTaskDetail = this.taskDetailData;
    const prefillMediaFile = this.filesService
      .filterFileByType(['video', 'photo'], dataTaskDetail?.photos)
      .slice(-5); // get first 5 media file
    this.mediaFilesInConversation = prefillMediaFile.length;
    this.dataPrefill = {
      description: dataTaskDetail?.description,
      files: prefillMediaFile
    };
    switch (this.taskTypeId) {
      case TaskNameId.requestLandlord:
        this.requestTitle = 'Edit request for landlord';
        this.isShowEditDetailLandlordTenantTask = true;
        break;
      case TaskNameId.requestTenant:
        this.requestTitle = 'Edit request for tenant';
        this.isShowEditDetailLandlordTenantTask = true;
        break;
      case TaskNameId.petRequest:
        this.dataPrefill.objects = (dataTaskDetail as ITaskDetail)?.petType;
        this.isShowCreateTaskByCategory = true;
        break;
      case TaskNameId.routineMaintenance:
        this.dataPrefill.objects = (
          dataTaskDetail as ITaskDetail
        )?.maintenanceObjectList;
        this.isShowCreateTaskByCategory = true;
        break;
      case TaskNameId.emergencyMaintenance:
        this.dataPrefill.objects = (
          dataTaskDetail as ITaskDetail
        )?.emergencyEventList;
        this.isShowCreateTaskByCategory = true;
        break;
      default:
        break;
    }
  }

  editDetailRequestLandlordTenantTask(data) {
    const trudiResponse = this.taskService.currentTask$.value?.trudiResponse;
    const receivers = (trudiResponse as LeaseRenewalRequestTrudiResponse)
      .data[0].variable.receivers;
    this.tenantLandlordRequestService
      .saveVariableResponseData(this.taskId, receivers, data)
      .subscribe((res) => {
        if (res) {
          this.tenantLandlordRequestService.tenantLandlordRequestResponse.next(
            res
          );
          this.isShowEditDetailLandlordTenantTask = false;
          this.taskService.reloadTaskArea$.next(true);
          this.trudiService.updateTrudiResponse = res;
        }
      });
  }

  subscribeCurrentTask() {
    this.taskService.currentTask$
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res && res.id === this.taskId) {
          this.taskType = res.taskType;
          const currentCategory = res.trudiResponse?.setting?.categoryId;
          this.currentTaskTitle =
            currentCategory === CONVERSATION_CATEGORIES.LEASE_RENEWAL
              ? res.title + ' - ' + res.property.streetline
              : res.title;
          this.currentTaskDeleted =
            this.taskService.checkIfCurrentTaskDeleted();
          this.headerService.headerState$.next({
            ...this.headerService.headerState$.value,
            currentTask: res,
            title: res.status.toLowerCase()
          });
          this.unHappyStatus = res.unhappyStatus;
          this.isUnHappyPath = res.isUnHappyPath;
          this.taskDetailData = res.trudiResponse?.data?.[0]?.taskDetail;
        }
      });

    this.taskService.readTask$
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.taskService.readTask(res.id).subscribe();
        }
      });
  }

  updateCurrentConversationStatusInAppChat() {
    const currentConversationInService =
      this.conversationService.currentConversation.value;
    const currentConversation = this.listOfConversations.find(
      (el) => el.id === currentConversationInService?.id
    );
    if (currentConversation && currentConversation.id) {
      this.conversationService.updateConversationStatus$.next({
        status: currentConversation.status,
        user: {
          ...currentConversation.lastUser
        },
        option: null,
        addMessageToHistory: false
      });
    }
  }

  loadListConversationByTaskId(taskId: string) {
    this.conversationService
      .getListOfConversationsByTaskId(taskId)
      .subscribe((res) => {
        if (res) {
          this.listOfConversations = res;
          this.mapConversationProperties();
          this.taskService.checkAllConversationsInTaskIsRead(
            this.taskService.currentTaskId$.getValue(),
            this.taskService.currentTask$.getValue().status as TaskStatusType,
            this.listOfConversations as UserConversation[]
          );
        }
      });
  }

  moveConversationToTopList(
    conversationId: string,
    conversationStatus: string,
    messageStatus?: string
  ): void {
    const index = this.listOfConversations.findIndex(
      (el) => el.id === conversationId
    );
    const currentUser = this.userService.userInfo$.value;
    if (index > -1) {
      this.listOfConversations[index] = {
        ...this.listOfConversations[index],
        status: conversationStatus,
        updatedAt: new Date().toISOString(),
        message: this.conversationService.getMessageByStatus(
          messageStatus || conversationStatus,
          this.listOfConversations[index].message
        ),
        lastUser: {
          ...this.listOfConversations[index].lastUser,
          id: currentUser.id,
          avatar: currentUser.googleAvatar,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          type: currentUser.type
        }
      };
      this.listOfConversations = this.conversationService.sortData(
        this.listOfConversations
      );
    }
  }

  selectFirstConversationInList() {
    let conversation: UserConversationOption =
      this.listOfConversations.find((el) => el.id === this.conversationId) ||
      this.listOfConversations[0];
    this.openConversation(conversation, 0);
    if (!this.propertyService.currentPropertyId.value) {
      if (conversation?.propertyId) {
        this.propertyService.currentPropertyId.next(conversation?.propertyId);
      }
    }
  }

  checkLengthOfListConvToHandleUrl() {
    if (!this.listOfConversations.length) {
    }
  }

  parseStringToArray(arrayString) {
    if (typeof arrayString === 'string') {
      const listOfMessageOptiopns = JSON.parse(arrayString);
      return listOfMessageOptiopns[listOfMessageOptiopns.length - 1] || '';
    } else if (Array.isArray(arrayString)) {
      return arrayString[arrayString.length - 1] || '';
    }

    return '';
  }
  openConversation(conversation: any, index: number) {
    let trudiResponse;
    if (this.listOfConversations && this.listOfConversations.length) {
      trudiResponse = this.listOfConversations.find((el) => el.trudiResponse);
    }
    this.currentActiveIndex = index;
    this.conversationService.openConversation(
      conversation,
      trudiResponse || this.listOfConversations
    );
    this.conversationService.resetConversationState();
    this.conversationService.actionLinkList.next([]);
    this.conversationService._actionLinkList = [];
    this.isRead = this.listOfConversations.some(
      (item) => item.isRead == false && item.status !== MessageStatus.schedule
    );
    this.isReadEvent.emit(this.isRead);
  }

  closeMenuOptions() {
    this.fileIdDropdown = null;
    this.activeActionGroupIndex = null;
  }

  onOpenOptions(conversationId: string, trudiResponse: TrudiResponse) {
    this.conversationIdMoveTask = conversationId;
    this.closeMenuOptions();
    if (!conversationId) {
      return;
    }
    this.targetConvId = conversationId;
    this.propertyId =
      (this.unHappyStatus?.isConfirmProperty || !this.isUnHappyPath) &&
      !this.isSupplierOrOther
        ? this.propertyService.currentPropertyId.getValue()
        : '';
    const excludeUnHappyPath = true;
    this.isUnHappyPath = trudiResponse?.type === ETrudiType.unhappy_path;
    this.isShowAddressMoveConversation = this.isUnHappyPath ? true : false;

    this.moveConversationState = true;
  }

  stopMoveToTask() {
    this.moveConversationState = false;
  }

  deleteConversation(conversation: UserConversationOption, e: Event) {
    e.stopPropagation();
    if (conversation.scheduleMessageCount) {
      this.errorMessage = ErrorMessages.DELETE_CONVERSATION;
      this.isShowModalWarning = true;
      this.closeMenuOptions();
      return;
    }
    switch (this.taskService.currentTask$.value?.taskType) {
      case TaskType.MESSAGE:
        break;
      case TaskType.TASK:
        this.conversationService
          .deleteConversation(conversation.id)
          .subscribe((res) => {
            if (res) {
              this.reloadListConversation();
              this.conversationService.navigateToFirstOfNextConversation(
                res.conversationId
              );
              this.taskService.reloadTaskDetail.next(true);
              this.filesService.reloadTab.next(true);
            }
          });
        break;
      default:
        break;
    }
  }

  reloadListConversation() {
    this.conversationService
      .getListOfConversationsByTaskId(this.taskId)
      .subscribe((res) => {
        if (res) {
          this.listOfConversations = [...res];
          this.mapConversationProperties();
          this.taskService.checkAllConversationsInTaskIsRead(
            this.taskService.currentTaskId$.getValue(),
            this.taskService.currentTask$.getValue()?.status as TaskStatusType,
            this.listOfConversations as UserConversation[]
          );
          this.updateCurrentConversationStatusInAppChat();
          this.checkLengthOfListConvToHandleUrl();
          this.selectFirstConversationInList();
        }
      });
  }

  onOpenForward(conversation: UserConversationOption) {
    this.closeMenuOptions();
    if (!conversation) {
      return;
    }
    this.conversationService
      .getHistoryOfConversation(conversation.id, 0)
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        const message = res?.list
          ?.filter((e) => !!e?.message)
          .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))?.[0];
        const file = (res?.list || [])
          .reverse()
          .filter(
            (e) =>
              e?.messageType === EMessageType.file &&
              message.id == e.bulkMessageId
          )
          .map((e) => e?.file);
        this.conversationForward = { ...message, options: file };
      });
    this.isShowForwardViaEmail = true;
  }

  selectConversationTab(event) {
    this.currentStatus = event;
    this.currentStatus && this.conversationService.setNewTab(event);
  }

  search(search) {
    this.conversationService.applySearch(search);
  }

  replaceBr(message) {
    return message.replace(/<br>/gi, '');
  }

  isUnreadIndicator(conversation: UserConversation) {
    return (
      !conversation.isRead && conversation.status !== MessageStatus.schedule
    );
  }

  getLastMessage(conversation: UserConversation) {
    if (conversation.message) {
      let { message, lastUser } = conversation;
      if (message) {
        message = replaceMessageToOneLine(message);
      }
      if (lastUser.id === this.userService.selectedUser.value.id) {
        return this.replaceBr('You' + ': ' + message);
      } else if (lastUser.id === trudiUserId) {
        return this.replaceBr('Trudi' + ': ' + message);
      } else if (lastUser.id === conversation.userId) {
        return message;
      } else {
        return this.replaceBr(
          this.sharedService.displayName(
            lastUser.firstName,
            lastUser.lastName
          ) +
            ': ' +
            message
        );
      }
    } else if (conversation.status === MessageStatus.resolved) {
      return 'Trudi: Resolved';
    } else if (conversation.status === MessageStatus.schedule) {
      return `${conversation.scheduleMessageCount} ${
        conversation.scheduleMessageCount === 1 ? 'message' : 'messages'
      } scheduled`;
    } else if (conversation.messageOptions) {
      return this.replaceBr(
        'Trudi: ' + this.parseStringToArray(conversation.messageOptions)
      );
    } else {
      return 'new conversation';
    }
  }

  showSelectPeople(status: boolean) {
    this.taskService.clickSendTask$.next(false);
    // if (this.taskService.checkIfCurrentTaskDeleted()) return;
    if (status) {
      this.isShowSelectPeopleModal = true;
      this.isShowSendMessageModal = false;
      this.selectedFiles = [];
      this.selectedUser = [];
    } else {
      this.isShowSelectPeopleModal = false;
      this.isProcessingForwardRequest = false;
    }
    // this.isProcessingForwardRequest = false;
  }

  getSelectedUser(event) {
    this.selectedUser = event;
  }

  handleRemoveFileItem(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  getSelectedFile(event) {
    if (!this.selectedFiles.includes(event)) {
      this.selectedFiles.push(event);
    }
  }

  showQuitConfirm(status: boolean) {
    if (status) {
      this.resetSendMessageModal = false;
      this.isShowSelectPeopleModal = false;
      this.isShowAddFilesModal = false;
      this.isShowQuitConfirmModal = true;
    } else {
      this.isShowQuitConfirmModal = false;
      this.agentUserService.setIsCloseAllModal(true);
      this.selectedFiles = [];
      this.countCheckbox = 0;
    }
    this.isShowSendMessageModal = false;
    this.haveSelectedRecipients = false;
  }

  closeAddFileModal() {
    this.isShowAddFilesModal = false;
    this.isShowSendMessageModal = true;
  }

  showSuccessMessageModal(status: boolean) {
    if (status) {
      this.isShowSendMessageModal = true;
      this.userService.getUserInfo();
      this.resetSendMessageModal = true;
    } else {
      this.isShowSendMessageModal = false;
    }
  }

  showAppSendMessage(status: PopupState) {
    this.isShowSelectPeopleModal = false;
    if (this.isClickSendTask) {
      this.haveSelectedRecipients = true;
    }
    if (!this.isProcessingForwardRequest && status.display) {
      this.isShowSendMessageModal = !this.isClickSendTask;
      this.userService.getUserInfo();
      this.resetSendMessageModal = status.resetField;
      this.isShowQuitConfirmModal = false;
      this.isShowSelectPeopleModal = false;
      this.isShowAddFilesModal = false;
    } else if (!this.isProcessingForwardRequest) {
      this.selectedFiles = [];
      this.isShowSendMessageModal = false;
      this.countCheckbox = 0;
    }
  }

  showAddFiles(status: boolean) {
    if (status) {
      this.isShowAddFilesModal = true;
      this.isShowSendMessageModal = false;
      this.isShowQuitConfirmModal = false;
    } else {
      this.isShowSendMessageModal = false;
      this.isShowAddFilesModal = false;
      this.countCheckbox = 0;
    }
  }

  moreFromConversation(
    e: MouseEvent,
    id: string,
    i: number,
    propertyType: EUserPropertyType
  ) {
    this.fileIdDropdown = this.fileIdDropdown === id ? null : id;
    this.activeActionGroupIndex = i;
    this.isSupplierOrOther =
      propertyType === EUserPropertyType.SUPPLIER ||
      propertyType === EUserPropertyType.OTHER;
    e.stopPropagation();
  }

  handleMoveConversationRealTime(data: any): boolean {
    try {
      if (data.type !== SocketType.moveConversation || !data?.conversationId)
        return false;
      if (data.taskId === this.taskService.currentTaskId$.getValue()) {
        this.listOfConversations = this.listOfConversations.filter(
          (item: any) => item.id !== data.conversationId
        );
      } else if (
        data.newTaskId === this.taskService.currentTaskId$.getValue()
      ) {
        this.loadListConversationByTaskId(data.newTaskId);
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  handleBulkMessageRealTime(data: any): boolean {
    try {
      if (
        data.type !== SocketType.bulkMessage ||
        !data.taskId ||
        this.taskService.currentTaskId$.getValue() !== data.taskId
      )
        return false;
      this.loadListConversationByTaskId(data.taskId);
      if (
        data &&
        data.type === SocketType.bulkMessage &&
        this.taskId === data.taskId
      ) {
        this.taskService.currentTask$.next({
          ...this.taskService.currentTask$.value,
          status: data.status
        });

        this.headerService.headerState$.next({
          ...this.headerService.headerState$.value,
          currentStatus: data.status,
          currentTask: this.taskService.currentTask$.value
        });
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  mapConversationProperties() {
    if (!Array.isArray(this.listOfConversations)) return;
    this.listOfConversations = this.listOfConversations.map((item) => {
      if (item.id === this.currentConvId) {
        item.isRead = true;
        item.isSeen = true;
      }
      item.isUnreadIndicator = this.isUnreadIndicator(item as UserConversation);
      item.fullName = this.sharedService.displayName(
        item?.firstName,
        item?.lastName
      );
      item.lastMessage = this.getLastMessage(item as UserConversation);
      return item;
    });
  }

  onBackSendNewTaskMessage() {
    this.haveSelectedRecipients = false;
    this.isShowSelectPeopleModal = true;
  }

  terminateForwardRequest() {
    this.haveSelectedRecipients = false;
    this.isProcessingForwardRequest = false;
  }

  async onSubmitSendMsg(body) {
    body.mailBoxId = this.currentMailBoxId;
    body.propertyId = this.taskService.currentTask$?.value?.property?.id;
    body.users = body?.users || this.selectedUser;
    body.listOfFiles = body.imageCheckList;
    const message = await this.sendMessageService.formatBulkMessageBody(
      body,
      this.taskService.currentTask$.value?.trudiResponse?.setting?.categoryId
    );
    this.sendMessageService
      .sendBulkMessage(message)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          if (!res) return;
          this.conversationService.reloadConversationList.next(true);
        },
        error: () => {},
        complete: () => {
          this.isProcessingForwardRequest = false;
          this.haveSelectedRecipients = false;
        }
      });
  }
  closeSendMessageModal(event: boolean) {
    if (!event) return;
    this.isShowSendMessageModal = false;
    this.selectedFiles = [];
  }
}
