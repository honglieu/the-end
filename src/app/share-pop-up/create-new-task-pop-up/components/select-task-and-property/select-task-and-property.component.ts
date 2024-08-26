import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
  takeUntil,
  takeWhile,
  tap
} from 'rxjs';
import { ComplianceService } from '@/app/compliance/services/compliance.service';
import { ESelectOpenComplianceItemPopup } from '@/app/compliance/utils/compliance.enum';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { CalendarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendar.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { UserService as DashboardUserService } from '@/app/dashboard/services/user.service';
import { ConversationService } from '@services/conversation.service';
import { HeaderService } from '@services/header.service';
import { LeasingService } from '@services/leasing.service ';
import {
  CONVERT_TO_TASK,
  CREATE_TASK_SUCCESSFULLY
} from '@services/messages.constants';
import { NavigatorService } from '@services/navigator.service';
import { NotificationService } from '@services/notification.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { EEventType, EReminderType } from '@shared/enum/calendar.enum';
import { ECategoryType } from '@shared/enum/category.enum';
import { EConfirmContactType } from '@shared/enum/contact-type';
import {
  LeasingRequestButtonAction,
  LeasingStepIndex
} from '@shared/enum/leasing-request.enum';
import { RegionId } from '@shared/enum/region.enum';
import { TaskNameId, TaskType } from '@shared/enum/task.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { AgentItem, InviteStatus } from '@shared/types/agent.interface';
import {
  BindingValueTaskItemDropdown,
  NewTaskOptions,
  TaskItem,
  TaskItemDropdown,
  TaskName,
  TaskRegionItem
} from '@shared/types/task.interface';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { IMailBox } from '@shared/types/user.interface';
import { SmokeAlarmInvoiceFormService } from '@/app/smoke-alarm/modules/send-invoice-to-pt/services/invoice-form.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { EMailBoxStatus, EMailBoxType } from '@shared/enum/inbox.enum';
import { SharedService } from '@services/shared.service';
import { EPopupShow } from '@/app/share-pop-up/create-new-task-pop-up/create-new-task-pop-up.component';
import { scrollSelectedIntoView } from '@shared/utils/helper-functions';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import {
  ITaskFolder,
  TaskFolderResponse
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { IListConversationConfirmProperties } from '@shared/types/conversation.interface';
import { CreateTaskFormService } from '@/app/share-pop-up/create-new-task-pop-up/services/create-task-form.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { CreateNewTaskPopUpService } from '@/app/share-pop-up/create-new-task-pop-up/services/create-new-task-pop-up.service';
import { cloneDeep } from 'lodash-es';
import { stringFormat } from '@core/util/string';
import { AppRoute } from '@/app/app.route';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { CompanyService } from '@services/company.service';

export interface SelectTaskAndPropertyNextData {
  defaultTaskFolderMailBoxId: string;
  isRemember: boolean;
  taskNameId: string;
  aiSummary?: boolean;
  taskNameRegionId?: string;
  assignedUserIds: string[];
  propertyId: string;
  options?;
  taskNameTitle?: string;
  notificationId?: string;
  eventId?: string;
  indexTitle?: string;
  taskTitle?: string;
  successCallBack?: Observable<any>;
  mailBoxId?: string;
  taskFolderId: string;
}

enum ECreateTaskStep {
  TASK_STEP = 1,
  PROPERTY_STEP = 2,
  ASSIGNEE_STEP = 3,
  FOLDER_STEP = 4
}

@Component({
  selector: 'select-task-and-property',
  templateUrl: './select-task-and-property.component.html',
  styleUrls: ['./select-task-and-property.component.scss']
})
export class SelectTaskAndPropertyComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() defaultMailBoxId: string;
  @Input() taskNameList: TaskItemDropdown[];
  @Input() activeProperty: UserPropertyInPeople[];
  @Input() appearanceState = false;
  @Input() openFrom: CreateTaskByCateOpenFrom;
  @Input() taskNameRegionId = '';
  @Input() isShowSelectMailBox: boolean = false;
  @Input() selectedTaskNameId: TaskNameId;
  @Input() assignedUserIds: string[] = [];
  @Input() selectedTenancyId: string;
  @Input() taskNameTitle: string = '';
  @Input() emailTitle: string = '';
  @Input() hasUserInMessage: boolean;
  @Input() selectedTaskToConvert: TaskName;
  @Input() selectedComplianceId: string;
  @Input() createMultiple: boolean;
  @Input() numberOfMessage: number;
  @Input() listEventBulkCreateTask: ICalendarEvent[];
  @Input() showBackBtn: boolean = false;
  @Input() selectedFolderId: string;
  @Input() dataConvert: IListConversationConfirmProperties[];
  public isDisconnected: boolean = false;
  public listOfAgent: AgentItem[] = [];
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() onNext = new EventEmitter<SelectTaskAndPropertyNextData>();
  @Output() resetValueSummary = new EventEmitter<string>();
  @Output() onTaskNameChange = new EventEmitter<TaskItemDropdown>();
  @Output() onBack: EventEmitter<void> = new EventEmitter<void>();
  @Output() createFolder = new EventEmitter<EPopupShow>();

  @ViewChild('ngSelectAssignTo') ngSelectAssignTo: NgSelectComponent;
  @ViewChild('selectTaskAndProperty') selectTaskAndProperty: ElementRef;
  @ViewChild('dropdown') dropdown: ElementRef;
  public inputFocused = false;
  public isComplianceFlow: boolean = false;
  searchInputEmpty = false;
  listOfPeopleInSelectBox: UserPropertyInPeople[] = [];
  listofActiveProp: UserPropertyInPeople[] = [];
  crtUser: UserPropertyInPeople;
  waitToSetValue1: NodeJS.Timeout;
  formGroup: FormGroup;
  public listMailBoxs: IMailBox[] = [];
  public currentMailBox: IMailBox;
  currentTask: TaskItem;
  formValidate = {
    task: false,
    property: false,
    title: false,
    taskGroup: false,
    assign: false,
    taskNameTitle: false,
    folder: false
  };
  focusTime = 0;
  public selectedTaskName: TaskItemDropdown;
  private subscribers = new Subject<void>();
  public leaseRenewalStatus = {
    noActiveTenant: false
  };
  public listFolder: ITaskFolder[] = [];

  public isCreateBlankTask: boolean = false;
  public taskNameId = TaskNameId;
  public notification;
  public notificationId: string;
  public calendarEventSelected: ICalendarEvent;
  public disabledNextBtn: boolean = true;
  public listInviteStatus: typeof InviteStatus = InviteStatus;
  public readonly: boolean = false;
  public returnRouterUrl: string = '';
  public taskIdOfConversation: string = '';
  public eventTypeEmailRemider: string;
  public isRmEnvironment: Boolean = false;
  private inputManually$ = new BehaviorSubject<boolean>(null);
  public currentMailBoxId: string;
  public showPopover: boolean = false;
  public disabledPropertyField = false;
  public loading: boolean = false;
  public hasAddAccount: boolean = false;
  readonly EMailBoxStatus = EMailBoxStatus;
  readonly mailBoxType = EMailBoxType;
  private unsubscribe = new Subject<void>();
  public isConsole: boolean;
  public createTaskByCateOpenFrom = CreateTaskByCateOpenFrom;
  public currentFolderId = '';
  public totalTasks: number = 1;
  public currentStep: number = 1;
  public isFolderMode: boolean = true;
  public isFormValid: boolean = false;
  public readonly eCreateTaskStep = ECreateTaskStep;

  // value of control have format [mailboxId, folderId]
  public saveToFieldControl = new FormControl([]);

  constructor(
    private propertyService: PropertiesService,
    private conversationService: ConversationService,
    private headerService: HeaderService,
    private taskService: TaskService,
    private toastService: ToastrService,
    private router: Router,
    private userService: UserService,
    private dashboardUserService: DashboardUserService,
    private dashboardApiService: DashboardApiService,
    private agencyService: AgencyService,
    private notificationService: NotificationService,
    private smokeAlarmInvoiceFormService: SmokeAlarmInvoiceFormService,
    private calendarService: CalendarService,
    private navigatorService: NavigatorService,
    private leasingService: LeasingService,
    private complianceService: ComplianceService,
    private inboxService: InboxService,
    private inboxSidebarService: InboxSidebarService,
    private sharedService: SharedService,
    private createTaskFormService: CreateTaskFormService,
    private sharedMessageViewService: SharedMessageViewService,
    private cdr: ChangeDetectorRef,
    private showSidebarRightService: ShowSidebarRightService,
    private createNewTaskPopUpService: CreateNewTaskPopUpService,
    private companyService: CompanyService
  ) {
    this.formGroup = this.createTaskFormService.buildForm();
  }

  ngOnDestroy() {
    this.createNewTaskPopUpService.clear();
    this.createTaskFormService.clear();
    this.subscribers.next();
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.subscribers.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    const {
      appearanceState,
      activeProperty,
      hasUserInMessage,
      taskNameTitle,
      createMultiple,
      taskNameList
    } = changes;

    if (taskNameList) {
      this.sortTaskByLatestUpdate();
    }

    if (createMultiple?.currentValue) {
      this.getSelectedTask.enable();
    }

    if (appearanceState) {
      this.disabledNextBtn = false;
      if (!appearanceState.currentValue) {
        this.formValidate = {
          task: false,
          property: false,
          title: false,
          taskGroup: false,
          assign: false,
          taskNameTitle: false,
          folder: false
        };
        this.formGroup.markAsUntouched();
        this.clearAllOfTimer();
      }
    }
    if (
      hasUserInMessage &&
      !this.hasUserInMessage &&
      !this.inputManually$?.getValue()
    ) {
      this.setTaskNameTitle(this.selectedTaskToConvert);
    }

    if (!taskNameTitle) {
      this.handleFindTaskNameValue(this.taskNameTitle);
    } else this.handleFindTaskNameValue(taskNameTitle?.currentValue);

    if (activeProperty?.currentValue?.length) {
      this.listOfPeopleInSelectBox = activeProperty.currentValue;
    }
    if (!this.getSelectedTask.value && !this.inputManually$?.getValue()) {
      this.handleChangeForm();
    }
    this.handleDisableFormEmpty();
  }

  ngOnInit(): void {
    this.sortTaskByLatestUpdate();
    this.isConsole = this.sharedService.isConsoleUsers();
    this.getListAgentAndMailbox();

    this.taskIdOfConversation =
      this.createNewTaskPopUpService.getFocusedConversation()?.taskId ||
      this.conversationService.currentConversation?.value?.taskId;
    this.calendarEventSelected = this.taskService.calendarEventSelected$.value;
    this.readonly = this.openFrom === CreateTaskByCateOpenFrom.CALENDAR;

    let isSubscribers = false;
    this.userService.selectedUser
      .pipe(
        filter((res) => res && Object.keys(res).length > 0),
        takeWhile(() => !isSubscribers),
        takeUntil(this.subscribers)
      )
      .subscribe((res) => {
        isSubscribers = true;
        const isPortalUser = res?.type === UserTypeEnum.LEAD;
        this.disabledNextBtn = !isPortalUser;
      });

    this.subscribeToCurrentTask();

    if (!this.hasUserInMessage) {
      this.setTaskNameTitle(this.selectedTaskToConvert);
    }

    this.propertyService.listofActiveProp
      .pipe(
        takeUntil(this.subscribers),
        tap(() => {
          this.loading = true;
        }),
        distinctUntilChanged(),
        filter((res) => !!res)
      )
      .subscribe((res) => {
        this.loading = false;
        const supplierOrOther = [
          EConfirmContactType.SUPPLIER,
          EConfirmContactType.OTHER
        ];

        this.listofActiveProp = res;
        const confirmContactType =
          this.currentTask?.unhappyStatus?.confirmContactType;
        const startMessageBy = this.currentTask?.conversations?.[0]
          ?.startMessageBy as EConfirmContactType;
        const isMessageTask = this.currentTask?.taskType === TaskType.MESSAGE;
        const isOpenFromTask = this.openFrom === CreateTaskByCateOpenFrom.TASK;

        const isSupplierOrOtherRaiseConfirmMsg =
          supplierOrOther.includes(confirmContactType) &&
          supplierOrOther.includes(startMessageBy);

        const isListUserRaiseMsgRM = [
          EConfirmContactType.TENANT_PROSPECT,
          EConfirmContactType.UNIDENTIFIED,
          EConfirmContactType.SUPPLIER,
          EConfirmContactType.OTHER,
          EConfirmContactType.OWNER_PROSPECT,
          EConfirmContactType.LANDLORD_PROSPECT
        ].includes(startMessageBy);

        if (
          (isSupplierOrOtherRaiseConfirmMsg && isMessageTask) ||
          (this.isRmEnvironment && isListUserRaiseMsgRM && isMessageTask) ||
          isOpenFromTask
        ) {
          this.listOfPeopleInSelectBox = res;
        }
      });

    let item = this.listofActiveProp?.find(
      (item) => item.id === this.currentTask?.property?.id
    );

    if (this.openFrom !== CreateTaskByCateOpenFrom.CALENDAR) {
      this.waitToSetValue1 = setTimeout(() => {
        if (this.currentTask?.property?.streetline && this.openFrom != 'TASK') {
          this.crtUser = item;
          const searchInput =
            this.selectTaskAndProperty?.nativeElement.querySelector(
              '.search-box#property-select ng-select input'
            );
          searchInput && (searchInput.value = item?.streetline || '');
        }
      }, 30);
    }

    if (
      item &&
      this.openFrom !== CreateTaskByCateOpenFrom.TASK &&
      this.openFrom !== CreateTaskByCateOpenFrom.CALENDAR
    ) {
      this.getSelectedProperty.setValue(item?.id);
      if (this.conversationService.isSupplierOrOtherContactRaiseMsg()) {
        this.getSelectedProperty.reset('');
      } else {
        this.getSelectedProperty.disable();
      }

      this.propertyService.getPeopleInSelectPeople(item?.id);
      this.formGroup?.controls?.['task'].enable();
    }
    this.expandPopupWhenOpenDropdown('property-select');
    this.expandPopupWhenOpenDropdown('folder-select');

    this.subscribeOpenTaskFromNotification();
    this.handleDisableFormEmpty();
    this.checkDisableBtnNext();
    if (
      [
        CreateTaskByCateOpenFrom.CONVERT_TO_TASK,
        CreateTaskByCateOpenFrom.MESSAGE
      ].includes(this.openFrom)
    ) {
      this.checkDisconnectedMailBox();
    }
    this.subscribeSelectedMailBoxChange();
    this.subscribeTriggerAddFolder();
    this.updateRememberCheckboxWhenFolderChange();

    this.formGroup.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => this.updateCurrentStep());

    if (this.taskNameTitle) {
      this.handleFindTaskNameValue(this.taskNameTitle);
    }
  }

  updateRememberCheckboxWhenFolderChange() {
    this.getSelectedFolder.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((folderId) => {
        const isDefault =
          this.selectedTaskName?.defaultTaskFolder?.taskFolderId &&
          this.selectedTaskName.defaultTaskFolder.taskFolderId === folderId;
        this.getRemember.setValue(isDefault);
      });
  }

  subscribeTriggerAddFolder() {
    this.createNewTaskPopUpService.triggerAddNewFolder$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((res) => Boolean(res))
      )
      .subscribe((res) => {
        this.listFolder = cloneDeep([
          ...this.listFolder,
          {
            id: res.id,
            name: res.name,
            order: res.order,
            mailBoxId: res.mailBoxId,
            icon: res.icon
          }
        ]);
        this.currentFolderId = res.id;
        this.setFolderFormValue();
      });
  }

  subscribeSelectedMailBoxChange() {
    let firstPrefill = true;
    this.createTaskFormService.selectedMailBoxId$
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(),
        switchMap((selectedMaiBoxId) => {
          this.currentMailBoxId = selectedMaiBoxId;
          return combineLatest([
            this.agencyService.getListTaskNames({
              mailBoxId: this.currentMailBoxId
            }),
            this.currentMailBoxId
              ? this.dashboardApiService.getTaskFolders(
                  this.companyService.currentCompanyId()
                )
              : of([])
          ]);
        })
      )
      .subscribe(([listTask, taskFolderRes]) => {
        const listFolder =
          (taskFolderRes as TaskFolderResponse)?.taskFolders || [];
        if (listTask) {
          this.taskNameList = this.taskService.createTaskNameList(listTask);
          this.sortTaskByLatestUpdate();

          // Update currentSelectedTask
          const findTaskNameValue = this.taskNameList.find(
            (task) =>
              task?.id === (this.taskNameId || this.getSelectedTask.value)
          );
          if (findTaskNameValue) {
            this.selectedTaskName = findTaskNameValue;
          }
        }

        // handle change folder when change mailbox if the current task has a default folder
        if (listFolder) {
          this.listFolder = listFolder.sort((a, b) => a.order - b.order);

          // clear folder when change list folder
          const isExistCurrentFolderInList = this.listFolder.some(
            (folder: ITaskFolder) => folder.id === this.currentFolderId
          );
          if (!isExistCurrentFolderInList) {
            this.currentFolderId = null;
            this.setFolderFormValue();
          }
          // update default when change mailBox
          this.handleFolderDefault();

          // remove pre-fill folder if it is not in current list of folder
          if (
            this.selectedFolderId &&
            !this.listFolder.some((f) => f.id === this.selectedFolderId)
          ) {
            this.selectedFolderId = null;
          }

          // handle only if convert message to task on inbox page
          // note (26/12/2023): cannot change mailbox when convert message to task on inbox page
          if (this.selectedFolderId && firstPrefill) {
            this.currentFolderId = this.selectedFolderId;
            this.setFolderFormValue();
            firstPrefill = false;
          }
          this.cdr.markForCheck();
        }
        this.handleDefaultModal();
      });
  }

  subscribeToCurrentTask() {
    const taskStream =
      this.openFrom !== CreateTaskByCateOpenFrom.MESSAGE
        ? this.taskService.currentTask$
        : this.sharedMessageViewService.prefillCreateTaskData$;

    taskStream.pipe(takeUntil(this.subscribers)).subscribe((task) => {
      this.currentTask = task;
    });
  }

  checkDisconnectedMailBox() {
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isDisconnected) => {
        this.isDisconnected = isDisconnected;
      });
  }

  getListAgentAndMailbox() {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.unsubscribe),
        filter((res) => !!res),
        switchMap((res) => {
          this.currentMailBoxId = localStorage.getItem('mailBoxId') || res;
          return this.inboxService.listMailBoxs$.pipe(
            takeUntil(this.unsubscribe)
          );
        }),
        switchMap((listMailBoxs) => {
          if (!listMailBoxs) {
            return of(null);
          }
          this.handleListMailBoxs(listMailBoxs);
          return this.companyService
            .getCurrentCompany()
            .pipe(takeUntil(this.unsubscribe));
        }),
        switchMap((res) => {
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(res);

          return combineLatest([
            this.userService.getListAgentPopup(this.currentMailBoxId),
            this.dashboardUserService.getUserDetail()
          ]).pipe(takeUntil(this.unsubscribe));
        })
      )
      .subscribe(([agentList, user]) => {
        if (agentList && user) {
          this.mapListAgent(agentList, user);
        }
      });
  }

  handleListMailBoxs(listMailBoxs) {
    this.listMailBoxs = listMailBoxs.filter(
      (mail) =>
        mail.status !== EMailBoxStatus.ARCHIVE &&
        mail.status !== EMailBoxStatus.DISCONNECT
    );
    if (!listMailBoxs?.length) return;
    const mailBoxId = this.createTaskFormService.getSelectedMailBoxId();
    if (mailBoxId) {
      this.currentMailBox = listMailBoxs.find((mail) => mail.id === mailBoxId);
    } else {
      const isFromConvertOrMessage = [
        CreateTaskByCateOpenFrom.MESSAGE,
        CreateTaskByCateOpenFrom.CONVERT_TO_TASK,
        CreateTaskByCateOpenFrom.CREATE_MULTIPLE_TASK
      ].includes(this.openFrom);
      if (!isFromConvertOrMessage) {
        this.currentMailBoxId = this.defaultMailBoxId || this.currentMailBoxId;
        const currentMailById = this.listMailBoxs.find(
          (mail) => mail.id === this.currentMailBoxId
        );

        this.currentMailBox =
          currentMailById ||
          this.listMailBoxs.find(
            (mail) => mail.type === EMailBoxType.COMPANY
          ) ||
          this.listMailBoxs[0];
      } else {
        this.currentMailBox = listMailBoxs.find(
          (mailBox) => mailBox.id === this.currentMailBoxId
        );
      }
    }

    this.currentMailBoxId = this.currentMailBox?.id;
    this.createTaskFormService.setSelectedMailBoxId(this.currentMailBoxId);

    this.listMailBoxs = [
      this.currentMailBox,
      ...this.listMailBoxs.filter((e) => e.id !== this.currentMailBox.id)
    ];
  }

  setMailBoxId(mailBox: IMailBox) {
    if (this.currentMailBoxId === mailBox?.id) return;
    this.currentMailBoxId = mailBox?.id;
    this.currentMailBox = mailBox;
    this.showPopover = false;
    this.createTaskFormService.setSelectedMailBoxId(this.currentMailBoxId);
    this.getListAgentCurrentMailbox();
  }

  getListAgentCurrentMailbox() {
    combineLatest([
      this.userService.getListAgentPopup(this.currentMailBoxId),
      this.dashboardUserService
        .getUserDetail()
        .pipe(takeUntil(this.unsubscribe))
    ]).subscribe(([agencyList, user]) => {
      this.mapListAgent(agencyList, user);
    });
  }

  mapListAgent(agentList, user) {
    this.listOfAgent = this.taskService.createAgentNameList(agentList);
    // handle prefill data from form
    const assignIdsForm = this.formGroup.controls['assign'].value?.map(
      (item: AgentItem) => item.id
    );
    this.formGroup.controls['assign'].setValue(
      (assignIdsForm?.length > 0
        ? assignIdsForm
        : [...new Set([user.id, ...this.assignedUserIds])]
      )
        .map((value) => this.listOfAgent.find((item) => item.id === value))
        .filter(
          (item) =>
            !!item && item.value.inviteStatus !== InviteStatus.DEACTIVATED
        )
    );
  }

  handleFindTaskNameValue(title: string) {
    const findTaskNameValue = this.taskNameList?.find(
      (task) => task?.label?.toUpperCase() === title?.toUpperCase()
    );
    this.handlePreFillForm(findTaskNameValue);
    this.selectedTaskName = findTaskNameValue;
  }

  handlePreFillForm(value: TaskItemDropdown) {
    this.getSelectedTask.setValue(value?.id);
    if (this.emailTitle) {
      this.formGroup.get('taskNameTitle').setValue(this.emailTitle);
    }
  }

  handleDisableFormEmpty() {
    const isFromMessage = [CreateTaskByCateOpenFrom.MESSAGE].includes(
      this.openFrom
    );
    if (isFromMessage && this.formGroup) {
      if (!this.getSelectedProperty.value) {
        this.getSelectedTask.enable();
      }
    }
    if (
      this.openFrom ===
      CreateTaskByCateOpenFrom.CALENDAR_EVENT_BULK_CREATE_TASKS
    ) {
      this.getSelectedTask.enable();
    }
  }

  handleDefaultModal() {
    if (this.openFrom === CreateTaskByCateOpenFrom.CALENDAR) {
      const { propertyId } =
        this.taskService.calendarEventSelected$.value || {};
      // handle default property
      const defaultProperty = this.listOfPeopleInSelectBox.find(
        (el) => el.id === propertyId
      );
      if (defaultProperty) {
        this.onPeopleSelectChanged(defaultProperty);
        this.getSelectedProperty.setValue(propertyId);
        this.getSelectedProperty.enable();
      }

      this.taskService.tasknameSelectedCalander$
        .pipe(takeUntil(this.subscribers))
        .subscribe((taskName) => {
          const calendarSelectedTaskName = this.taskNameList.find(
            (task) =>
              task?.id === taskName?.id && task?.id === taskName?.taskNameId
          );
          if (calendarSelectedTaskName && defaultProperty) {
            this.onTaskSelectChanged(calendarSelectedTaskName);
            this.getSelectedTask.setValue(calendarSelectedTaskName?.id);
            this.getSelectedTask.disable();
          } else {
            this.readonly = false;
          }
        });
    }

    if (this.openFrom === CreateTaskByCateOpenFrom.TASK_DETAIL) {
      this.setDefaultTask();
    }
  }

  setDefaultTask() {
    const isHaveTaskNameId = this.taskNameList.some(
      (taskName) => taskName.id === this.selectedTaskNameId
    );
    this.selectedTaskNameId = isHaveTaskNameId
      ? this.selectedTaskNameId
      : TaskNameId.blankTask;
    this.selectedTaskNameId &&
      this.setDefaultPrefillData(this.selectedTaskNameId);
  }

  setDefaultPrefillData(taskNameId: TaskNameId) {
    if (this.selectedTaskNameId === taskNameId) {
      // handle default task name
      const defaultTaskName = this.taskNameList.find(
        (taskName) => taskName.id === taskNameId
      );
      if (defaultTaskName) {
        this.onTaskSelectChanged(defaultTaskName);
        this.getSelectedTask.setValue(defaultTaskName?.id);
      }
    }
  }

  subscribeOpenTaskFromNotification() {
    combineLatest([
      this.propertyService.listofActiveProp.pipe(
        filter((arr) => Boolean(arr?.length))
      ),
      this.taskService.openTaskFromNotification$.pipe(filter(Boolean)),
      this.agencyService.listTask$
    ])
      .pipe(
        takeUntil(this.subscribers),
        map(([listActiveProp, notification, topicList]) => notification)
      )
      .subscribe((notification) => {
        this.notificationId = notification.notificationId;
        this.notification = notification;
        const {
          regionId,
          taskNameId,
          tenancyId,
          complianceId,
          type,
          propertyId
        } = this.notification || {};
        this.selectedComplianceId = complianceId;
        this.selectedTenancyId = tenancyId;
        this.eventTypeEmailRemider = type;
        const propertySelect = this.listOfPeopleInSelectBox.find(
          (item) => item.id === propertyId
        );
        if (propertySelect) {
          this.getSelectedProperty.setValue(propertyId);
          this.onPeopleSelectChanged(propertySelect);
          this.formGroup?.controls?.['task'].enable();
        }
        let taskNameIdByEvent = taskNameId;
        const { QLD, SA, WA, ACT } = RegionId;
        const checkRegionSpecial = [QLD, SA, WA, ACT].includes(regionId);
        if (this.eventTypeEmailRemider === EEventType.ARREAR) {
          if (this.calendarService.checkRegionForArreasEvent(regionId)) {
            taskNameIdByEvent = checkRegionSpecial
              ? TaskNameId.tenantVacateQLD_SA_WA_ACT_RegionIds
              : TaskNameId.tenantVacate;
          } else {
            taskNameIdByEvent = TaskNameId.breachNotice;
          }
        } else if (
          this.eventTypeEmailRemider &&
          [
            EReminderType.TENANT_VACATE,
            EReminderType.OUTGOING_INSPECTION
          ].includes(this.eventTypeEmailRemider as EReminderType)
        ) {
          taskNameIdByEvent = checkRegionSpecial
            ? TaskNameId.tenantVacateQLD_SA_WA_ACT_RegionIds
            : TaskNameId.tenantVacate;
        }
        this.disabledPropertyField = true;

        const task = this.getTaskFromTaskNameId(taskNameIdByEvent);
        this.onTaskSelectChanged(task);
        this.getSelectedTask.setValue(task?.id);
      });
  }

  getTaskFromTaskNameId(taskNameId: TaskNameId) {
    const taskName = this.taskNameList.find(
      (item) => item?.parentTemplateId && item?.parentTemplateId === taskNameId
    );
    return taskName;
  }

  expandPopupWhenOpenDropdown(id: string) {
    const searchInput = this.selectTaskAndProperty?.nativeElement.querySelector(
      `.search-box#${id} ng-select input`
    );
    if (!searchInput) return;
    searchInput.addEventListener('input', () => {
      this.searchInputEmpty = searchInput.value === '' || !searchInput.value;
    });
    searchInput.addEventListener('click', () => {
      this.focusTime += 1;
      this.focusTime === 1 &&
        searchInput.setSelectionRange(
          searchInput.value.length,
          searchInput.value.length
        );
    });
    searchInput.addEventListener('focus', () => {
      this.onOpenSelect(id, 'focus');
    });
    searchInput.addEventListener('focusout', () => {
      const opened = this.selectTaskAndProperty?.nativeElement.querySelector(
        `.search-box#${id} ng-select.ng-select-opened input`
      );
      if (opened) return;
      this.onOpenSelect(id, 'focusout');
    });
  }

  clearAllOfTimer() {
    clearTimeout(this.waitToSetValue1);
  }

  handleFolderDefault() {
    const { taskFolderId } = this.selectedTaskName?.defaultTaskFolder || {};
    const isFolderExist = this.listFolder.some((f) => f.id === taskFolderId);

    if (!this.selectedFolderId && taskFolderId) {
      this.currentFolderId = isFolderExist ? taskFolderId : null;
      this.setFolderFormValue();
    }
  }

  onTaskSelectChanged(e: TaskItemDropdown): void {
    this.handleFolderDefault();
    this.onTaskNameChange.emit(e);
    if (this.openFrom || !this.hasUserInMessage) {
      this.setTaskNameTitle(e);
      this.resetValueSummary.next('');
    }
    this.isCreateBlankTask =
      this.selectedTaskName?.id === this.taskNameId?.miscellaneous;
    !this.isCreateBlankTask && this.resetStateBlankTask();
  }

  setTaskNameTitle(task: TaskItemDropdown | TaskName) {
    const control = this.formGroup.get('taskNameTitle');
    control.setValue(task?.label);
  }

  checkSelectedAgent(id: string) {
    return this.formGroup?.controls?.['assign'].value?.some(
      (item) => item.id === id
    );
  }

  resetStateBlankTask() {
    this.formValidate.title = false;
    this.formValidate.taskGroup = false;
    this.formGroup.get('title').reset('');
    this.formGroup.get('taskGroup').reset('');
  }

  isOpenModal(value) {
    this.inboxService.isBackToModalConvertToTask.next(false);
    this.isCloseModal.emit(value);
    this.taskService.openTaskFromNotification$.next(null);
  }

  onOpenSelect(id: string, action = 'focus' || 'focusout') {
    setTimeout(() => {
      scrollSelectedIntoView();
    }, 0);
    const body =
      this.selectTaskAndProperty?.nativeElement.querySelector('.body');
    if (body?.classList && !body?.classList.value.includes('ng-selected')) {
      body?.classList.add('ng-selected');
    }
    const searchInput = this.selectTaskAndProperty?.nativeElement.querySelector(
      `.search-box#${id} ng-select input`
    );
    if (!searchInput) {
      return;
    }
    this.inputFocused = action === 'focus';
    this.leaseRenewalStatus.noActiveTenant = false;
  }

  onOpenPropertyDropdown() {
    this.formValidate.property = false;
    setTimeout(() => {
      const propertyList =
        this.selectTaskAndProperty?.nativeElement.querySelector(
          '.search-box #property-list .ng-dropdown-panel'
        );
      propertyList?.setAttribute('data-e2e', 'property-list');
    }, 0);
  }

  onPeopleSelectChanged(e: UserPropertyInPeople) {
    this.crtUser = e;
    this.propertyService.getPeopleInSelectPeople(e?.id);
  }

  handleChangeForm() {
    const findTaskNameValue = this.taskNameList?.find(
      (task) => task?.label?.toUpperCase() === this.taskNameTitle?.toUpperCase()
    );
    this.handlePreFillForm(findTaskNameValue);
    this.selectedTaskName = findTaskNameValue;
  }

  searchPeople(searchText: string, thisItem: UserPropertyInPeople) {
    return thisItem.streetline
      .toLowerCase()
      .includes(searchText.trim().toLowerCase());
  }

  compareFn(item: TaskRegionItem, selected: BindingValueTaskItemDropdown) {
    return item.id === selected;
  }

  public compareWithFunc(a, b) {
    return a?.id === b;
  }

  compareAssign(item: AgentItem, selected: AgentItem) {
    return item?.id === selected?.id;
  }

  onFolderOrMailboxChange(e) {
    this.selectedFolderId = null;
    if (this.isFolderMode) {
      if (e?.length === 0 || e?.length >= 2) {
        const chosenFolderValue = e.length >= 2 ? e[e.length - 1] : null;
        this.onFolderSelectChanged(chosenFolderValue);
      }
      this.setFolderFormValue();
    } else {
      this.isFolderMode = true;
      if (e?.length < 2) {
        if (e?.length === 0) {
          this.onFolderSelectChanged(null);
        }
        this.setFolderFormValue();
      } else {
        this.getSaveToField.setValue([e[e.length - 1].id]);
        this.setMailBoxId(e[e.length - 1]);
      }
    }
  }

  // reset value of saveToFieldControl using currentMailBoxId and currentFolderId
  setFolderFormValue() {
    if (!this.currentMailBoxId) {
      this.getSaveToField.setValue([]);
      this.getSelectedFolder.setValue(null);
      return;
    }
    const restoredValue = this.currentFolderId
      ? [this.currentMailBoxId, this.currentFolderId]
      : [this.currentMailBoxId];
    this.getSaveToField.setValue(restoredValue);
    this.getSelectedFolder.setValue(this.currentFolderId);
  }

  onFolderSelectChanged(e: ITaskFolder) {
    this.currentFolderId = e?.id;
  }

  addNewFolder() {
    this.createFolder.emit(EPopupShow.CREATE_FOLDER_POPUP);
  }

  isInvalidForm() {
    const isInValidForm =
      !this.getSelectedTask.value ||
      (!this.getSelectedProperty.value && !this.createMultiple) ||
      !this.getAssignTo.value.length ||
      !this.getTaskNameTitle ||
      !this.getSelectedFolder.value;
    this.formValidate.task = !this.getSelectedTask.value;
    this.formValidate.property =
      !this.getSelectedProperty.value && !this.createMultiple;
    this.formValidate.assign = !this.getAssignTo.value?.length;
    this.formValidate.taskNameTitle = !this.getTaskNameTitle;
    this.formValidate.folder = !this.getSelectedFolder.value;
    this.getFormTaskNameTitle.markAllAsTouched();
    return isInValidForm;
  }

  handleBlurSelectFolder() {
    this.isFolderMode = true;
    this.getSaveToField.markAsUntouched();
  }

  createTask() {
    this.getSaveToField.markAsTouched();
    if (this.isInvalidForm()) {
      return;
    }
    this.disabledNextBtn = false;
    this.nextDataToCreateTaskPopup();
    this.showSidebarRightService.handleToggleSidebarRight(false);
    this.taskService.reloadTrudiResponse.next(true);
    !(this.formValidate.property || this.leaseRenewalStatus.noActiveTenant) &&
      (this.disabledNextBtn = true);
  }

  nextDataToCreateTaskPopup() {
    const { defaultTaskFolder, id } = this.selectedTaskName || {};
    const taskFolderId = this.getSelectedFolder.value;

    this.onNext.next({
      defaultTaskFolderMailBoxId: defaultTaskFolder?.id || null,
      taskNameId: id || null,
      taskFolderId: taskFolderId || null,
      isRemember: true,
      propertyId: this.getSelectedProperty.value,
      assignedUserIds: this.getAssignTo.value?.map((assign) => assign?.id),
      taskNameTitle: this.getTaskNameTitle,
      indexTitle: this.getTaskNameTitle,
      taskTitle: this.getTaskNameTitle,
      notificationId: '',
      mailBoxId: this.currentMailBoxId,
      eventId:
        (this.openFrom === CreateTaskByCateOpenFrom.TASK
          ? this.notification?.eventId
          : this.calendarEventSelected?.id) || ''
    });
  }

  get getSelectedTask() {
    return this.formGroup.get('task');
  }

  get getAssignTo() {
    return this.formGroup.get('assign');
  }

  get getSelectedProperty() {
    return this.formGroup?.get('property');
  }

  get getTaskTitle() {
    return this.formGroup.get('title').value;
  }

  get getTaskNameTitle() {
    return this.formGroup.get('taskNameTitle').value?.trim();
  }

  get getFormTaskNameTitle() {
    return this.formGroup.get('taskNameTitle');
  }

  get getSaveToField() {
    return this.saveToFieldControl;
  }

  get getSelectedFolder() {
    return this.formGroup.get('folder');
  }

  get getTaskGroup() {
    return this.formGroup.get('taskGroup').value;
  }

  get getRemember() {
    return this.formGroup.get('isRemember');
  }

  createNewTask(
    categoryId: ECategoryType,
    options: NewTaskOptions,
    taskNameTitle: string
  ) {
    if (
      [
        CreateTaskByCateOpenFrom.CONVERT_TO_TASK,
        CreateTaskByCateOpenFrom.MESSAGE
      ].includes(this.openFrom)
    ) {
      this.conversationService
        .convertToTask(
          this.createNewTaskPopUpService.getFocusedConversation()?.id ||
            this.conversationService.currentConversation.value?.id,
          categoryId,
          this.selectedTaskName.id,
          this.getSelectedProperty.value,
          this.getAssignTo.value?.map((assign) => assign?.id) || [],
          options,
          false,
          taskNameTitle,
          taskNameTitle,
          taskNameTitle
        )
        .subscribe((res) => {
          this.toastService.success(CONVERT_TO_TASK);
          this.isCloseModal.emit(true);
          this.router
            .navigate(
              [
                stringFormat(
                  AppRoute.TASK_DETAIL,

                  this.taskIdOfConversation
                )
              ],
              {
                replaceUrl: true
              }
            )
            .then((rs) => {
              this.completeCreateTask();
              this.taskService.reloadTaskArea$.next(true);
              this.conversationService.reloadConversationList.next(true);
              this.taskService.currenTaskTrudiResponse$.next(res);
              this.taskService.reloadTaskDetail.next(true);
            });
        });
    } else if (
      [
        CreateTaskByCateOpenFrom.TASK,
        CreateTaskByCateOpenFrom.CREATE_NEW_TASK,
        CreateTaskByCateOpenFrom.CALENDAR,
        CreateTaskByCateOpenFrom.TASK_DETAIL
      ].includes(this.openFrom)
    ) {
      const eventId =
        this.openFrom === CreateTaskByCateOpenFrom.TASK
          ? this.notification?.eventId
          : this.calendarEventSelected?.id;
      this.taskService
        .convertMessageToTask(
          '',
          this.selectedTaskName.id,
          this.getSelectedProperty.value,
          this.getAssignTo.value?.map((assign) => assign?.id) || [],
          options,
          taskNameTitle,
          eventId || '',
          false,
          taskNameTitle,
          taskNameTitle,
          this.notification?.notificationId,
          this.currentMailBoxId
        )
        .subscribe((res) => {
          const taskNameTaskDetailFlows = [
            TaskNameId.leasing,
            TaskNameId.leaseRenewal,
            TaskNameId.tenantVacate,
            TaskNameId.breachNotice
          ];
          if (
            (this.openFrom === CreateTaskByCateOpenFrom.TASK_DETAIL &&
              taskNameTaskDetailFlows.includes(
                this.currentTask?.taskNameRegion?.taskNameId
              )) ||
            this.openFrom === CreateTaskByCateOpenFrom.CALENDAR
          ) {
            this.returnRouterUrl = this.router.url;
          } else {
            this.returnRouterUrl = '';
          }
          this.taskService.openTaskFromNotification$.next(null);
          this.toastService.success(CREATE_TASK_SUCCESSFULLY);
          this.markAsReadNotiBell();
          this.isCloseModal.emit(true);
          this.router
            .navigate([stringFormat(AppRoute.TASK_DETAIL, res.id)], {
              replaceUrl: true
            })
            .then((rs) => {
              if (
                this.openFrom === CreateTaskByCateOpenFrom.TASK_DETAIL &&
                this.currentTask.taskNameRegion.taskNameId ===
                  TaskNameId.leasing
              ) {
                this.taskService.reloadTaskDetail.next(true);
                let action: LeasingRequestButtonAction;
                if (categoryId === ECategoryType.smokeAlarms) {
                  action =
                    LeasingRequestButtonAction.schedule_smoke_alarm_service;
                } else if (categoryId === ECategoryType.generalCompliance) {
                  action =
                    LeasingRequestButtonAction.renew_compliance_certificate;
                }
                if (action) {
                  this.leasingService
                    .updateButtonStatus(
                      action,
                      TrudiButtonEnumStatus.COMPLETED,
                      LeasingStepIndex.NEXT_STEPS
                    )
                    .subscribe((res) =>
                      this.leasingService.leasingRequestResponse.next(res)
                    );
                }
              }
              this.completeCreateTask();
              this.taskService.openTaskFromNotification$.next(null);
              this.taskService.currenTaskTrudiResponse$.next(res);
              this.taskService.currentTaskId$.next(res.id);
              this.taskService.currentTask$.next(res);
              this.smokeAlarmInvoiceFormService.resetForm();
              this.complianceService.updateComplianceResponse = [];
              this.complianceService.showPopup$.next(
                ESelectOpenComplianceItemPopup.CLOSE_POPUP
              );
            });
        });
    }
  }

  markAsReadNotiBell() {
    if (!this.notificationId) return;
    this.notificationService.markAsReadNoti.next(this.notificationId);
    this.headerService.isOpenNotificationList.next(false);
    this.notificationId = '';
  }

  completeCreateTask() {
    this.formGroup.enable();
    this.formGroup.reset();
    this.disabledNextBtn = false;
    this.readonly = false;
    this.navigatorService.setReturnUrl(this.returnRouterUrl);
  }

  handleClearAllAssign() {
    this.ngSelectAssignTo.handleClearClick();
  }

  initUnReadonlyException() {
    if (this.readonly) {
      return ![
        EEventType.ROUTINE_INSPECTION,
        EEventType.LEASE_END,
        EEventType.LEASE_START,
        EEventType.SMOKE_ALARM_EXPIRY,
        EEventType.SMOKE_ALARM_NEXT_SERVICE,
        EEventType.GENERAL_EXPIRY,
        EEventType.GENERAL_NEXT_SERVICE,
        EEventType.INGOING_INSPECTION,
        EEventType.VACATE,
        EEventType.ARREAR,
        EEventType.OUTGOING_INSPECTION,
        EEventType.BREACH_REMEDY,
        EEventType.ENTRY_NOTICE
      ].includes(this.calendarEventSelected.eventType as EEventType);
    }
    return false;
  }

  checkDisableBtnNext() {
    this.inboxSidebarService
      .getAccountAdded()
      .pipe(takeUntil(this.subscribers))
      .subscribe((res: boolean) => {
        this.hasAddAccount = res;
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.dropdown?.nativeElement?.contains(event.target)) {
      this.showPopover = false;
    }
  }

  get titlePopup(): string {
    if (
      this.openFrom ===
        CreateTaskByCateOpenFrom.CALENDAR_EVENT_BULK_CREATE_TASKS ||
      this.createMultiple
    ) {
      this.totalTasks =
        this.listEventBulkCreateTask?.length || this.numberOfMessage;
      return `Create ${this.totalTasks} task${this.totalTasks >= 2 ? 's' : ''}`;
    } else {
      return 'Create task';
    }
  }

  public handleBack() {
    this.onBack.emit();
  }

  searchTaskTemplateFn = (searchText: string, item) => {
    if (Object.entries(item).length === 1) return true;
    return item.label?.toLowerCase().includes(searchText.trim().toLowerCase());
  };

  // handle when change task template (task not divided by region case)
  onTaskTemplateChange(event: TaskItemDropdown) {
    this.selectedTaskName = event;
    if (!event) {
      this.getSelectedTask.setValue(null);
      this.onTaskSelectChanged(null);
    } else {
      this.onTaskSelectChanged(event);
    }

    const { taskFolderId } = this.selectedTaskName?.defaultTaskFolder || {};
    const isFolderExist = this.listFolder.some((f) => f.id === taskFolderId);
    // set default folder if exist
    if (!this.selectedFolderId && taskFolderId) {
      this.currentFolderId = isFolderExist ? taskFolderId : null;
      this.setFolderFormValue();
    }
    this.updateCurrentStep();
  }

  // determine which step in workflow is not valid
  updateCurrentStep(): void {
    this.isFormValid = false;
    if (!this.selectedTaskName && !this.getSelectedTask.value) {
      this.currentStep = ECreateTaskStep.TASK_STEP;
      return;
    }

    if (!this.createMultiple && this.getSelectedProperty.invalid) {
      this.currentStep = ECreateTaskStep.PROPERTY_STEP;
      return;
    }
    const skippedSteps = this.createMultiple ? 1 : 0;

    if (this.getAssignTo.invalid) {
      this.currentStep = ECreateTaskStep.ASSIGNEE_STEP - skippedSteps;
      return;
    }

    if (this.getSelectedFolder.invalid) {
      this.currentStep = ECreateTaskStep.FOLDER_STEP - skippedSteps;
      return;
    }
    this.currentStep = ECreateTaskStep.FOLDER_STEP - skippedSteps + 1;
    this.isFormValid = true;
  }

  sortTaskByLatestUpdate(): void {
    this.taskNameList.sort((a, b) => {
      if (a.updatedAt && b.updatedAt) {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      return 0;
    });
  }
}
