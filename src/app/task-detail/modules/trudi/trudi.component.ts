import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { Subject, of, takeUntil, tap, lastValueFrom } from 'rxjs';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { TenantLandlordRequestService } from '@services/tenant-landlord-request.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { EMessageType } from '@shared/enum/messageType.enum';
import { TaskNameId, TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { ETrudiRaiseByType, ETrudiType } from '@shared/enum/trudi';
import { Suppliers } from '@shared/types/agency.interface';
import {
  UserConversation,
  getListLandlordConversationByTaskResponse
} from '@shared/types/conversation.interface';

import { ToastrService } from 'ngx-toastr';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  retry,
  skip,
  switchMap
} from 'rxjs/operators';
import { BreachNoticeService } from '@/app/breach-notice/services/breach-notice.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { EmergencyMaintenanceAPIService } from '@/app/emergency-maintenance/services/emergency-maintenance-api.service';
import { EEmergencyButtonAction } from '@/app/emergency-maintenance/utils/emergencyType';
import { GeneralComplianceAPIService } from '@/app/general-compliance/services/general-compliance-api.service';
import { EGeneralComplianceButtonAction } from '@/app/general-compliance/utils/generalComplianceType';
import {
  READONLY_FILE,
  SEND_MESSAGE_POPUP_OPEN_FROM
} from '@services/constants';
import { CreditorInvoicingService } from '@services/creditor-invoicing.service';
import { FilesService } from '@services/files.service';
import { FirebaseService } from '@services/firebase.service';
import { HeaderService } from '@services/header.service';
import { IngoingInspectionService } from '@services/ingoing-inspection.service';
import { LeaseRenewalService } from '@services/lease-renewal.service';
import { LeasingService } from '@services/leasing.service ';
import { MaintenanceRequestService } from '@services/maintenance-request.service';
import { CONVERT_TO_TASK } from '@services/messages.constants';
import { NotificationService } from '@services/notification.service';
import { PetRequestService } from '@services/pet-request.service';
import { PopupState } from '@services/popup.service';
import { RoutineInspectionService } from '@services/routine-inspection.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';
import { TrudiService } from '@services/trudi.service';
import { UserService } from '@services/user.service';
import { PrefillValue } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { ECategoryType } from '@shared/enum/category.enum';
import { EConfirmContactType } from '@shared/enum/contact-type';
import {
  SendMaintenanceType,
  SyncMaintenanceType
} from '@shared/enum/sendMaintenance.enum';
import {
  CheckBoxImgPath,
  EActionShowMessageTooltip
} from '@shared/enum/share.enum';
import { SocketType } from '@shared/enum/socket.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { EPropertyStatus, EUserPropertyType } from '@shared/enum/user.enum';
import { IFile } from '@shared/types/file.interface';
import {
  TaskItem,
  TaskItemDropdown,
  TaskName
} from '@shared/types/task.interface';
import { TrudiSuggestion } from '@shared/types/trudi-suggestion.interface';
import {
  InfoAdditionButtonAction,
  Intents,
  ListTrudiContact,
  TrudiButton,
  TrudiData,
  TrudiResponse,
  TrudiResponseVariable
} from '@shared/types/trudi.interface';
import {
  PropertyContact,
  UnhappyStatus
} from '@shared/types/unhappy-path.interface';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { CurrentUser, Personal } from '@shared/types/user.interface';
import { SupplierSendedQuote } from '@shared/types/users-supplier.interface';
import { SmokeAlarmAPIService } from '@/app/smoke-alarm/services/smoke-alarm-api.service';
import { ESmokeAlarmButtonAction } from '@/app/smoke-alarm/utils/smokeAlarmType';
import { TenantVacateApiService } from '@/app/tenant-vacate/services/tenant-vacate-api.service';
import { ETenantVacateButtonAction } from '@/app/tenant-vacate/utils/tenantVacateType';
import { ControlPanelService } from '@/app/task-detail/modules/sidebar-left/services/control-panel.service';
import { TenancyInvoicingService } from '@services/tenancy-invoicing.service';
import { MaintenanceSyncPtService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-sync-pt.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { EActionType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { CreditorInvoicingPropertyService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/creditor-invoice.service';
import { EAddOnType } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { IConfigs } from '@/app/mailbox-setting/utils/out-of-office.interface';
import { defaultConfigs } from '@/app/mailbox-setting/utils/out-of-office-config';
import { ComplianceApiService } from '@/app/compliance/services/compliance-api.service';
import { Store } from '@ngrx/store';
import { taskDetailActions } from '@core/store/task-detail';
import uuid4 from 'uuid4';
const otherTopic = 'Other topics detected';

@DestroyDecorator
@Component({
  selector: 'app-trudi-tab',
  templateUrl: './trudi.component.html',
  styleUrls: ['./trudi.component.scss']
})
export class TrudiComponent implements OnInit, OnDestroy {
  @ViewChild('upgradeMsg', { static: true })
  upgradeMsg: TemplateRef<HTMLElement>;
  console = console;
  public upgradeMsgOutlet: TemplateRef<HTMLElement>;
  public TaskType = TaskType;
  public dataTrudiStep: TrudiData[];
  public typeTrudi: string;
  public TYPE_TRUDI = ETrudiType;
  public forwardButtons: TrudiButton[] = [];
  public forwardButtons2: TrudiButton[] = [];
  public messagesType = EMessageType;
  public trudiStep: number;
  public popupModalPosition = ModalPopupPosition;
  public forwardLandlordsVisible = false;
  public Check = false;
  public isShowSendMessageModal = false;
  public selectedTicket: any;
  public trudiTicket: any;
  public listUserQuoteSelected: getListLandlordConversationByTaskResponse[] =
    [];
  public forwardSupplierVisible = false;
  public configs: IConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      showDropdown: false
    }
  };
  public createWorkOrderVisible = false;
  public addTenancyAgreementDocumentRequestVisible = false;
  public sendMessageDocumentRequestVisible = false;
  public isShowQuitConfirmDocumentRequestModal = false;
  public isShowAddFilesDocumentRequestModal = false;
  public isAddingFileDocumentRequest = false;
  public selectedUsersFromPopup = [];
  public selectMode: string;
  public taskStatusType = TaskStatusType;
  public openFrom = SEND_MESSAGE_POPUP_OPEN_FROM.trudi;
  public selectedFiles: IFile[] = [];
  public isShowAddFilesModal = false;
  public isShowQuitConfirmModal = false;
  public selectedActionLinks = [];
  public isResetModal = false;
  public buttonAction: ForwardButtonAction;
  public likeToSayVisible = false;
  public trudiResponse: TrudiResponse;
  public trudiResponseSuggestions: TrudiSuggestion;
  public trudiResponseVariable: TrudiResponseVariable;
  public currentStep: number;
  public showSendInvoicePt = false;
  public showCompletePT = false;
  public onlySendOwnerTenant = false;
  public onlySendSupplier = false;
  public isSendQuoteLandlord = false;
  public isShowNotifycationFail = false;
  public infoAddition:
    | CurrentUser[]
    | Suppliers[]
    | InfoAdditionButtonAction[]
    | SupplierSendedQuote[];
  public listSupplierSendedQuote: Suppliers[] | SupplierSendedQuote[];
  public taskId = '';
  public supplierConductingHeader = '';
  public TYPE_SYNC_MAINTENANCE = SyncMaintenanceType;
  public currentAction: TrudiButton;
  public noBackBtn = false;
  public noTicket = false;
  public noAddFile = false;
  public likeToSaySelectedIndex: number;
  public isBackSendQuoteLandlord = false;
  public TYPE_MAINTENANCE = SendMaintenanceType;
  public eUserPropertyType = EUserPropertyType;
  public intentList: Intents[] = [];
  public selectedIntent = '';
  public isSuperHappyPath = false;
  public isUnHappyPath = false;
  public isUnindentifiedEmail = false;
  public isUnindentifiedProperty = false;
  public unhappyStatus: UnhappyStatus;
  public userConversation: UserConversation;
  public conversationIdToGetFilesSupplierReply: string;
  public haveSentInvoice = false;
  public isShowAllTrudiButton = false;
  public headerText: string;
  public fileTypeQuote: string;
  public currentTask: TaskItem;
  public isSelectedIntent = false;
  public listQuoteSelect = [];
  public placeHolderTrudiUnhappy = '';
  public isFlowSendQuote = false;
  public textContentSendMsg = '';
  public overlayDropdown: boolean;
  public selectedTaskToConvert: TaskName;
  public isShowErrConvertToTask = false;
  public notificationId: string = '';
  public showCreateTaskByCate: boolean = false;
  public showConvertTaskSuperHappyPath: boolean = false;
  public showCreateRequestLandlordTenantTaskModal: boolean = false;
  public showNewTaskPopupState = false;
  public currentPropertyId: string;
  public createTaskPrefillValue: PrefillValue = null;
  public titleRequestLandlordTenant: string = '';
  public selectedTenancy: Personal[] = [];
  public mediaFilesInConversation: number = 0;
  public listTaskName: TaskItemDropdown[];
  public isHandleTrudiData: boolean = true;
  public currentConversation: UserConversation;
  public taskRegionId: string = '';
  public assignedUserIds: string[] = [];
  public newTaskNameRegionId: string = '';
  public newTaskTaskNameId: TaskNameId;
  public validateTenantInvoiceTask: boolean = false;
  public currentAgencyId: string = '';
  public activeProperty: UserPropertyInPeople[];

  contactList: ListTrudiContact[];
  propertyList: PropertyContact[];
  taskNameList: TaskName[];

  listConvertToTask: TaskName[] = [];
  public listConvertSuggestTask: TaskName[] = [];
  isPrefillData: boolean;

  selectedIntentId: string;
  ETrudiRaiseByType = ETrudiRaiseByType;
  private unsubscribe = new Subject<void>();
  private listCategoryTypes = JSON.parse(
    localStorage.getItem('listCategoryTypes')
  );

  MAINTENANCE_BUTTON_ENUM = TrudiButtonEnumStatus;
  CATEGORY_ENUM = ECategoryType;
  ACTION_UPGRADE = EActionShowMessageTooltip;

  public isLocal: boolean = window.location.href.includes('localhost');
  public radioApprovedImg = CheckBoxImgPath.ownershipCheck;
  public radioDeniedImg = CheckBoxImgPath.uncheck;
  public recomendButtons = [];
  public isTemplate = true;
  public isArchiveMailbox: boolean = false;
  public isDisabledProperty: boolean = false;
  public readonly EPropertyStatus = EPropertyStatus;
  trudiResponseSubscription: any;
  constructor(
    private trudiService: TrudiService,
    public taskService: TaskService,
    private conversationService: ConversationService,
    private userService: UserService,
    private controlPanelService: ControlPanelService,
    public shareService: SharedService,
    private propertyService: PropertiesService,
    private toastService: ToastrService,
    private websocketService: RxWebsocketService,
    private sharedService: SharedService,
    private agencyService: AgencyService,
    private petRequestService: PetRequestService,
    private leaseRenewalService: LeaseRenewalService,
    private routineInspectionService: RoutineInspectionService,
    private ingoingInspectionService: IngoingInspectionService,
    private maintenanceService: MaintenanceRequestService,
    private landlordTenantService: TenantLandlordRequestService,
    private creditorInvoicingService: CreditorInvoicingService,
    private tenancyInvoicingService: TenancyInvoicingService,
    private readonly elr: ElementRef,
    private headerService: HeaderService,
    public firebaseService: FirebaseService,
    public notificationService: NotificationService,
    private filesService: FilesService,
    private emergencyMaintenanceAPIService: EmergencyMaintenanceAPIService,
    private generalComplianceAPIService: GeneralComplianceAPIService,
    private smokeAlarmAPIService: SmokeAlarmAPIService,
    private leasingService: LeasingService,
    private breachNotice: BreachNoticeService,
    private tenantVacateApiService: TenantVacateApiService,
    private maintenancePTService: MaintenanceSyncPtService,
    public stepService: StepService,
    public inboxService: InboxService,
    public creditorInvoicingPropertyService: CreditorInvoicingPropertyService,
    public complianceApiService: ComplianceApiService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow: boolean) => (this.isArchiveMailbox = isShow));

    this.agencyService.currentPlan$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((configPlan) => {
        if (
          configPlan?.features &&
          !configPlan?.features[EAddOnType.SUGGESTED_REPLIES]?.state
        ) {
          this.upgradeMsgOutlet = this.upgradeMsg;
        }
      });

    this.subscribeUpdateStatusMaintenanceRequest();

    this.taskService.currenTaskTrudiResponse$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.handleUpdateTrudiResponseData(res?.trudiResponse || res);
        }
      });
    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        if (res) {
          this.currentTask = res;
          this.isDisabledProperty = [
            EPropertyStatus.deleted,
            EPropertyStatus.archived,
            EPropertyStatus.inactive
          ].includes(this.currentTask?.property?.status as EPropertyStatus);
          this.unhappyStatus = res?.unhappyStatus;
          const { propertyType } = res.conversations[0] || {};
          this.showConvertTaskSuperHappyPath =
            propertyType === EConfirmContactType.SUPPLIER ||
            propertyType === EConfirmContactType.OTHER ||
            propertyType === EConfirmContactType.EXTERNAL;
          this.isSuperHappyPath = res.isSuperHappyPath;
          this.isUnHappyPath = res.isUnHappyPath;
          this.isUnindentifiedEmail = res.isUnindentifiedEmail;
          this.isUnindentifiedProperty = res.isUnindentifiedProperty;
          this.currentPropertyId = res?.property?.id;
          if (
            this.isHandleTrudiData &&
            !(res?.trudiResponse as TrudiResponse)?.isTemplate
          ) {
            this.handleUpdateTrudiResponseData(res?.trudiResponse);
          }

          this.taskService.dataMoveTask$.next(res);
          const assignToAgents = res.assignToAgents.map((agent) => agent?.id);
          this.assignedUserIds = [
            ...new Set([
              this.userService.userInfo$?.value?.id,
              ...assignToAgents
            ])
          ];
        }
      });

    this.conversationService.trudiResponseConversation
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(),
        tap((res) => {
          this.userConversation = Array.isArray(res) ? res[0] : res;
          if (res && res.trudiResponse && res.taskType === TaskType.MESSAGE) {
            res.trudiResponse.data?.[0].body?.text &&
              this.getPlaceholderTrudiUnhappy(
                res.trudiResponse.data[0]?.body?.text
              );
            this.handleSetTrudiResponse(res.trudiResponse);
            this.conversationService.superHappyPathTrudiResponse.next(
              res.trudiResponse
            );
            this.currentStep = res.trudiResponse.data.findIndex(
              (el) => !el.isCompleted
            );
            this.typeTrudi = res.trudiResponse.type;
            if (this.typeTrudi === this.TYPE_TRUDI.q_a) {
              this.trudiStep = 1;
            } else if (this.typeTrudi === this.TYPE_TRUDI.ticket) {
              this.dataTrudiStep = res.trudiResponse.data;
              this.conversationIdToGetFilesSupplierReply = res.id;
              if (res.trudiResponse.data?.[0]) {
                this.forwardButtons = res.trudiResponse.data[0].body.button;
                this.forwardButtons2 = res.trudiResponse.data[0].body.button;
                this.trudiResponseVariable =
                  res.trudiResponse.data[0].body.variable;
                this.trudiStep = res.trudiResponse.data[0]?.step;
                this.trudiTicket = res.trudiResponse.data[0]?.header?.ticket;
              }
            } else if (this.typeTrudi === this.TYPE_TRUDI.super_happy_path) {
              const { id, userId, propertyId, categoryId } =
                this.userConversation;
              this.conversationService
                .getTrudiIntents(
                  res?.trudiResponse?.data[0]?.variable?.text,
                  id,
                  userId,
                  propertyId
                )
                .pipe(takeUntil(this.unsubscribe))
                .subscribe((res) => {
                  if (res) {
                    this.intentList = this.mapIntentByGroup(res);
                    // Get intent of current topic/task
                    const category = this.intentList.find(
                      (intent) => intent.id === categoryId
                    );
                    this.selectedIntent = category?.id || res[0]?.id;
                    this.conversationService.selectedCategoryId.next(
                      this.selectedIntent
                    );
                  }
                });
            } else if (this.typeTrudi === this.TYPE_TRUDI.unhappy_path) {
              this.conversationService.unHappyPathTrudiResponse.next(
                res?.trudiResponse
              );
            }
            this.handleUpdateTrudiResponseData(res.trudiResponse);
            this.conversationService.trudiResponseType.next(this.typeTrudi);
          }
        })
      )
      .subscribe(() => {
        this.markReadNotiDesktop();
      });

    this.conversationService.statusSyncInvoice
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.forwardButtons2 = this.forwardButtons2.map((item) => {
            if (item.syncStatus !== undefined) {
              return { ...item, syncStatus: res };
            }
            return item;
          });
        }
      });

    this.websocketService.onSocketSync
      .pipe(
        distinctUntilChanged(),
        debounceTime(200),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        const data = res;
        try {
          if (data.taskId === this.taskService.currentTaskId$.getValue()) {
            this.handleChangeStatusSync(data);
          }
          if (
            data.type === SocketType.syncSendInvoice &&
            data.taskId === this.taskService.currentTaskId$.getValue()
          ) {
            this.handleChangeStatusSyncSendInvoice(data);
          }
          if (
            data &&
            data.status === this.TYPE_MAINTENANCE.CANCELLED &&
            data.taskId === this.taskService.currentTask$.value?.id
          ) {
            this.forwardButtons2 = this.forwardButtons2.map((item) => ({
              ...item,
              disable: true
            }));
          }
        } catch (e) {
          console.log(e);
        }
      });

    this.sharedService.checkStatus
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res && res === this.TYPE_MAINTENANCE.CANCELLED) {
          this.forwardButtons2 = this.forwardButtons2.map((item) => ({
            ...item,
            disable: true
          }));
        }
      });

    this.controlPanelService.reloadForwardRequestList
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((list) => {
        if (list && list.length) {
          this.forwardButtons = list;
          this.forwardButtons2 = list;
          if (this.trudiResponse.data[this.currentStep]) {
            this.trudiResponse.data[this.currentStep].body.button = list;
          }
        }
      });

    this.controlPanelService.syncedProperty
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((synced) => {
        if (synced) {
          // index 2 is Send maintenance request to Property Tree flow
          // this.forwardButtons[2] = { ...this.forwardButtons[2], isCompleted: true, status: TrudiButtonEnum.COMPLETED };
          this.controlPanelService.syncedProperty.next(false);
        }
      });

    this.controlPanelService.triggerGetTrudiIntents
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((intents) => {
        if (intents) {
          this.assignNewIntentData(intents, this.isSelectedIntent);
        }
      });

    /* NOTE: remove function assign task in semi happy path */
    // this.sharedService.assignTaskInTooltipSemiPath
    //   .pipe(takeUntil(this.unsubscribe))
    //   .subscribe((task) => {
    //     if (task) {
    //       // check intent is exist in list & has titleOfTopic = other
    //       const findIntentIdx = this.intentList.findIndex(
    //         (intent) =>
    //           intent.id === task.id && intent.titleOfTopic === otherTopic
    //       );

    //       // this intent do not exist in list intent
    //       if (findIntentIdx === -1) {
    //         task.titleOfTopic = otherTopic;
    //         this.intentList = [task, ...this.intentList];
    //         this.selectedIntent = this.intentList[0].id;
    //       } else {
    //         this.selectedIntent = this.intentList[findIntentIdx].id;
    //       }
    //       this.conversationService.selectedCategoryId.next(this.selectedIntent);
    //       this.selectedIntentId && this.onGetTrudiResponse(
    //         this.selectedIntent,
    //         this.userConversation?.id
    //       );
    //       const searchInput = this.elr.nativeElement.querySelector(
    //         '.task-name-dropdown#task-select ng-select input'
    //       );
    //       if (this.isSelectedIntent) {
    //         searchInput.value =
    //           this.intentList[findIntentIdx === -1 ? 0 : findIntentIdx].name;
    //       }
    //     }
    //   });

    this.controlPanelService.sendMsgDocumentRequestQA
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.onMoveToStep(2);
        }
      });

    this.conversationService.newTrudiResponseSuggestion
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.trudiResponse = res;
        }
      });

    this.propertyService.peopleList$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (data) {
          this.selectedTenancy = data?.tenancies;
        }
      });

    this.subscribeGetTopicsList();
  }

  markReadNotiDesktop() {
    this.firebaseService.notificationId$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.notificationId = res;
        }
      });
    if (this.notificationId) {
      lastValueFrom(
        this.notificationService
          .markNotificationAsRead(this.notificationId)
          .pipe(takeUntil(this.unsubscribe))
      );
      this.notificationService.removeNotiFromUnseenList(this.notificationId);
      lastValueFrom(
        this.notificationService
          .getNotificationUnreadCount()
          .pipe(takeUntil(this.unsubscribe))
      );
    }
  }

  subscribeUpdateStatusMaintenanceRequest() {
    this.conversationService.updateStatusMaintenanceRequest
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (
          !data?.trudiResponse?.data ||
          !data.trudiResponse.data[0]?.body?.button ||
          !this.trudiResponse?.data ||
          !this.trudiResponse.data[0]?.body?.button
        )
          return;
        this.forwardButtons2 = data.trudiResponse.data[0].body.button;
        this.trudiResponse.data[0].body.button = this.forwardButtons2;
      });
  }

  handleChangeStatusSync(data: any): boolean {
    try {
      if (data.type === SocketType.syncPTMaintenace) {
        if (data && data.syncStatus) {
          this.sharedService.statusMaintenaceRealTime.next(data);
          if (data.syncStatus === this.TYPE_SYNC_MAINTENANCE.COMPLETED) {
            this.maintenancePTService.handleSuccessMaintenanceCard(data);
            this.sharedService.checkConversationRealId.next(
              data.conversationId
            );
            const taskNameId =
              this.taskService.currentTask$.value?.trudiResponse?.setting
                ?.taskNameId;
            const trudiResponeTemplate =
              this.trudiService.getTrudiResponse?.getValue();
            const currentStep = this.stepService.socketStep;
            if (trudiResponeTemplate?.isTemplate) {
              this.stepService.setChangeBtnStatusFromPTWidget(true);
              this.stepService.updateButtonStatusTemplate(
                currentStep?.id,
                EPropertyTreeButtonComponent.MAINTENANCE_REQUEST,
                currentStep
                  ? EButtonAction[currentStep?.action.toUpperCase()]
                  : EButtonAction.PT_NEW_COMPONENT,
                data?.id
              );
            } else {
              switch (taskNameId) {
                case TaskNameId.routineMaintenance:
                  this.maintenanceService.maintenanceRequestResponse.next(
                    data.trudiResponse
                  );
                  break;
                case TaskNameId.emergencyMaintenance:
                  this.trudiService.updateTrudiResponse = data.trudiResponse;
                  break;
              }
            }
          } else if (data.syncStatus === this.TYPE_SYNC_MAINTENANCE.FAILED) {
            this.maintenancePTService.handleSuccessMaintenanceCard(data);
          }
        }
        return true;
      }
      if (data.type === SocketType.syncSendInvoice) {
        this.stepService.setChangeBtnStatusFromPTWidget(false);
        this.maintenancePTService.handleSuccessMaintenanceInvoiceCard(data);
        if (data.syncStatus === this.TYPE_SYNC_MAINTENANCE.COMPLETED) {
          this.sharedService.checkConversationRealId.next(data.conversationId);
          const taskNameId =
            this.taskService.currentTask$.value?.trudiResponse?.setting
              ?.taskNameId;
          const trudiResponeTemplate =
            this.trudiService.getTrudiResponse?.getValue();
          const currentStep = this.stepService.socketStep;
          if (trudiResponeTemplate?.isTemplate) {
            this.stepService.updateButtonStatusTemplate(
              data?.invoice?.stepId,
              EPropertyTreeButtonComponent.MAINTENANCE_INVOICE,
              currentStep?.action === EButtonAction.PT_UPDATE_COMPONENT
                ? EButtonAction.PT_UPDATE_COMPONENT
                : EButtonAction.PT_NEW_COMPONENT,
              data?.id
            );
          } else {
            switch (taskNameId) {
              case TaskNameId.routineMaintenance:
                this.maintenanceService.maintenanceRequestResponse.next(
                  data.trudiResponse
                );
                break;
              case TaskNameId.emergencyMaintenance:
                this.trudiService.updateTrudiResponse = data.trudiResponse;
                break;
            }
          }
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  handleChangeStatusSyncSendInvoice(data: any) {
    if (data.syncStatus === SyncMaintenanceType.COMPLETED) {
      const taskNameId =
        this.taskService.currentTask$.value?.trudiResponse?.setting?.taskNameId;
      const trudiResponseTemplate =
        this.trudiService.getTrudiResponse?.getValue();
      const currentStep = this.stepService.socketStep;
      if (trudiResponseTemplate?.isTemplate) {
        this.stepService.updateButtonStatusTemplate(
          currentStep?.id,
          EPropertyTreeButtonComponent.MAINTENANCE_INVOICE,
          currentStep?.action === EButtonAction.PT_UPDATE_COMPONENT
            ? EButtonAction.PT_UPDATE_COMPONENT
            : EButtonAction.PT_NEW_COMPONENT,
          data?.id
        );
      } else {
        switch (taskNameId) {
          case TaskNameId.routineMaintenance:
            this.maintenanceService
              .changeButtonStatus(
                this.taskService.currentTask$.value?.id,
                ForwardButtonAction.sendInvoicePT,
                0,
                TrudiButtonEnumStatus.COMPLETED
              )
              .subscribe((res) => {
                this.maintenanceService.maintenanceRequestResponse.next(res);
              });
            break;
          case TaskNameId.emergencyMaintenance:
            this.emergencyMaintenanceAPIService
              .updateButtonStatus(
                this.taskService.currentTask$.value?.id,
                EEmergencyButtonAction.sendInvoiceToPT,
                TrudiButtonEnumStatus.COMPLETED
              )
              .subscribe((res) => {
                this.trudiService.updateTrudiResponse = res;
              });
            break;
          case TaskNameId.invoiceTenant:
            this.taskService.reloadTaskDetail.next(true);
            break;
          case TaskNameId.smokeAlarms:
            this.smokeAlarmAPIService
              .updateButtonStatus(
                this.taskService.currentTask$.value?.id,
                ESmokeAlarmButtonAction.sendInvoiceToPT,
                TrudiButtonEnumStatus.COMPLETED
              )
              .subscribe((res) => {
                this.trudiService.updateTrudiResponse = res;
                this.taskService.reloadTaskDetail.next(true);
              });
            break;
          case TaskNameId.generalCompliance:
            this.generalComplianceAPIService
              .updateButtonStatus(
                this.taskService.currentTask$.value?.id,
                EGeneralComplianceButtonAction.sendInvoiceToPT,
                TrudiButtonEnumStatus.COMPLETED
              )
              .subscribe((res) => {
                this.trudiService.updateTrudiResponse = res;
                this.taskService.reloadTaskDetail.next(true);
              });
            break;
          case TaskNameId.tenantVacate:
            this.tenantVacateApiService
              .updateButtonStatus(
                this.taskService.currentTask$.value?.id,
                ETenantVacateButtonAction.sendBreakLeaseInvoicesToPropertyTree,
                TrudiButtonEnumStatus.COMPLETED,
                this.taskService.currentTask$.value?.agencyId
              )
              .subscribe((res) => {
                this.trudiService.updateTrudiResponse = res;
                this.taskService.reloadTaskDetail.next(true);
              });
            break;
          default:
            break;
        }
      }
    } else if (data.syncStatus === this.TYPE_SYNC_MAINTENANCE.FAILED) {
      // this.conversationService.statusSyncInvoice.next(data.syncStatus);
      this.maintenanceService.maintenanceInvoiceSocketData.next(data);
      this.taskService.reloadTaskDetail.next(true);
    }
    this.conversationService.sendStatusSync.next(data.syncStatus);
    this.tenancyInvoicingService.syncTenancyInvoiceModalStatus.next(false);
    this.tenancyInvoicingService.tenancyInvoiceSyncStatus.next(data.syncStatus);
    this.forwardButtons2 = this.forwardButtons2.map((item) => {
      if (item.syncStatus) {
        return { ...item, syncStatus: data.syncStatus };
      }
      return item;
    });
  }

  handleUpdateTrudiResponseData(trudiResponse) {
    // warn: be careful when update this line, it can cause a infinite loop
    if (this.trudiResponseSubscription) {
      this.trudiResponseSubscription.unsubscribe();
    }
    if (trudiResponse) {
      this.trudiService.updateTrudiResponse = trudiResponse;
      this.isTemplate = (trudiResponse as TrudiResponse)?.isTemplate;
      if (this.isTemplate) {
        this.stepService.updateTrudiResponse(
          trudiResponse as TrudiResponse,
          EActionType.UPDATE_TRUDI_BUTTON
        );
      } else {
        this.isHandleTrudiData = false;
        this.conversationService.selectedCategoryId.next(
          trudiResponse?.setting?.categoryId
        );
        // NOTE: save trudi response into trudiService
        switch (trudiResponse?.setting?.categoryId) {
          case ECategoryType.leaseRenewal:
            this.typeTrudi = ETrudiType.lease_renewal;
            this.leaseRenewalService.updateResponseData('INIT', trudiResponse);
            this.userService.tenancyId$.next(
              trudiResponse.data[0]?.variable?.tenancyId
            );
            break;
          case ECategoryType.routineInspection:
            this.typeTrudi = ETrudiType.routine_inspection;
            this.routineInspectionService.updateResponseData(
              'INIT',
              trudiResponse
            );
            this.userService.tenancyId$.next(trudiResponse.variable?.tenancyId);
            break;
          case ECategoryType.routineMaintenance:
            this.typeTrudi = this.TYPE_TRUDI.routine_maintenance;
            this.maintenanceService.maintenanceRequestResponse.next(
              trudiResponse
            );
            break;
          case ECategoryType.landlordRequest:
            this.typeTrudi = this.TYPE_TRUDI.landlord_request;
            this.landlordTenantService.updateTenantLandlordResponseData(
              'INIT',
              trudiResponse
            );
            break;
          case ECategoryType.tenantRequest:
            this.typeTrudi = this.TYPE_TRUDI.tenant_request;
            this.landlordTenantService.updateTenantLandlordResponseData(
              'INIT',
              trudiResponse
            );
            break;
          case ECategoryType.emergencyMaintenance:
            this.typeTrudi = this.TYPE_TRUDI.emergency_maintenance;
            break;
          case ECategoryType.smokeAlarms:
            this.typeTrudi = this.TYPE_TRUDI.smoke_alarm;
            this.userService.tenancyId$.next(
              trudiResponse.data[0]?.variable?.tenancyId
            );
            break;
          case ECategoryType.generalCompliance:
            this.typeTrudi = this.TYPE_TRUDI.general_compliance;
            this.userService.tenancyId$.next(
              trudiResponse.data[0]?.variable?.tenancyId
            );
            break;
          case ECategoryType.leasing:
            this.typeTrudi = this.TYPE_TRUDI.leasing;
            this.leasingService.updateResponseData('INIT', trudiResponse);
            this.ingoingInspectionService.updateResponseData(
              'INIT',
              trudiResponse
            );
            this.userService.tenancyId$.next(
              trudiResponse.variable?.idUserPropertyGroup
            );
            break;
          case ECategoryType.breachNotice:
            this.typeTrudi = this.TYPE_TRUDI.breach_notice;
            this.breachNotice.updateResponseData('INIT', trudiResponse);
            this.userService.tenancyId$.next(trudiResponse.variable?.tenancyId);
            break;
        }

        switch (trudiResponse?.setting?.taskNameId) {
          case TaskNameId.invoiceTenant:
            this.typeTrudi = ETrudiType.tenancy_invoicing;
            this.tenancyInvoicingService.updateTenancyInvoicingResponseData(
              'INIT',
              trudiResponse
            );
            this.userService.tenancyId$.next(
              trudiResponse.data[0]?.variable?.tenancyId
            );
            break;
          case TaskNameId.invoicing:
            this.typeTrudi = ETrudiType.creditor_invoicing;
            this.creditorInvoicingService.updateResponseData(
              'INIT',
              trudiResponse
            );
            this.userService.tenancyId$.next(
              trudiResponse.data[0]?.variable?.tenancyId
            );
            break;
          case TaskNameId.miscellaneous:
            // Update comming soon
            this.typeTrudi = null;
            break;
          case TaskNameId.tenantVacate:
            this.typeTrudi = ETrudiType.tenant_vacate;
            this.userService.tenancyId$.next(
              trudiResponse.data[0]?.variable?.tenancyId
            );
            break;
          default:
            break;
        }
      }
      this.updateTaskDetailStore();
    }
  }

  private updateTaskDetailStore() {
    if (this.isTemplate) {
      this.trudiResponseSubscription = this.stepService.getTrudiResponse
        .pipe(takeUntil(this.unsubscribe), filter(Boolean), skip(1))
        .subscribe((res) => {
          console.debug('trudiResponse template', res);
          this.store.dispatch(
            taskDetailActions.updateWorkflow({ trudiResponse: res })
          );
        });
    } else {
      this.trudiResponseSubscription = this.trudiService.getTrudiResponse
        .pipe(takeUntil(this.unsubscribe), filter(Boolean), skip(1))
        .subscribe((res) => {
          console.debug('trudiResponse', res);
        });
    }
  }

  handleGetFilesSupplierReply() {
    this.conversationService
      .getFilesSupplierReply(this.taskId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (data) => {
          this.listQuoteSelect = [];
          data.forEach((item) => {
            this.listQuoteSelect.push({
              ...item.propertyDocument,
              checked: false,
              title: item.propertyDocument.name.slice(0, -4),
              name: item.propertyDocument?.fileType?.icon,
              user: item.user
            });
          });
        },
        (err) => {
          // No list Landlord no show notifycation
          // this.toastService.error(err.error.message);
          ///this.isCloseModal.next(true);
        }
      );
  }

  getPlaceholderTrudiUnhappy(title: string) {
    if (title.includes('property')) {
      this.overlayDropdown = true;
      this.placeHolderTrudiUnhappy = 'Search for property';
    } else if (title.includes('contact')) {
      this.overlayDropdown = true;
      this.placeHolderTrudiUnhappy = 'Search for contact';
    } else if (title.includes('task')) {
      this.overlayDropdown = false;
      this.placeHolderTrudiUnhappy = 'Search for task';
    }
  }

  onForwardRequestBtnClick(btnInfo: TrudiButton) {
    const propertyType =
      this.maintenanceService.maintenanceRequestResponse.value?.data[0].variable
        ?.raiseByUser?.type;
    this.currentAction = btnInfo;
    this.taskId = this.taskService.currentTask$.value?.id;
    this.buttonAction = btnInfo.action as ForwardButtonAction;
    if (btnInfo && btnInfo.status !== TrudiButtonEnumStatus.COMPLETED) {
      this.openFrom = SEND_MESSAGE_POPUP_OPEN_FROM.trudi;
      switch (btnInfo.action) {
        case ForwardButtonAction.tkTenant:
        case ForwardButtonAction.tkLandlord:
          this.isResetModal = true;
          this.forwardLandlordsVisible = true;
          this.selectMode = this.buttonAction;
          this.onlySendOwnerTenant = true;
          this.onlySendSupplier = false;
          this.showSelectPeople(true);
          this.controlPanelService.resetForwardLandlordData();
          break;
        case ForwardButtonAction.askSupplierQuote:
          this.forwardLandlordsVisible = true;
          this.selectMode = this.buttonAction;
          this.isResetModal = true;
          this.onlySendSupplier = true;
          this.onlySendOwnerTenant = false;
          this.showSelectPeople(true);
          break;
        case ForwardButtonAction.sendMaintenance:
          this.shareService.maintenanceBottom.next(true);
          break;
        case ForwardButtonAction.closeTask:
          this.taskService
            .changeTaskStatus(
              this.taskService.currentTaskId$.getValue(),
              TaskStatusType.completed
            )
            .pipe(
              takeUntil(this.unsubscribe),
              switchMap(() => {
                return this.conversationService.completedButtonStep(
                  this.conversationService.trudiResponseConversation.getValue()
                    .id,
                  this.buttonAction,
                  this.currentStep
                );
              })
            )
            .subscribe((res) => {
              if (res && Array.isArray(res.data)) {
                this.forwardButtons = res.data[this.currentStep].body.button;
                this.trudiResponseVariable =
                  res.data[this.currentStep].body.variable;
                this.trudiResponse.data[this.currentStep].body.button =
                  res.data[this.currentStep].body.button;
                const currentTask = this.taskService.currentTask$.getValue();
                this.conversationService.reloadConversationList.next(true);
                this.taskService.currentTask$.next({
                  ...currentTask,
                  status: TaskStatusType.completed
                });
                this.taskService.moveTaskItem$.next({
                  task: currentTask,
                  source: TaskStatusType.inprogress.toLowerCase(),
                  destination: TaskStatusType.completed.toLowerCase()
                });
              }
              this.conversationService.currentUserChangeConversationStatus(
                this.messagesType.solved,
                false
              );
            });
          break;
        case ForwardButtonAction.joinCoversation:
          this.conversationService.onReOpenConversation(
            this.messagesType.reopened
          );
          this.conversationService
            .completedButtonStep(
              this.taskService.currentTask$.value?.id,
              this.buttonAction,
              this.currentStep
            )
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              if (res && Array.isArray(res.data)) {
                this.conversationService.reloadConversationList.next(true);
                this.forwardButtons = res.data[this.currentStep].body.button;
                this.trudiResponseVariable =
                  res.data[this.currentStep].body.variable;
                this.trudiResponse.data[this.currentStep].body.button =
                  res.data[this.currentStep].body.button;
              }
            });
          break;
        case ForwardButtonAction.sendQuoteLandlord:
          this.sharedService.isResetListFile.next(false);
          this.handleGetFilesSupplierReply();
          this.openFrom = SEND_MESSAGE_POPUP_OPEN_FROM.file;
          this.isFlowSendQuote = true;
          // Change selected file in flow SendQuote
          this.fileTypeQuote = READONLY_FILE.pdf;
          this.selectedTicket = null;

          // Check header Sendquote
          this.selectMode = this.buttonAction;
          this.supplierConductingHeader = this.getHeaderText(this.selectMode);

          const checkAskSupplier = this.trudiResponse.data[0].body.button.find(
            (el) => el.action === ForwardButtonAction.askSupplierQuote
          );
          // if (!this.checkButtonIsCompleted(checkAskSupplier)) {
          //   this.toastService.error(
          //     'You are attempting to send a quote that hasn’t been received yet'
          //   );
          //   return;
          // }

          this.conversationService
            .getListLandlordConversationByTask(
              this.taskService.currentTaskId$?.getValue()
            )
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((data: getListLandlordConversationByTaskResponse[]) => {
              this.listUserQuoteSelected = data;
              if (this.listUserQuoteSelected?.length) {
                this.isSendQuoteLandlord = true;
                this.isBackSendQuoteLandlord = false;
                this.selectedUsersFromPopup = this.listUserQuoteSelected;
              } else {
                this.selectMode = this.buttonAction;
                this.onlySendOwnerTenant = true;
                this.onlySendSupplier = false;
                this.forwardLandlordsVisible = true;
                this.isBackSendQuoteLandlord = true;
              }
            });
          break;
        case ForwardButtonAction.supToTenant:
          if (propertyType !== EUserPropertyType.TENANT) {
            this.toastService.error(
              `This task has no conversation with tenant`
            );
            return;
          } else {
            this.getTenantRaisedTask();
          }
          this.selectedTicket = null;
          this.selectMode = this.buttonAction;
          this.supplierConductingHeader = this.getHeaderText(this.selectMode);
          this.getListSupplierSupToTenant();
          break;
        case ForwardButtonAction.tell_tenant:
          if (propertyType !== EUserPropertyType.TENANT) {
            this.toastService.error(
              `This task has no conversation with tenant`
            );
            return;
          } else {
            this.getTenantRaisedTask();
          }
          this.showAppSendMessage(
            { display: true, resetField: true },
            false,
            true,
            true,
            true
          );
          break;
        case ForwardButtonAction.sendInvoicePT:
          const sendMaintenanceButton =
            this.trudiResponse.data[0].body.button.find(
              (el) => el.action === ForwardButtonAction.sendMaintenance
            );
          const createWorkOrder = this.trudiResponse.data[0].body.button.find(
            (el) => el.action === ForwardButtonAction.createWorkOrder
          );

          if (
            !this.checkButtonIsCompleted(sendMaintenanceButton) ||
            (!this.checkButtonIsCompleted(sendMaintenanceButton) &&
              !this.checkButtonIsCompleted(createWorkOrder))
          ) {
            this.toastService.error(
              'You must complete the following step first: Send maintenance request to PT'
            );
            return;
          }
          if (!this.checkButtonIsCompleted(createWorkOrder)) {
            this.toastService.error(
              'You must complete the following step first: Create work order for supplier'
            );
            return;
          }
          this.showSendInvoicePt = true;
          break;
        case ForwardButtonAction.createWorkOrder:
          this.getListSupplierWorkOrder()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
              if (res && res.length) {
                this.listSupplierSendedQuote = res;
                this.isResetModal = true;
                this.selectMode = this.buttonAction;
                this.supplierConductingHeader = this.getHeaderText(
                  this.selectMode
                );
                this.createWorkOrderVisible = true;
              } else {
                this.toastService.error(
                  'You must complete the following step first: Ask supplier to quote'
                );
              }
            });
          break;
        case ForwardButtonAction.notifyLandlord:
          this.isResetModal = true;
          const listCheckLandLord = this.forwardButtons2.find(
            (item) => item.action === ForwardButtonAction.tkLandlord
          );
          if (!listCheckLandLord.conversation.length) {
            this.toastService.error(
              `You must complete the following step first: ${
                this.trudiResponse.data[0].body.button.find(
                  (el) => el.action === ForwardButtonAction.tkLandlord
                )?.text
              }`
            );
            return;
          }

          this.selectedUsersFromPopup = listCheckLandLord.conversation;
          this.showAppSendMessage(
            { display: true, resetField: true },
            false,
            true,
            true,
            true
          );
          break;
        case ForwardButtonAction.notifyTenant:
          if (propertyType !== EUserPropertyType.TENANT) {
            this.toastService.error(
              `This task has no conversation with tenant`
            );
            return;
          } else {
            this.getTenantRaisedTask();
          }
          this.showAppSendMessage(
            { display: true, resetField: true },
            false,
            true,
            true,
            true
          );
          break;
        case ForwardButtonAction.completePtMaintenance:
          const createMaintenanceButton =
            this.trudiResponse.data[0].body.button.find(
              (el) => el.action === ForwardButtonAction.sendMaintenance
            );
          const sendInvoiceButton = this.trudiResponse.data[0].body.button.find(
            (el) => el.action === ForwardButtonAction.sendInvoicePT
          );
          if (!this.checkButtonIsCompleted(createMaintenanceButton)) {
            this.toastService.error(
              `You must complete the following step first:'${createMaintenanceButton?.text}`
            );
            return;
          }
          this.showCompletePT = true;
          this.haveSentInvoice = this.checkButtonIsCompleted(sendInvoiceButton);
          break;
      }

      this.headerText = this.getHeaderText(this.selectMode);
    }
  }

  onForwardDocumentRequestBtnClick(btnInfo: TrudiButton) {
    this.currentAction = btnInfo;
    this.buttonAction = btnInfo.action as ForwardButtonAction;

    switch (btnInfo.action) {
      case ForwardButtonAction.attachmentFile:
        this.addTenancyAgreementDocumentRequestVisible = true;
        this.isResetModal = true;
        break;
      case ForwardButtonAction.closeTask:
        this.taskService
          .changeTaskStatus(
            this.taskService.currentTaskId$.getValue(),
            TaskStatusType.completed
          )
          .pipe(
            takeUntil(this.unsubscribe),
            switchMap(() => {
              return this.conversationService.completedButtonStep(
                this.conversationService.trudiResponseConversation.getValue()
                  .id,
                this.buttonAction,
                this.currentStep
              );
            })
          )
          .subscribe((res) => {
            if (res && Array.isArray(res.data)) {
              this.forwardButtons = res.data[this.currentStep].body.button;
              this.trudiResponseVariable =
                res.data[this.currentStep].body.variable;
              this.trudiResponse.data[this.currentStep].body.button =
                res.data[this.currentStep].body.button;
              const currentTask = this.taskService.currentTask$.getValue();
              this.conversationService.reloadConversationList.next(true);
              this.taskService.currentTask$.next({
                ...currentTask,
                status: TaskStatusType.completed
              });
              this.taskService.moveTaskItem$.next({
                task: currentTask,
                source: TaskStatusType.inprogress.toLowerCase(),
                destination: TaskStatusType.completed.toLowerCase()
              });
              this.headerService.headerState$.next({
                ...this.headerService.headerState$.value,
                currentTask: {
                  ...this.currentTask,
                  status: TaskStatusType.completed
                }
              });
            }
            this.conversationService.currentUserChangeConversationStatus(
              this.messagesType.solved,
              false
            );
          });
        break;
      default:
        break;
    }
  }

  checkButtonIsCompleted(button: TrudiButton) {
    return (
      button.status === TrudiButtonEnumStatus.COMPLETED || button.isCompleted
    );
  }

  getHeaderText(mode: string) {
    let textHeader = '';
    switch (mode) {
      case ForwardButtonAction.supToTenant:
        textHeader = 'Which supplier details would you like to send to tenant?';
        break;
      case ForwardButtonAction.tkLandlord:
        textHeader =
          'Which landlords would you like to forward this request to?';
        break;
      case ForwardButtonAction.tkTenant:
        textHeader = 'Which tenants would you like to forward this request to?';
        break;
      case ForwardButtonAction.askSupplierQuote:
        textHeader =
          'Which suppliers would you like to send this quote request to?';
        break;
      case ForwardButtonAction.sendQuoteLandlord:
        textHeader = 'Which landlords would you like to send this quote to?';
        break;
      case ForwardButtonAction.sendInvoicePT:
        textHeader = 'Who would you like to forward this invoice to?';
        break;
      case ForwardButtonAction.createWorkOrder:
        textHeader = 'Which supplier is conducting the work?';
        break;
      default:
        textHeader = 'Select People';
        break;
    }
    return textHeader;
  }

  getListSupplierSupToTenant() {
    this.conversationService
      .getSupplierCreateWorkOrder(this.taskId)
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((supplierCreateWork) => {
          if (supplierCreateWork) {
            this.infoAddition = [supplierCreateWork];
            this.showAppSendMessage(
              { display: true, resetField: true },
              false,
              true,
              true,
              true
            );
            return of({ checked: true });
          } else {
            return this.conversationService.getListSupplierSendedQuote(
              this.taskId
            );
          }
        })
      )
      .subscribe({
        next: (res) => {
          if (res && (res as { checked: boolean }).checked) return;
          if ((res as Array<any>).length) {
            this.listSupplierSendedQuote = res as SupplierSendedQuote[];
            if (this.listSupplierSendedQuote.length === 1) {
              this.infoAddition = this.listSupplierSendedQuote;
              this.showAppSendMessage(
                { display: true, resetField: true },
                false,
                true,
                true,
                true
              );
            } else {
              this.selectedUsersFromPopup = [];
              this.forwardSupplierVisible = true;
            }
          } else {
            this.forwardLandlordsVisible = true;
            this.isResetModal = true;
            this.onlySendSupplier = true;
            this.onlySendOwnerTenant = false;
          }
        }
      });
  }

  getListSupplierWorkOrder() {
    return this.conversationService
      .getListSupplierSendedQuote(this.taskId)
      .pipe(takeUntil(this.unsubscribe));
  }

  onMoveToStep(step: number) {
    this.currentStep = step;
  }

  handleOnCloseSendInvoice() {
    this.showSendInvoicePt = false;
  }

  handleSetTrudiResponse(trudiResponse: TrudiResponse) {
    if (!trudiResponse) return;
    this.trudiResponse = trudiResponse;
    this.getPlaceholderTrudiUnhappy(trudiResponse.data[0]?.body?.text);
    this.forwardButtons = trudiResponse.data[this.currentStep]?.body?.button;
    this.trudiResponseVariable =
      trudiResponse.data[this.currentStep]?.body?.variable;
    // this.conversationService.savedNextTimeData
    //   .pipe(takeUntil(this.unsubscribe))
    //   .subscribe({
    //     next: (res: TrudiResponse) => {
    //       if (!res || !Object.keys(res).length || res?.type !== ETrudiType.q_a) {
    //         this.trudiResponse = trudiResponse;
    //       } else {
    //         const {isSavedEdit, text} = res?.data[0]?.body;
    //         if (isSavedEdit && text) {
    //           trudiResponse.data[this.currentStep].body = {
    //             ...trudiResponse.data[this.currentStep].body,
    //             text
    //           };
    //           this.trudiResponse = trudiResponse;
    //           if (this.trudiResponseSuggestions) {
    //             this.trudiResponseSuggestions.data[this.currentStep].body = {
    //               ...this.trudiResponseSuggestions.data[this.currentStep].body,
    //               text
    //             }
    //           }
    //         }
    //       }
    //       this.getPlaceholderTrudiUnhappy(trudiResponse.data[0]?.body?.text);
    //       this.forwardButtons = trudiResponse.data[this.currentStep]?.body?.button;
    //       this.trudiResponseVariable = trudiResponse.data[this.currentStep]?.body?.variable;
    //     }
    // });
  }

  handleOnChangeUnHappyPath(item) {
    let streetline = '';
    let unitNo = '';
    //step property
    if (
      [EConfirmContactType.SUPPLIER, EConfirmContactType.OTHER].includes(
        this.unhappyStatus.confirmContactType as EConfirmContactType
      ) &&
      !this.unhappyStatus.isConfirmProperty
    ) {
      streetline = item.streetline;
      this.taskService.currentTask$.next({
        ...this.currentTask,
        property: {
          ...this.currentTask.property,
          streetline: streetline,
          unitNo: unitNo
        },
        isSuperHappyPath: true,
        unhappyStatus: {
          ...this.currentTask.unhappyStatus,
          isConfirmProperty: false
        }
      });
      //step contact
    } else if (
      !this.unhappyStatus.confirmContactType &&
      !this.unhappyStatus.isConfirmContactUser
    ) {
      streetline = item.property?.streetline;
      unitNo = item.property?.unitNo;
      this.taskService.currentTask$.next({
        ...this.currentTask,
        property: {
          ...this.currentTask.property,
          streetline: streetline,
          unitNo: unitNo
        },
        isSuperHappyPath: true,
        unhappyStatus: {
          ...this.currentTask.unhappyStatus,
          isConfirmProperty: false
        }
      });
    }
  }

  handleOnSearchUnHappyPath(search: string) {
    // case property
    if (
      [EConfirmContactType.SUPPLIER, EConfirmContactType.OTHER].includes(
        this.unhappyStatus.confirmContactType as EConfirmContactType
      ) &&
      !this.unhappyStatus.isConfirmProperty
    ) {
      this.userService
        .getListTrudiProperties(search)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res) {
            this.propertyList = res.map((item) => {
              return {
                ...item,
                fullName: this.sharedService.displayName(
                  item.user.firstName,
                  item.user.lastName
                )
              };
            });
          }
        });
    } else if (
      !this.unhappyStatus.confirmContactType &&
      !this.unhappyStatus.isConfirmContactUser
    ) {
      // case tenant-landlord-supplier-other
      this.userService
        .getListTrudiContact(
          search,
          this.isUnindentifiedEmail
            ? ''
            : this.trudiResponse?.data[0]?.header.email
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res) {
            this.contactList = res.contacts.map((item) => {
              if (
                [
                  EConfirmContactType.SUPPLIER,
                  EConfirmContactType.OTHER
                ].includes(item.userType as EConfirmContactType)
              ) {
                return {
                  ...item,
                  fullName: this.sharedService.displayName(
                    item.firstName,
                    item.lastName
                  ),
                  propertyTypeOrAddress:
                    item.userType === EConfirmContactType.OTHER
                      ? this.shareService.displayAllCapitalizeFirstLetter(
                          item.contactType?.split('_').join(' ').toLowerCase()
                        )
                      : this.sharedService.displayCapitalizeFirstLetter(
                          item.userType?.toLowerCase()
                        )
                };
              }
              return {
                ...item,
                fullName: this.sharedService.displayName(
                  item.firstName,
                  item.lastName
                ),
                propertyTypeOrAddress:
                  this.sharedService.displayCapitalizeFirstLetter(
                    item.userPropertyType?.toLowerCase()
                  ) + this.displayPropertyStreetline(item.property?.streetline)
              };
            });
          }
        });
    } else if (!this.unhappyStatus.isAssignNewTask) {
      this.taskService
        .getTaskNameList(search, TaskType.TASK)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          this.taskNameList = res;
        });
    }
  }

  displayPropertyStreetline(streetline: string) {
    if (!streetline) {
      return '';
    }
    return ' • ' + streetline;
  }

  handleConfirmSelectContact(event: {
    id: string;
    type: string;
    enquiries?: boolean;
  }) {
    const { id, type, enquiries } = event;
    if (id) {
      if (
        this.isUnHappyPath &&
        [EConfirmContactType.TENANT, EConfirmContactType.LANDLORD].includes(
          type as EConfirmContactType
        )
      ) {
        this.conversationService
          .confirmTrudiContact(
            this.conversationService.currentConversation.value.id,
            this.taskService.currentTask$.value.id,
            id,
            this.conversationService.currentConversation.value.agencyId
          )
          .subscribe((res) => {
            if (res) {
              this.reloadAfterConfirmContact(res);
            }
          });
      } else if (
        this.isUnHappyPath &&
        [EConfirmContactType.OTHER, EConfirmContactType.SUPPLIER].includes(
          type as EConfirmContactType
        )
      ) {
        this.conversationService
          .confirmTrudiSupplierOrOtherContact(
            id,
            this.taskService.currentTask$.value.id,
            this.conversationService.currentConversation.value.id
          )
          .subscribe((res) => {
            this.reloadAfterConfirmContact(res);
          });
      } else if (
        this.isUnHappyPath &&
        !this.unhappyStatus?.isAssignNewTask &&
        this.unhappyStatus.isConfirmContactUser &&
        this.unhappyStatus.isConfirmProperty
      ) {
        this.conversationService
          .confirmTrudiTaskType(
            this.conversationService.currentConversation.value.id,
            this.taskService.currentTask$.value.id,
            id,
            enquiries
          )
          .subscribe((res) => {
            if (res) {
              this.taskService.reloadTaskArea$.next(true);
              this.conversationService.reloadConversationList.next(true);
              this.headerService.headerState$.next({
                ...this.headerService.headerState$.value,
                currentTask: res
              });
            }
          });
      } else {
        this.conversationService
          .confirmTrudiPropertyContact(
            this.conversationService.currentConversation.value.id,
            this.taskService.currentTask$.value.id,
            id,
            this.conversationService.currentConversation.value.agencyId
          )
          .subscribe((res) => {
            if (res) {
              this.reloadAfterConfirmContact(res);
            }
          });
      }
    }
  }

  reloadAfterConfirmContact(trudiResponse: TrudiResponse) {
    this.handleSetTrudiResponse(trudiResponse);
    this.typeTrudi = trudiResponse.type;
    this.taskService.reloadTaskArea$.next(true);
    this.conversationService.reloadConversationList.next(true);
  }

  changeTitleCurrentTask(title: string) {
    if (!title) return;
    const currentTask = {
      ...this.taskService.currentTask$.value,
      title
    };
    this.taskService.currentTask$.next(currentTask);
  }

  showSelectPeople(status) {
    if (status) {
      switch (this.buttonAction) {
        case ForwardButtonAction.tkLandlord:
          this.forwardLandlordsVisible = true;
          break;
        case ForwardButtonAction.askSupplierQuote:
          this.forwardLandlordsVisible = true;
          break;
        case ForwardButtonAction.supToTenant:
          this.getListSupplierSupToTenant();
          break;
        case ForwardButtonAction.createWorkOrder:
          // this.getListSupplierWorkOrder();
          this.createWorkOrderVisible = true;
          break;
        case ForwardButtonAction.sendQuoteLandlord:
          this.isSendQuoteLandlord = true;
          this.shareService.isStatusStepQuote$.next(false);
          break;
        default:
          break;
      }
      if (this.buttonAction !== ForwardButtonAction.sendQuoteLandlord) {
        this.selectedTicket = {
          options: {
            ...this.trudiTicket?.options,
            userId: this.trudiTicket?.userId,
            firstName: this.trudiTicket?.firstName,
            lastName: this.trudiTicket?.lastName,
            createdAt: this.trudiTicket?.createdAt,
            propertyType: this.trudiTicket?.type,
            isPrimary: this.trudiTicket?.isPrimary
          },
          fileIds: [],
          ticketFile: this.trudiTicket?.ticketFile
        };
        if (
          this.trudiTicket?.ticketFiles &&
          this.trudiTicket?.ticketFiles?.length
        ) {
          this.trudiTicket?.ticketFiles.forEach((ele) => {
            this.selectedTicket.fileIds.push(ele.fileId);
          });
        }
      }
      this.isShowSendMessageModal = false;
    } else {
      this.isSendQuoteLandlord = false;
      this.forwardLandlordsVisible = false;
      this.forwardSupplierVisible = false;
      this.isShowSendMessageModal = false;
      this.selectedUsersFromPopup = [];
      this.selectedTicket = null;
      this.infoAddition = [];
    }
  }

  showSendQuote(status) {
    // Show app LandLord
    if (status) {
      this.isSendQuoteLandlord = true;
      this.isShowAddFilesModal = false;
      this.isShowSendMessageModal = false;
    }
  }

  showAppSendMessage(
    status: PopupState,
    isReset?: boolean,
    noBack?: boolean,
    noTicket?: boolean,
    noAddFile?: boolean
  ) {
    this.isResetModal = status.resetField;
    this.noBackBtn = noBack !== undefined ? noBack : this.noBackBtn;
    this.noTicket = noTicket !== undefined ? noTicket : this.noTicket;
    this.noAddFile = noAddFile !== undefined ? noAddFile : this.noAddFile;
    const isResetFeild = this.sharedService.isResetListFile.getValue();

    // if (this.buttonAction !== ForwardButtonAction.supToTenant && this.buttonAction !== ForwardButtonAction.createWorkOrder) {
    //   this.infoAddition = [];
    // }
    if (
      ![
        ForwardButtonAction.createWorkOrder,
        ForwardButtonAction.supToTenant,
        ForwardButtonAction.askSupplierQuote
      ].includes(this.buttonAction)
    ) {
      this.infoAddition = [];
    }

    if (isResetFeild) {
      this.selectedFiles = [];
      this.listQuoteSelect = [];
    }

    if (status.resetField) {
      this.resetFieldInSendMessage();
    }
    if (status.display) {
      if (isReset) {
        this.isShowAddFilesModal = false;
        this.isResetModal = false;
      }
      this.isSendQuoteLandlord = false;
      this.isShowQuitConfirmModal = false;
      this.forwardLandlordsVisible = false;
      this.forwardSupplierVisible = false;
      this.isShowSendMessageModal = true;
      switch (this.buttonAction) {
        case ForwardButtonAction.askSupplierQuote:
          this.noTicket = false;
          break;
        default:
          break;
      }
    }
  }

  onGoBackSendMessage(event: PopupState) {
    if (
      this.buttonAction === ForwardButtonAction.notifyLandlord ||
      this.buttonAction === ForwardButtonAction.notifyTenant ||
      this.buttonAction === ForwardButtonAction.tell_tenant
    ) {
      this.showAppSendMessage(event, true, true, true, true);
    } else {
      this.showAppSendMessage(event, true);
    }
  }

  backToSendMessageDocumentRequest(status: boolean) {
    this.isShowAddFilesDocumentRequestModal = false;
    this.isAddingFileDocumentRequest = false;
    this.sendMessageDocumentRequestVisible = status;
  }

  showQuitConfirm(status: boolean) {
    this.isResetModal = false;
    if (status) {
      this.isShowSendMessageModal = false;
      this.sendMessageDocumentRequestVisible = false;
      this.forwardLandlordsVisible = false;
      this.isShowAddFilesModal = false;
      this.isShowQuitConfirmModal = true;
    } else {
      this.isShowQuitConfirmModal = false;
      this.isShowSendMessageModal = false;
      this.sendMessageDocumentRequestVisible = false;
      this.forwardLandlordsVisible = false;
      this.selectedFiles = [];
      this.selectedUsersFromPopup = [];
      this.infoAddition = [];
      this.isResetModal = true;
    }
  }

  showSuccessMessageModal(status) {
    if (status) {
      this.isShowSendMessageModal = true;
      this.userService.getUserInfo();
      this.isResetModal = true;
    } else {
      this.isShowSendMessageModal = false;
      // this.isShowSecceessMessageModal = true;
      setTimeout(() => {
        //   this.isShowSecceessMessageModal = false;
      }, 3000);
    }
  }

  showSuccessMessageDocumentRequestModal(status: boolean) {
    this.sendMessageDocumentRequestVisible = false;
  }

  handleCloseQuitDocumentRequestModal(status: boolean) {
    this.isShowQuitConfirmDocumentRequestModal = false;
    if (this.isAddingFileDocumentRequest) {
      // Back to add file popup
      this.isShowAddFilesDocumentRequestModal = !status;
    } else {
      // Back to send msg popup
      this.sendMessageDocumentRequestVisible = !status;
      this.selectedFiles = status ? [] : this.selectedFiles;
    }
  }

  showQuitConfirmDocumentRequest() {
    this.isShowQuitConfirmDocumentRequestModal = true;
    this.sendMessageDocumentRequestVisible = false;
    this.isShowAddFilesDocumentRequestModal = false;
  }

  onSendMsgPopupBack(status: boolean) {
    if (!status) {
      return;
    }

    if (
      this.controlPanelService.forwardLandlordData &&
      this.controlPanelService.forwardLandlordData.owner?.length
    ) {
      this.isShowSendMessageModal = false;
      this.controlPanelService.forwardLandlordData.quote = null;
      this.likeToSayVisible = true;
      this.controlPanelService.forwardLandlordData.type = {
        id: null,
        name: null
      };
    }
  }

  getSelectedUser(event) {
    this.selectedUsersFromPopup = event;
    if (this.buttonAction === ForwardButtonAction.askSupplierQuote) {
      this.currentAction.tenant = {
        ...this.currentAction.tenant,
        title: 'Tenant'
      };
      this.infoAddition = [this.currentAction?.tenant];
    } else {
      this.infoAddition = event;
    }
  }

  showAddFiles(status) {
    if (status) {
      this.isShowAddFilesModal = true;
      this.isSendQuoteLandlord = false;
      this.isShowSendMessageModal = false;
      this.isShowQuitConfirmModal = false;
    } else {
      this.isShowAddFilesModal = false;
      // this.resetSelectedDocument();
      this.isShowSendMessageModal = false;
    }
  }

  backAddFile(status) {
    if (!status) {
      this.isSendQuoteLandlord = true;
      this.isShowAddFilesModal = false;
    } else {
      this.isSendQuoteLandlord = false;
      this.isShowAddFilesModal = false;
      this.isShowSendMessageModal = false;
    }
  }

  doneAddFile(status) {
    const isStatus = this.shareService.isStatusStepQuote$.getValue();
    if (isStatus) {
      this.isShowSendMessageModal = true;
      this.isShowAddFilesModal = false;
      this.isSendQuoteLandlord = false;
    } else {
      this.isSendQuoteLandlord = true;
      this.isShowAddFilesModal = false;
    }
  }

  showAddFileDocumentRequest(status: boolean) {
    if (status) {
      this.isShowAddFilesDocumentRequestModal = true;
      this.isAddingFileDocumentRequest = true;
      this.sendMessageDocumentRequestVisible = false;
      this.isShowQuitConfirmDocumentRequestModal = false;
    } else {
      this.isShowAddFilesDocumentRequestModal = false;
      this.isAddingFileDocumentRequest = false;
      this.sendMessageDocumentRequestVisible = false;
    }
  }

  assignNewIntentData(intentList: Intents[], isChanged?: boolean) {
    this.intentList = this.mapIntentByGroup(intentList);
    const searchInput = this.elr.nativeElement.querySelector(
      '.task-name-dropdown#task-select ng-select input'
    );
    if (isChanged) {
      searchInput.value = intentList[0].name;
    }

    this.selectedIntent = intentList[0]?.id;
    this.conversationService.selectedCategoryId.next(this.selectedIntent);
    if (this.selectedIntent) {
      this.onGetTrudiResponse(this.selectedIntent, this.userConversation?.id);
    }
  }

  mapIntentByGroup(intentList: Intents[]) {
    const intents = intentList.map((i) => ({ ...i, titleOfTopic: otherTopic }));
    const listCategory = this.listCategoryTypes.filter(
      (el) =>
        el.isShowConsole &&
        intents.findIndex((intent) => intent.id === el.id) === -1
    );
    return [...intents, ...listCategory];
  }

  onGetTrudiResponse(categoryId: string, userConversationId: string) {
    this.conversationService
      .getTrudiResponse(categoryId, userConversationId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          //reset currentStep
          this.currentStep = 0;
          this.conversationService.superHappyPathTrudiResponse.next(res);
          this.handleSetTrudiResponse(res);
          this.trudiResponseSuggestions =
            res.data[0].body.newSuggestion?.trudiResponse;
          if (res.data[0].body.newSuggestion?.convertToTask) {
            this.listConvertToTask = [
              { ...res.data[0].body.newSuggestion?.convertToTask },
              ...res.data[0].body.newSuggestion?.suggestedTask
            ];
            this.listConvertSuggestTask = this.listConvertToTask;
          } else if (
            this.intentList[0]?.id === this.CATEGORY_ENUM.generalEnquiryId
          ) {
            this.propertyService.newCurrentProperty
              .pipe(takeUntil(this.unsubscribe))
              .pipe(
                switchMap((res) => {
                  if (res?.regionId) {
                    this.taskRegionId = res.regionId;
                  }
                  return this.taskService.getTaskNameList('', TaskType.TASK);
                }),
                retry(2)
              )
              .subscribe((tasks) => {
                if (tasks.length) {
                  this.listConvertToTask = this.taskService
                    .filterTasksByRegion(tasks, this.taskRegionId, true)
                    .filter(
                      (e) => e.isEnable && e.id !== TaskNameId.routineInspection
                    );
                }
              });
          } else {
            this.listConvertToTask = [
              ...res.data[0].body.newSuggestion?.suggestedTask
            ];
          }
          this.recomendButtons =
            this.trudiResponseSuggestions?.data[0]?.body?.button.filter(
              (item) => !item?.statusToShow
            );
          this.listConvertToTask = this.listConvertToTask.filter(
            (e) => e?.disabled === false || e?.isEnable === true
          );
          this.isPrefillData = this.listConvertToTask.some(
            (e) => e.id === this.intentList[0]?.id
          );
          if (this.listConvertToTask.length) {
            this.selectedTaskToConvert = this.listConvertToTask[0];
          }
        }
      });
  }

  handleCompleteStepTrudiBox(event: TrudiResponse) {
    this.trudiResponse = event;
  }

  handleIntentChange(intentId: string) {
    this.selectedIntentId = intentId;
    if (this.selectedIntentId) {
      this.conversationService.selectedCategoryId.next(this.selectedIntentId);
      this.onGetTrudiResponse(this.selectedIntentId, this.userConversation?.id);
    }
  }

  getSelectedTaskToConvert(task: TaskName) {
    if (task) {
      this.validateTenantInvoiceTask = false;
      this.selectedTaskToConvert = task;
      this.isShowErrConvertToTask = false;
    } else {
      this.selectedTaskToConvert = null;
    }
  }

  checkIsValidateCreateNewTask() {
    this.validateTenantInvoiceTask =
      this.selectedTaskToConvert?.id === TaskNameId.invoiceTenant &&
      this.selectedTenancy.length === 0;
    if (this.conversationService.isSupplierOrOtherContactRaiseMsg()) {
      this.isShowErrConvertToTask = false;
    } else if (!this.selectedTaskToConvert || this.validateTenantInvoiceTask) {
      this.isShowErrConvertToTask = true;
      return false;
    }
    this.isShowErrConvertToTask = false;
    return true;
  }

  getCreateTaskPrefillValue(objectString?: string) {
    const { files, text } = this.trudiResponse?.data[0]?.variable || {};
    const prefillMediaFile = this.filesService
      .filterFileByType(['video', 'photo'], files)
      .slice(-5); // get first 5 media file
    const objectArr = objectString
      ? objectString.split(',')?.map((e) => e?.trim())
      : [];
    this.createTaskPrefillValue = {
      objects: objectArr,
      description: '',
      files: prefillMediaFile
    };
    this.mediaFilesInConversation = prefillMediaFile.length;
  }

  convertMsgToTaskDirectly() {
    /**
       @Description Supplier or Other contact raise msg to create task
     */
    if (
      this.conversationService.isSupplierOrOtherContactRaiseMsg() &&
      this.currentTask.taskType === TaskType.MESSAGE
    ) {
      this.showNewTaskPopupState = true;
      this.listTaskName = [...this.listTaskName].map((task) => ({
        ...task,
        disabled:
          [TaskNameId.invoiceTenant, TaskNameId.invoicing].indexOf(
            task?.id as TaskNameId
          ) === -1
      }));
      return;
    }
    this.conversationService
      .convertToTask(
        this.conversationService.currentConversation.value?.id,
        this.userConversation?.categoryId,
        this.selectedTaskToConvert?.taskNameRegion?.taskNameRegionId,
        this.userConversation?.propertyId,
        this.assignedUserIds
      )
      .subscribe((res) => {
        this.toastService.success(CONVERT_TO_TASK);
        this.taskService.reloadTaskDetail.next(true);

        this.handleUpdateTrudiResponseData(res);
      });
  }

  handleConvertToTask() {
    if (!this.checkIsValidateCreateNewTask() || this.isArchiveMailbox) {
      return;
    }
    this.newTaskNameRegionId =
      this.selectedTaskToConvert?.taskNameRegion?.taskNameRegionId;

    const IdTaskToConvert = this.selectedTaskToConvert?.id as TaskNameId;
    const taskNameIdValues = Object.values(TaskNameId);
    if (!taskNameIdValues.includes(IdTaskToConvert)) {
      this.newTaskTaskNameId = TaskNameId.taskTemplate;
    } else {
      this.newTaskTaskNameId = IdTaskToConvert;
    }

    switch (this.newTaskTaskNameId) {
      case TaskNameId.routineMaintenance:
        this.getCreateTaskPrefillValue(
          this.trudiResponse?.data[0]?.variable?.maintenanceObject
        );
        this.showNewTaskPopupState = true;
        break;

      case TaskNameId.emergencyMaintenance:
        this.getCreateTaskPrefillValue(
          this.trudiResponse?.data[0]?.variable?.emergencyEvent
        );
        this.showNewTaskPopupState = true;
        break;

      case TaskNameId.petRequest:
        this.getCreateTaskPrefillValue(
          this.trudiResponse?.data[0]?.variable?.petType
        );
        this.showNewTaskPopupState = true;
        break;

      case TaskNameId.requestLandlord:
        this.titleRequestLandlordTenant = 'Create request for landlord';
        this.getCreateTaskPrefillValue();
        this.showNewTaskPopupState = true;
        break;

      case TaskNameId.requestTenant:
        this.titleRequestLandlordTenant = 'Create request for tenant';
        this.getCreateTaskPrefillValue();
        this.showNewTaskPopupState = true;
        break;
      case TaskNameId.routineInspection:
      case TaskNameId.generalCompliance:
      case TaskNameId.smokeAlarms:
      case TaskNameId.leasing:
      case TaskNameId.tenantVacate:
      case TaskNameId.breachNotice:
      case TaskNameId.leaseRenewal:
      case TaskNameId.invoiceTenant:
      case TaskNameId.invoicing:
        this.showNewTaskPopupState = true;
        break;

      case TaskNameId.taskTemplate:
        this.titleRequestLandlordTenant = 'Create request summary';
        this.getCreateTaskPrefillValue();
        this.showNewTaskPopupState = true;
        break;

      default:
        this.convertMsgToTaskDirectly();
        break;
    }
  }

  subscribeGetTopicsList() {
    this.agencyService.listTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.getTaskNameList();
        }
      });
  }

  getTaskNameList() {
    this.listTaskName = this.taskService.createTaskNameList();
  }

  handleRemoveFileItem(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  getSelectedFile(event) {
    const statusQuoteFile = this.shareService.isStatusStepQuote$.getValue();
    if (!statusQuoteFile && !this.listQuoteSelect.includes(event)) {
      this.shareService.isStatusStepQuote$.next(false);
      this.listQuoteSelect.push({
        id: uuid4(),
        icon: event[0].icon,
        checked: true,
        ...event
      });
    } else {
      // this.shareService.isStatusStepQuote$.next(true);
      this.selectedFiles.push({
        id: uuid4(),
        icon: event[0].icon,
        ...event
      });
    }
  }

  getSelectedFileDocumentRequest(event) {
    this.selectedFiles.push({
      id: uuid4(),
      icon: event[0].icon,
      ...event
    });
  }

  resetFieldInSendMessage() {
    this.selectedActionLinks = [];
    // this.selectedFiles = [];
  }

  closeModal(status) {
    if (status) {
      this.listQuoteSelect = [];
    }
    this.isShowSendMessageModal = false;
  }

  onCloseModalAddTenancyAgreement(status: boolean) {
    // status is true means close modal
    this.addTenancyAgreementDocumentRequestVisible = !status;
  }

  onNextModalAddTenancyAgreement(listFile) {
    this.addTenancyAgreementDocumentRequestVisible = false;
    this.sendMessageDocumentRequestVisible = true;
    // map data to match requirement of upload file AWSS3
    this.selectedFiles = listFile.map((file) => ({
      ...[file],
      title: file.fileName,
      topicId: '',
      id: uuid4(),
      icon: file.icon
    }));
    const responseHaveText = this.trudiResponse.data.find(
      (res) => res.body.text && res.body.text.length
    );
    this.textContentSendMsg = responseHaveText.body.text;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.userService.tenancyId$.next(null);
    this.sharedService.statusMaintenaceRealTime.next(null);
    this.controlPanelService.reloadForwardRequestList.next(null);
    this.conversationService.newTrudiResponseSuggestion.next(null);
    this.conversationService.superHappyPathTrudiResponse.next(null);
    this.conversationService.trudiResponseConversation.next(null);
    // Note: reset maintenance sync data
    // this.maintenancePTService.setMaintenanceDataState(
    //   this.maintenancePTService.getMaintenanceRequestDefaultValue
    // );
  }

  getlistQuoteSupplierSelected(list) {
    this.selectedFiles = list;
  }

  showOpenLikeToSay(status: boolean) {
    this.forwardLandlordsVisible = false;
    if (status) {
      this.likeToSayVisible = true;
    } else {
      this.isSendQuoteLandlord = true;
    }
  }

  closeSendQuoteLandlord(event: boolean) {
    if (event) {
      this.isSendQuoteLandlord = false;
    } else {
      this.isSendQuoteLandlord = false;
      this.forwardLandlordsVisible = true;
    }
  }

  showAppSendMessageFromSelectPeople(event: PopupState) {
    if (
      this.buttonAction === ForwardButtonAction.askSupplierQuote &&
      this.currentAction?.tenant
    ) {
      this.currentAction.tenant = {
        ...this.currentAction.tenant,
        title: 'Tenant'
      };
      this.infoAddition = [this.currentAction?.tenant];
    }

    if (this.buttonAction === ForwardButtonAction.supToTenant) {
      this.showAppSendMessage(event, false, false, true, true);
      this.getTenantRaisedTask();
    } else {
      this.showAppSendMessage(event, false, false);
    }
  }

  getTenantRaisedTask() {
    const { firstName, lastName, propertyType, userId } =
      this.conversationService.trudiResponseConversation.getValue();
    if (this.selectedUsersFromPopup.some((data) => data.userId === userId))
      return;
    this.selectedUsersFromPopup.push({
      type: propertyType,
      firstName,
      lastName,
      userId
    });
  }

  onCloseCreateTaskByCateModal() {
    this.showCreateTaskByCate = false;
    this.showCreateRequestLandlordTenantTaskModal = false;
  }

  onComfirmCreateTaskByCate(trudiResponse) {
    this.toastService.success(CONVERT_TO_TASK);
    this.taskService.currentTask$.next({
      ...this.taskService.currentTask$.value,
      taskType: TaskType.TASK,
      trudiResponse
    });

    this.handleUpdateTrudiResponseData(trudiResponse);
    this.onCloseCreateTaskByCateModal();
  }
}
