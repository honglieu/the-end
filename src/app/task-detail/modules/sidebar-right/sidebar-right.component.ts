import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { UnhappyStatus } from '@shared/types/unhappy-path.interface';
import {
  ShowSidebarRightService,
  TaskDetailService
} from './../../services/task-detail.service';

import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, combineLatest, of } from 'rxjs';
import {
  catchError,
  delay,
  distinctUntilChanged,
  filter,
  first,
  map,
  switchMap,
  take,
  takeUntil,
  timeout
} from 'rxjs/operators';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { EmergencyMaintenanceAPIService } from '@/app/emergency-maintenance/services/emergency-maintenance-api.service';
import { TIME_FORMAT } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { HeaderService } from '@services/header.service';
import { LeaseRenewalService } from '@services/lease-renewal.service';
import { LeasingService } from '@services/leasing.service ';
import { LoadingService } from '@services/loading.service';
import { MaintenanceRequestService } from '@services/maintenance-request.service';
import { PopupService } from '@services/popup.service';
import { RoutineInspectionService } from '@services/routine-inspection.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { TenantLandlordRequestService } from '@services/tenant-landlord-request.service';
import { TrudiService } from '@services/trudi.service';
import { UserService } from '@services/user.service';
import { PrefillValue } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { ECategoryType } from '@shared/enum/category.enum';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { TaskNameId, TaskType } from '@shared/enum/task.enum';
import { ETrudiType } from '@shared/enum/trudi';
import { EUserPropertyType } from '@shared/enum/user.enum';
import {
  MaintenanceNote,
  UserConversation
} from '@shared/types/conversation.interface';
import { EScheduledStatus } from '@shared/types/message.interface';
import { InspectionSyncData } from '@shared/types/routine-inspection.interface';
import { ITaskDetail, ITaskTemplate } from '@shared/types/task.interface';
import {
  LeaseRenewalRequestTrudiResponse,
  TaskDetailPet,
  TrudiResponse
} from '@shared/types/trudi.interface';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { PTWidgetDataField } from './components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { WidgetPTService } from './components/widget-property-tree/services/widget-property.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import {
  trigger,
  transition,
  state,
  style,
  animate
} from '@angular/animations';
import { CompanyService } from '@services/company.service';
import { TaskPreviewService } from '@/app/dashboard/modules/task-page/modules/task-preview/services/task-preview.service';
import { WidgetCalendarComponent } from './components/widget-calendar/widget-calendar.component';
import { WidgetPropertyTreeComponent } from './components/widget-property-tree/widget-property-tree.component';
import { WidgetReiFormComponent } from './components/widget-rei-form/widget-rei-form.component';
import { WidgetAttachmentsComponent } from './components/widget-attachments/widget-attachments.component';
import { AiSummaryComponent } from '@/app/task-detail/modules/app-chat/components/ai-summary/containers/ai-summary.component';
import { WidgetLinkedComponent } from './components/widget-linked/widget-linked.component';
import {
  EPropertyTreeOption,
  EPropertyTreeType
} from '@/app/task-detail/utils/functions';
import { EventCalendarService } from './services/event-calendar.service';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-task-loading.service';
type UserConversationOption = Partial<UserConversation>;

@Component({
  selector: 'app-sidebar-right',
  templateUrl: './sidebar-right.component.html',
  styleUrls: ['./sidebar-right.component.scss'],
  animations: [
    trigger('openClose', [
      state('false', style({ width: '0' })),
      state('true', style({ display: 'block', width: '400px' })),
      transition('false <=> true', [animate('0.3s ease-out')])
    ])
  ]
})
@DestroyDecorator
export class SidebarRightComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isShowSidebarRight: boolean = false;
  @Input() hightLightCalendarEvent: boolean = false;
  @ViewChild('widgetAiSummary') widgetAiSummary: AiSummaryComponent;
  @ViewChild('widgetCalendar') widgetCalendar: WidgetCalendarComponent;
  @ViewChild('widgetPropertyTree')
  widgetPropertyTree: WidgetPropertyTreeComponent;
  @ViewChild('widgetReiForm') widgetReiForm: WidgetReiFormComponent;
  @ViewChild('widgetAttachments') widgetAttachments: WidgetAttachmentsComponent;
  @ViewChild('widgetLinked') widgetLinked: WidgetLinkedComponent;
  private unsubscribe = new Subject<void>();
  public taskId: string;
  public taskType?: TaskType;
  public TaskTypeEnum = TaskType;
  public popupModalPosition = ModalPopupPosition;
  public isShowQuitConfirmModal = false;
  public isShowCreateTaskByCategory = false;
  public isShowEditDetailLandlordTenantTask = false;
  public trudiType: ETrudiType;

  public taskTypeId: TaskNameId;
  public taskNameId: TaskNameId;
  public taskDetailData: ITaskDetail | TaskDetailPet | ITaskTemplate = null;
  public requestTitle = '';
  public taskName = '';

  conversationType = EConversationType;
  selectedConversationToResolve: UserConversationOption;
  userPropertyType = EUserPropertyType;
  public currentTaskDeleted: boolean = false;
  public isSupplierOrOther: boolean = false;
  unHappyStatus: UnhappyStatus;
  dataPrefill: PrefillValue;
  mediaFilesInConversation: number = 0;
  isShowTrudiSendMsg = false; // todo: remove unused code
  public paragraph: object = { rows: 0 };

  public currentTaskTitle: string = '';
  public isClickSendTask: boolean = false;
  public isMaintenanceFlow: boolean = false;
  public isShowAddressMoveConversation: boolean = false;
  public maintenanceNote: MaintenanceNote = null;
  public showTaskNoteWidget = false;
  public isShowSelectEventPopup: boolean = false;
  public showBreachNoticeWidget: boolean = false;
  public showBreachNoticeWidgetCalendar: Boolean = false;
  private taskListDisplayedNoteWidget = [
    TaskNameId.routineMaintenance,
    TaskNameId.routineInspection,
    TaskNameId.tenantVacate
  ];
  public reiToken: String = '';
  public CRMSystemName = ECRMSystem;
  public textForward: string = '';
  public prefillVariables: Record<string, string> = {};
  public listRoutineInspection: InspectionSyncData[] = [];
  public currentCompanyCRMSystemName$ =
    this.companyService.currentCompanyCRMSystemName;

  public declineMsgConfig = {
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'body.prefillReceivers': false,
    'body.prefillTitle': '',
    'otherConfigs.isShowGreetingContent': true
  };
  public isNoPropertyTask: boolean = false;
  public typePopup: EPropertyTreeType | EPropertyTreeOption;
  public optionPopup: {};

  public readonly isShowCalendarEventPopup$ =
    this.eventCalendarService.isShowSelectEventPopup.pipe(
      takeUntil(this.unsubscribe)
    );

  public readonly propertyTreeWidgetState$ = this.widgetPTService
    .getPopupWidgetState()
    .pipe(
      map((state) => {
        if (state && typeof state === 'object' && 'type' in state) {
          return {
            typePopup: state.type,
            optionPopup: state.option
          };
        }
        return {
          typePopup: state,
          optionPopup: null
        };
      })
    );

  public shouldRenderWidgets: boolean = false;

  constructor(
    public conversationService: ConversationService,
    private activatedRoute: ActivatedRoute,
    private agentUserService: AgentUserService,
    public popupService: PopupService,
    public userService: UserService,
    public taskService: TaskService,
    public readonly sharedService: SharedService,
    private headerService: HeaderService,
    private maintenanceService: MaintenanceRequestService,
    private tenantLandlordRequestService: TenantLandlordRequestService,
    private leaseRenewalService: LeaseRenewalService,
    public leasingService: LeasingService,
    public stepService: StepService,
    private emergencyMaintenanceService: EmergencyMaintenanceAPIService,
    private trudiService: TrudiService,
    private taskDetailService: TaskDetailService,
    public loadingService: LoadingService,
    private websocketService: RxWebsocketService,
    public agencyDashboardService: AgencyDashboardService,
    private routineInspectionService: RoutineInspectionService,
    private toastService: ToastrService,
    public widgetPTService: WidgetPTService,
    private agencyDateFormatService: AgencyDateFormatService,
    private taskPreviewService: TaskPreviewService,
    private companyService: CompanyService,
    private showSidebarRightService: ShowSidebarRightService,
    private eventCalendarService: EventCalendarService,
    private messageTaskLoadingService: MessageTaskLoadingService
  ) {
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!this.taskType) {
          this.taskType = res.get('type') as TaskType;
          this.taskDetailService.setTaskType(this.taskType);
        }
      });
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        if (event.isDraft) {
          return;
        }
        this.routineInspectionService
          .changeStatusRecheduled({
            messageId:
              this.routineInspectionService.showRescheduleMessage.value.id,
            status: EScheduledStatus.DECLINED
          })
          .subscribe({
            next: () => {
              this.conversationService.reloadConversationList.next(true);
            },
            error: (err) => {
              this.toastService.error(err.message);
            },
            complete: () => {
              this.stopProcess();
            }
          });
        break;
      default:
        break;
    }
  }

  ngOnInit() {
    this.subscribeCurrentTask();
    this.subscribeCurrentReiToken();
    this.taskService.clickSendTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isClickSendTask = res;
      });

    this.subscribeReiformTokenUpdateSocket();

    this.widgetPTService
      .getPopupWidgetState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((state) => {
        if (state && typeof state === 'object' && 'type' in state) {
          this.typePopup = state.type;
          this.optionPopup = state.option;
        } else {
          this.typePopup = state;
          this.optionPopup = null;
        }
      });

    this.initData();
    this.handleRenderWidgets();
  }

  private handleRenderWidgets() {
    const messageTaskLoadingCompleted$ = combineLatest([
      this.messageTaskLoadingService.isLoading$,
      this.messageTaskLoadingService.isLoadingMessage$
    ]).pipe(
      first(([isLoading, isLoadingMessage]) => !isLoading && !isLoadingMessage),
      catchError(() => of(false))
    );

    this.taskService.currentTask$
      .pipe(
        filter(Boolean),
        switchMap((task) => {
          if (!task?.conversations?.length) {
            return of(false);
          }
          return messageTaskLoadingCompleted$;
        }),
        timeout(5000),
        catchError(() => of(false)),
        delay(500),
        take(1),
        takeUntil(this.unsubscribe)
      )
      .subscribe(() => {
        this.shouldRenderWidgets = true;
      });
  }

  private initData() {
    this.widgetPTService
      .getPTWidgetStateByType<InspectionSyncData[]>(
        PTWidgetDataField.ROUTINE_INSPECTION
      )
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((data) => {
          if (!data.length) return of(null);
          this.listRoutineInspection = data;
          return this.routineInspectionService.showRescheduleMessage;
        })
      )
      .subscribe((message) => {
        const taskNameIdValues = Object.values(TaskNameId);
        if (
          !taskNameIdValues.includes(this.taskNameId as TaskNameId) &&
          message
        ) {
          this.declineMsgConfig['body.prefillTitle'] =
            message?.conversationTitle;
          this.textForward = this.replaceMessageDecline();
          this.replaceInspectionDetail(message);
          this.isShowTrudiSendMsg = true;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    // clear triggerOpenTaskFormCalender when navigate to other task
    if (
      changes['isShowSidebarRight'] &&
      !changes['isShowSidebarRight'].currentValue &&
      changes['isShowSidebarRight'].previousValue
    ) {
      this.taskPreviewService.setTriggerOpenTaskFormCalender(false);
    }
  }

  subscribeCurrentReiToken() {
    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.reiToken = res.reiToken;
        }
      });
  }

  subscribeReiformTokenUpdateSocket() {
    this.websocketService.onSocketReiformTokenUpdate
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.reiToken = res.reiToken;
        }
      });
  }

  editDetailRequestLandlordTenantTask(data) {
    const trudiResponse = this.taskService.currentTask$.value?.trudiResponse;
    const receivers = (trudiResponse as LeaseRenewalRequestTrudiResponse)
      .data[0].variable.receivers;
    this.tenantLandlordRequestService
      .saveVariableResponseData(this.taskId, receivers, data)
      .pipe(takeUntil(this.unsubscribe))
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
    const task$ = this.taskService.currentTask$.pipe(
      distinctUntilChanged(),
      takeUntil(this.unsubscribe)
    );
    task$.subscribe((task) => {
      if (task && task.id) {
        this.isNoPropertyTask = task.property?.isTemporary;
        this.taskId = task.id;
        this.taskType = task.taskType;
        this.currentTaskDeleted = this.taskService.checkIfCurrentTaskDeleted();
        this.headerService.headerState$.next({
          ...this.headerService.headerState$.value,
          currentTask: task,
          title: task.status.toLowerCase()
        });
        this.taskNameId = task?.taskNameId;
        this.taskName = task.title;
        const summary = {
          description: (task.trudiResponse as TrudiResponse)?.summaryNote,
          photos: (task.trudiResponse as TrudiResponse)?.summaryPhotos,
          title: task.title,
          textForward: this.replaceMessageFile(
            (task.trudiResponse as TrudiResponse)?.summaryNote
          )
        };

        this.showTaskNoteWidget = this.taskListDisplayedNoteWidget.includes(
          task?.trudiResponse?.setting?.taskNameId
        );
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

  showQuitConfirm(status: boolean) {
    if (status) {
      this.isShowQuitConfirmModal = true;
    } else {
      this.isShowQuitConfirmModal = false;
      this.agentUserService.setIsCloseAllModal(true);
    }
  }

  handleConfirmEdit(data) {
    const trudiResponse = this.taskService.currentTask$.value?.trudiResponse;
    switch (trudiResponse.setting.categoryId) {
      case ECategoryType.routineMaintenance:
        const routineMaintenanceReceivers = (
          trudiResponse as LeaseRenewalRequestTrudiResponse
        ).data[0].variable.receivers;
        this.maintenanceService
          .saveVariableResponseData(
            this.taskId,
            routineMaintenanceReceivers,
            data
          )
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            if (res) {
              this.maintenanceService.maintenanceRequestResponse.next(res);
              this.trudiService.updateTrudiResponse = res;
              this.isShowCreateTaskByCategory = false;
              this.taskService.reloadTaskArea$.next(true);
              this.taskService.reloadTaskDetail.next(true);
            }
          });
        break;
      case ECategoryType.emergencyMaintenance:
        const emergencyMaintenanceReceivers = (
          trudiResponse as LeaseRenewalRequestTrudiResponse
        ).data[0].variable.receivers;
        this.emergencyMaintenanceService
          .saveVariableResponseData(
            this.taskId,
            emergencyMaintenanceReceivers,
            data
          )
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            if (res) {
              this.trudiService.updateTrudiResponse = res;
              this.isShowCreateTaskByCategory = false;
              this.taskService.reloadTaskArea$.next(true);
              this.taskDetailData = res.data?.[0]?.taskDetail;
              this.taskService.reloadTaskDetail.next(true);
            }
          });
        break;
      default:
        this.emergencyMaintenanceService
          .editSummary(this.taskId, data)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            const summary = {
              description: res?.summaryNote,
              photos: res?.summaryPhotos,
              textForward: this.replaceMessageFile(res?.summaryNote),
              title: this.taskName
            };
            this.taskDetailData = summary;
            this.isShowCreateTaskByCategory = false;
            this.taskService.currentTask$.next({
              ...this.taskService.currentTask$.value,
              trudiResponse: res
            });
          });
        break;
    }
  }

  handleExpandSidePanel() {
    this.showSidebarRightService.handleToggleSidebarRight(true);
  }

  replaceMessageFile(summaryNote) {
    return `Hi {receiver first name},\n\nWe have received the following request: \n\n{content} • Summary: ${
      summaryNote ||
      "<span style='color: var(--danger-500, #fa3939);' contenteditable='false'>unknown</span>"
    }\n • We have attached any relevant photos of the issue. \n\nThank you. \n\n{Name}, {Role} \n{Agency} `;
  }

  replaceInspectionDetail(message) {
    const inspectionData = this.listRoutineInspection.find(
      (item) => item.id === message?.options.inspectionId
    );
    const inspectionDate = this.sharedService.formatDateNth(
      inspectionData?.startTime
    );
    const startTimeString = this.agencyDateFormatService.formatTimezoneDate(
      inspectionData?.startTime,
      TIME_FORMAT
    );
    const endTimeString = this.agencyDateFormatService.formatTimezoneDate(
      inspectionData?.endTime,
      TIME_FORMAT
    );

    this.prefillVariables = {
      '{inspection date}': inspectionDate,
      '{start time}': startTimeString,
      '{end time}': endTimeString
    };
  }
  replaceMessageDecline() {
    return `Hello {receiver first name},\n\nThanks for requesting an alternative time for your routine inspection.\n\nUnfortunately in this instance we have been unable to accommodate your request.\n\nYour next routine inspection remains scheduled for {inspection date}, {start time} - {end time}.\n\nShould you be unable to be present on this day and time, please advise if there is any maintenance we need to be aware of prior to the inspection.\n\nThank you,\n{name}, {role}\n{agency}"`;
  }

  stopProcess() {
    this.isShowTrudiSendMsg = false;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.popupService.isShowActionLinkModal.next(false);
    this.leaseRenewalService.leaseRenewalRequestResponse.next(null);
    this.conversationService.reloadConversationList.next(false);
    this.conversationService.conversationSearch.next('');
    this.conversationService.resetCurrentPropertyId();
    this.conversationService.resetConversationList();
    this.conversationService.resetSearchAddressFromUsers();
    this.conversationService.currentConversationId.next(null);
    this.trudiService.updateTrudiResponse = null;
    this.taskPreviewService.setTriggerOpenTaskFormCalender(false);
  }
}
