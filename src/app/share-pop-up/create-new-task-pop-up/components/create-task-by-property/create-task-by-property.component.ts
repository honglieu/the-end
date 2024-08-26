import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  firstValueFrom,
  map,
  of,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { CalendarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendar.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { UserService as DashboardUserService } from '@/app/dashboard/services/user.service';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { EEventType, EReminderType } from '@shared/enum/calendar.enum';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { RegionId } from '@shared/enum/region.enum';
import { TaskNameId, TaskType } from '@shared/enum/task.enum';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { AgentItem, InviteStatus } from '@shared/types/agent.interface';
import {
  TaskItem,
  TaskItemDropdown,
  TaskName
} from '@shared/types/task.interface';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { IMailBox } from '@shared/types/user.interface';
import { EActionShowMessageTooltip, ECRMId } from '@shared/enum/share.enum';
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
import { CreateNewTaskPopUpService } from '@/app/share-pop-up/create-new-task-pop-up/services/create-new-task-pop-up.service';
import { cloneDeep, orderBy } from 'lodash-es';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { CompanyService } from '@services/company.service';
import {
  CreateTaskSource,
  CreateTaskStep,
  Property,
  PropertyStatus,
  TaskAndPropertySelectionData,
  TaskSetting
} from '@/app/share-pop-up/create-new-task-pop-up/components/interfaces/create-new-task.interface';
import { InjectFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { StepKey } from '@trudi-ui';

@Component({
  selector: 'create-task-by-property',
  templateUrl: './create-task-by-property.component.html',
  styleUrls: ['./create-task-by-property.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTaskByPropertyComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() defaultMailBoxId: string;
  @Input() appearanceState = false;
  @Input() openFrom: CreateTaskSource;
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
  @Input() selectedPropertyId: string;
  @Input() dataConvert: IListConversationConfirmProperties[];
  @Input() taskList: TaskItemDropdown[] = [];
  @Input() hiddenSelectProperty: boolean = false;
  @Input() disableSelectProperty: boolean = false;
  @Input() isStepPrescreen: boolean = false;
  @Input() injectFrom: InjectFrom;
  @Input() isFromTrudiApp: boolean = false;
  @Input() isFromVoiceMail: boolean = false;

  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() resetValueSummary = new EventEmitter<string>();
  @Output() createFolder = new EventEmitter<EPopupShow>();
  @Output() onTaskNameChange = new EventEmitter<TaskItemDropdown>();
  @Output() onNext = new EventEmitter<TaskAndPropertySelectionData>();
  @Output() onBack: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('ngSelectAssignTo') ngSelectAssignTo: NgSelectComponent;
  @ViewChild('selectTaskAndProperty') selectTaskAndProperty: ElementRef;
  @ViewChild('dropdown') dropdown: ElementRef;
  @ViewChild('folderSingleSelect') ngSelectFolder: NgSelectComponent;
  public formGroup: FormGroup;

  private fetchTemplate$ = new BehaviorSubject<Property>(null);
  private destroy$ = new Subject<void>();

  public listTaskMap = new Map<string, TaskSetting>();

  public listProperty: UserPropertyInPeople[] = [];
  public crtUser: UserPropertyInPeople;
  public listOfAgent: AgentItem[] = [];
  public listMailBoxs: IMailBox[] = [];
  public listFolder: ITaskFolder[] = [];
  public isLoadingAddFolder = false;
  public listRegion = [];
  public folderName: string;
  public currentAgencyId: string;
  public assignSearchText: string = '';
  public selectedIntentId: string = '';
  public fullName: string = '';
  public returnRouterUrl: string = '';
  public defaultTaskSettingId: string = 'all';
  public isShowAddNewFolder: boolean = false;
  public currentMailBoxId: string;
  public currentMailBox: IMailBox;
  public notification;
  public notificationId: string;
  public calendarEventSelected: ICalendarEvent;
  public eventTypeEmailReminder: string;
  public currentTask: TaskItem;
  public selectedTaskName: TaskItemDropdown;

  private userPickProperty: boolean = false;
  public isLoadingTeamMember: boolean = false;
  public isDisconnected: boolean = false;
  public inputFocused: boolean = false;
  public isComplianceFlow: boolean = false;
  public isCreateBlankTask: boolean = false;
  public disabledNextBtn: boolean = true;
  public readonly: boolean = false;
  public isRmEnvironment: Boolean = false;
  public hasAddAccount: boolean = false;
  public isConsole: boolean;
  public isFormValid: boolean = false;
  public focusTime: number = 0;
  public currentStep: number = 1;
  public valueSearchFolder: string;
  public waitToSetValue1: NodeJS.Timeout;

  public formValidate = {
    task: false,
    property: false,
    title: false,
    taskGroup: false,
    assign: false,
    taskNameTitle: false,
    folder: false
  };
  public leaseRenewalStatus = {
    noActiveTenant: false
  };

  readonly ACTION_UPGRADE = EActionShowMessageTooltip;
  readonly CreateTaskSource = CreateTaskSource;
  readonly MailBoxStatus = EMailBoxStatus;
  readonly MailBoxType = EMailBoxType;
  readonly CreateTaskStep = CreateTaskStep;
  readonly InviteStatus = InviteStatus;
  readonly ECRMId = ECRMId;

  public modalId = StepKey.communicationStep.newTask;

  constructor(
    private cdr: ChangeDetectorRef,
    private propertyService: PropertiesService,
    private conversationService: ConversationService,
    private taskService: TaskService,
    private userService: UserService,
    private dashboardUserService: DashboardUserService,
    private dashboardApiService: DashboardApiService,
    private agencyService: AgencyService,
    private calendarService: CalendarService,
    private inboxService: InboxService,
    private inboxSidebarService: InboxSidebarService,
    private sharedService: SharedService,
    private createTaskFormService: CreateTaskFormService,
    private showSidebarRightService: ShowSidebarRightService,
    private createNewTaskPopUpService: CreateNewTaskPopUpService,
    private companyService: CompanyService
  ) {
    this.formGroup = this.createTaskFormService.buildForm();
  }

  get getListTask() {
    return this.listTaskMap.get(this.defaultTaskSettingId)?.tasks || [];
  }

  get getTask(): AbstractControl {
    return this.formGroup.get('task');
  }

  get getAssignTo(): AbstractControl {
    return this.formGroup.get('assign');
  }

  get getSelectedProperty(): AbstractControl {
    return this.formGroup.get('property');
  }

  get getTaskTitle(): string {
    return this.formGroup.get('title').value;
  }

  get getTaskNameTitle() {
    return this.formGroup.get('taskNameTitle').value?.trim();
  }

  get getFormTaskNameTitle(): AbstractControl {
    return this.formGroup.get('taskNameTitle');
  }

  get getSelectedFolder(): AbstractControl {
    return this.formGroup.get('folder');
  }

  get getTaskGroup(): AbstractControl {
    return this.formGroup.get('taskGroup').value;
  }

  get getRemember(): AbstractControl {
    return this.formGroup.get('isRemember');
  }

  get getNewFolder(): AbstractControl {
    return this.formGroup.get('addNewFolder');
  }

  get titlePopup(): string {
    let title: string = 'Create task';

    if (
      [
        CreateTaskSource.CREATE_BULK_MULTIPLE_TASK,
        CreateTaskSource.CALENDAR_EVENT_BULK_CREATE_TASKS
      ].includes(this.openFrom) &&
      this.createMultiple
    ) {
      const totalTasks =
        this.listEventBulkCreateTask?.length || this.numberOfMessage;
      const preText =
        this.openFrom === CreateTaskSource.CREATE_BULK_MULTIPLE_TASK
          ? 'Bulk create'
          : 'Create';

      title = `${preText} ${totalTasks} task${totalTasks >= 2 ? 's' : ''}`;
    }

    return title;
  }

  ngOnChanges(changes: SimpleChanges) {
    const { appearanceState, hasUserInMessage, createMultiple, taskNameTitle } =
      changes || {};

    if (createMultiple?.currentValue) {
      this.getTask.enable();
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

    if (hasUserInMessage && !this.hasUserInMessage) {
      this.setTaskNameTitle(this.selectedTaskToConvert);
    }

    if (taskNameTitle?.currentValue) {
      this.findAndHandleTaskByTitle(taskNameTitle?.currentValue);
    }

    if (this.userPickProperty && !this.getTask.value) {
      this.handleChangeForm();
    }

    this.handleDisableFormEmpty();
  }

  ngOnInit(): void {
    this.initializeFlags();
    this.subscribeSelectedMailBoxChange();
    this.subscribeCurrentCompany();
    this.getListAgent();
    this.subscribeUser();
    this.subscribeProperty();
    this.subscribeSearchListTemplate();
    this.handleEventFromCalender();
    this.handleEventFromRemaining();
    this.subscribeOpenTaskFromNotification();
    this.subscribeTriggerAddFolder();
    this.handleDisableFormEmpty();
    this.handleDisableBtnNext();
    this.onUpdateCurrentStepChangeForm();
    this.updateRememberCheckboxWhenFolderChangeForm();
    this.sortTaskByLatestUpdate();

    this.expandPopupWhenOpenDropdown('folder-select');

    if (!this.hasUserInMessage) {
      this.setTaskNameTitle(this.selectedTaskToConvert);
    }

    this.handlePreFillForm(this.selectedTaskName);
  }

  private initializeFlags() {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.calendarEventSelected = this.taskService.calendarEventSelected$.value;
    this.readonly = this.openFrom === CreateTaskSource.CALENDAR;

    if (
      this.injectFrom !== InjectFrom.VOICE_MAIL &&
      !this.isFromTrudiApp &&
      !this.isFromVoiceMail
    ) {
      this.disableSelectProperty = this.readonly;
    }

    // init list task
    if (this.taskList && !this.getListTaskMap(this.defaultTaskSettingId)) {
      this.setListTaskMap(this.defaultTaskSettingId, {
        tasks: this.taskList
      });
    }
  }

  private subscribeUser() {
    this.userService.selectedUser
      .pipe(
        filter((res) => res && !this.isObjectEmpty(res)),
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        const isPortalUser = res?.type === UserTypeEnum.LEAD;
        this.disabledNextBtn = !isPortalUser;
      });
  }

  private subscribeProperty() {
    combineLatest([
      this.propertyService.listofActiveProp,
      this.propertyService.listPropertyAllStatus
    ])
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        filter((res) => !!res)
      )
      .subscribe(([propertyActive, propertyAll]) => {
        const currentListProperty: UserPropertyInPeople[] =
          propertyActive?.length > 0
            ? propertyActive
            : this.getActiveProperty(propertyAll);

        const supplierOrOther = [
          EConfirmContactType.SUPPLIER,
          EConfirmContactType.OTHER
        ];

        const confirmContactType =
          this.currentTask?.unhappyStatus?.confirmContactType;
        const startMessageBy = this.currentTask?.conversations?.[0]
          ?.startMessageBy as EConfirmContactType;
        const isMessageTask = this.currentTask?.taskType === TaskType.MESSAGE;

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
          this.openFrom !== CreateTaskSource.CREATE_BULK_MULTIPLE_TASK
        ) {
          this.listProperty = currentListProperty;

          if (!this.getSelectedProperty.value && this.selectedPropertyId) {
            const currentProperty = currentListProperty.find(
              (p) => p.id === this.selectedPropertyId
            );
            if (currentProperty) {
              this.getSelectedProperty.setValue(currentProperty);
              this.fetchTemplate$.next(currentProperty);
            }
          }
        }
      });
  }

  private getActiveProperty(list) {
    return list.filter(
      (property) =>
        ![PropertyStatus.DELETED, PropertyStatus.ARCHIVED].includes(
          property.status
        )
    );
  }

  private handleEventFromCalender() {
    let item = this.listProperty?.find(
      (item) => item.id === this.currentTask?.property?.id
    );

    if (this.openFrom !== CreateTaskSource.CALENDAR) {
      this.waitToSetValue1 = setTimeout(() => {
        if (this.currentTask?.property?.streetline && this.openFrom != 'TASK') {
          this.crtUser = item;
        }
      }, 30);
    }
  }

  private handleEventFromRemaining() {
    let item = this.listProperty?.find(
      (item) => item.id === this.currentTask?.property?.id
    );

    if (
      item &&
      this.openFrom !== CreateTaskSource.TASK &&
      this.openFrom !== CreateTaskSource.CALENDAR
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
  }

  onUpdateCurrentStepChangeForm() {
    this.formGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onUpdateCurrentStep());
  }

  updateRememberCheckboxWhenFolderChangeForm() {
    this.getSelectedFolder.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((folderId) => {
        const isDefault =
          this.selectedTaskName?.defaultTaskFolder?.taskFolderId &&
          this.selectedTaskName.defaultTaskFolder.taskFolderId === folderId;
        this.getRemember.setValue(isDefault);
      });
  }

  handleCustomSearchFolder(term: string, item: ITaskFolder) {
    return item.name.toLowerCase().includes(term.toLowerCase().trim());
  }

  private subscribeTriggerAddFolder() {
    this.createNewTaskPopUpService.triggerAddNewFolder$
      .pipe(
        filter((res) => !!res),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.listFolder = cloneDeep([
          ...this.listFolder,
          {
            id: res.id,
            name: res.name,
            order: res.order,
            agencyId: res.agencyId,
            mailBoxId: res.mailBoxId,
            icon: res.icon
          }
        ]);
        this.getSelectedFolder.setValue(res.id);
      });
  }

  private subscribeSearchListTemplate() {
    this.fetchTemplate$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        filter((property) => !!property),
        tap(() => {
          this.currentStep = 0;
        }),
        debounceTime(500)
      )
      .subscribe({
        next: () => {
          // handle case prefill task template from bell notification
          if (this.openFrom === CreateTaskSource.NOTIFICATION) {
            this.handleDefaultFromNotification();
          }

          if (this.openFrom === CreateTaskSource.TASK_DETAIL) {
            this.setDefaultPrefillData(this.selectedTaskNameId);
          }

          this.onUpdateCurrentStep();
          this.cdr.markForCheck();
        },
        error: () => {}
      });
  }

  private getListTaskMap(id?: string): TaskSetting {
    return this.listTaskMap.get(id || this.defaultTaskSettingId);
  }

  private setListTaskMap(id: string, value: TaskSetting) {
    this.listTaskMap.set(id || this.defaultTaskSettingId, {
      ...this.getListTaskMap(id || this.defaultTaskSettingId),
      ...value
    });
  }

  private subscribeSelectedMailBoxChange() {
    let firstPrefill = true;
    this.createTaskFormService.selectedMailBoxId$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((selectedMaiBoxId) => {
          this.currentMailBoxId = selectedMaiBoxId;
          const getTaskFolder = this.companyService.currentCompanyId()
            ? this.dashboardApiService.getTaskFolders(
                this.companyService.currentCompanyId()
              )
            : of({} as TaskFolderResponse);
          return combineLatest([
            getTaskFolder,
            this.taskService.getListRegion(),
            this.propertyService.listofActiveProp
          ]);
        })
      )
      .subscribe(([{ taskFolders: listFolder }]) => {
        // handle change folder when change mailbox if the current task has a default folder
        if (listFolder) {
          this.listFolder = orderBy(listFolder, ['order'], ['asc']);

          // clear folder when change list folder
          const isExistCurrentFolderInList = this.listFolder.some(
            (folder: ITaskFolder) => folder.id === this.getSelectedFolder?.value
          );
          if (!isExistCurrentFolderInList) {
            this.getSelectedFolder.setValue(null);
          }

          // update default when change mailBox
          this.handleDefaultFromFolder();

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
            this.getSelectedFolder.setValue(this.selectedFolderId);
            firstPrefill = false;
          }
          this.cdr.markForCheck();
        }

        if (this.openFrom === CreateTaskSource.CALENDAR) {
          this.handleDefaultFromCalendar();
        }

        if (this.openFrom === CreateTaskSource.TASK_DETAIL) {
          this.handleDefaultFromTask();
        }
      });
  }

  private subscribeCurrentCompany() {
    return this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(res);
      });
  }

  private getListAgent() {
    this.isLoadingTeamMember = true;
    return combineLatest([
      this.userService.getListAgentPopup(),
      this.dashboardUserService.getUserDetail()
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([agentList, user]) => {
          if (agentList && user) {
            this.mapListAgent(agentList, user);
          }

          this.isLoadingTeamMember = false;
        },
        error: () => {
          this.isLoadingTeamMember = false;
        }
      });
  }

  private mapListAgent(agentList, user) {
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

  handlePreFillForm(value: TaskItemDropdown) {
    if (value?.id !== this.getTask.value) {
      this.getTask.setValue(value?.id);
    }

    if (this.getTask.value) {
      this.formGroup.get('taskNameTitle').setValue(this.emailTitle);
    }
  }

  handleDisableFormEmpty() {
    const isFromMessage = [CreateTaskSource.MESSAGE].includes(this.openFrom);

    if (isFromMessage && this.formGroup) {
      if (!this.getSelectedProperty.value) {
        this.getTask.enable();
      }
    }

    if (this.openFrom === CreateTaskSource.CALENDAR_EVENT_BULK_CREATE_TASKS) {
      this.getTask.enable();
    }
  }

  setDefaultPrefillData(taskNameId: TaskNameId) {
    if (this.selectedTaskNameId === taskNameId) {
      // handle default task name
      const defaultTaskName = this.getListTask.find(
        (taskName) => taskName?.id === taskNameId
      );
      if (defaultTaskName) {
        this.onTaskSelectChanged(defaultTaskName);
        this.getTask.setValue(defaultTaskName?.id);
      }
    }
  }

  subscribeOpenTaskFromNotification() {
    combineLatest([
      this.propertyService.listPropertyAllStatus,
      this.taskService.openTaskFromNotification$.pipe(filter(Boolean)),
      this.agencyService.listTask$
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([, notification]) => notification)
      )
      .subscribe((notification) => {
        this.disableSelectProperty = true;
        const { propertyId } = this.notification || notification || {};
        const propertySelect = this.listProperty.find(
          (item) => item.id === propertyId
        );
        this.notification = notification;
        this.crtUser = propertySelect;
        this.selectedPropertyId = propertyId;
        this.getSelectedProperty.setValue(propertySelect);
        this.formGroup?.controls?.['task'].enable();

        if (propertySelect && this.openFrom === CreateTaskSource.TASK) {
          this.openFrom = CreateTaskSource.NOTIFICATION;
          this.fetchTemplate$.next(propertySelect);
        }
      });
  }

  private getTaskFromTaskNameId(taskNameId: TaskNameId): TaskItemDropdown {
    const taskName = this.getListTask.find(
      (item) => item?.parentTemplateId && item?.parentTemplateId === taskNameId
    );
    return taskName;
  }

  expandPopupWhenOpenDropdown(id: string): void {
    const searchInput = this.selectTaskAndProperty?.nativeElement.querySelector(
      `.search-box#${id} ng-select input`
    );
    if (!searchInput) return;
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

  setTaskNameTitle(task?: TaskName | TaskItemDropdown): void {
    const control = this.formGroup.get('taskNameTitle');
    switch (task?.id) {
      case TaskNameId.routineMaintenance:
        control.setValue('Maintenance');
        break;
      case TaskNameId.emergencyMaintenance:
        control.setValue('Emergency');
        break;
      default:
        control.setValue(task?.label);
    }
  }

  checkSelectedAgent(id: string): boolean {
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

  isOpenModal(value: boolean): void {
    this.inboxService.isBackToModalConvertToTask.next(false);
    this.isCloseModal.emit(value);
    this.taskService.openTaskFromNotification$.next(null);
  }

  onOpenSelect(id: string, action = 'focus' || 'focusout'): void {
    setTimeout(() => {
      const taskList = this.selectTaskAndProperty?.nativeElement.querySelector(
        '.search-box #task-list .ng-dropdown-panel'
      );
      taskList?.setAttribute('data-e2e', 'task-list');
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

  handleChangeForm(): void {
    const findTaskNameValue = this.getListTask?.find(
      (task) => task?.label?.toUpperCase() === this.taskNameTitle?.toUpperCase()
    );
    this.handlePreFillForm(findTaskNameValue);
    this.selectedTaskName = findTaskNameValue;
  }

  handleDisableBtnNext(): void {
    this.inboxSidebarService
      .getAccountAdded()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: boolean) => {
        this.hasAddAccount = res;
      });
  }

  handleAddNewFolder(): void {
    this.isShowAddNewFolder = true;
  }

  isInvalidForm(): boolean {
    const isInValidForm =
      !this.getTask.value ||
      !this.getAssignTo.value.length ||
      !this.getTaskNameTitle ||
      !this.getSelectedFolder.value;

    this.formValidate = {
      ...this.formValidate,
      task: !this.getTask.value,
      assign: !this.getAssignTo.value?.length,
      taskNameTitle: !this.getTaskNameTitle,
      folder: !this.getSelectedFolder.value
    };

    this.getFormTaskNameTitle.markAllAsTouched();
    return isInValidForm;
  }

  handleBlurSelectFolder() {
    this.valueSearchFolder = '';
    this.getSelectedFolder.markAsUntouched();
  }

  handleCreateTask() {
    this.getSelectedFolder.markAsTouched();
    if (this.isInvalidForm()) return;

    this.disabledNextBtn = false;
    this.createTaskPopup();
    this.showSidebarRightService.handleToggleSidebarRight(false);
    this.taskService.reloadTrudiResponse.next(true);
    !(this.formValidate.property || this.leaseRenewalStatus.noActiveTenant) &&
      (this.disabledNextBtn = true);
  }

  createTaskPopup() {
    const { defaultTaskFolder, id } = this.selectedTaskName || {};
    const taskFolderId = this.getSelectedFolder.value;
    const payload = {
      defaultTaskFolderMailBoxId: defaultTaskFolder?.id || null,
      taskNameId: id || null,
      taskFolderId: taskFolderId || null,
      isRemember: true,
      propertyId: this.getSelectedProperty.value?.id || null,
      assignedUserIds: this.getAssignTo.value?.map((assign) => assign?.id),
      taskNameTitle: this.getTaskNameTitle,
      indexTitle: this.getTaskNameTitle,
      taskTitle: this.getTaskNameTitle,
      notificationId: '',
      mailBoxId: this.currentMailBoxId,
      eventId:
        (this.openFrom === CreateTaskSource.NOTIFICATION
          ? this.notification?.eventId
          : this.calendarEventSelected?.id) || ''
    };

    this.onNext.next(payload);
  }

  handleClearAllAssign() {
    this.getAssignTo.reset();
  }

  public handleBack() {
    this.onBack.emit();
  }

  /*
    emit changed
  */

  onTaskSelectChanged(e: TaskItemDropdown): void {
    this.onTaskNameChange.emit(e);
    this.handleDefaultFromFolder();

    if (this.openFrom || !this.hasUserInMessage) {
      this.setTaskNameTitle(e);
      this.resetValueSummary.next('');
    }

    this.isCreateBlankTask =
      this.selectedTaskName?.id === TaskNameId?.miscellaneous;
    !this.isCreateBlankTask && this.resetStateBlankTask();
  }

  public onPropertySelectChanged(e: UserPropertyInPeople): void {
    if (e) this.selectedPropertyId = e.id;
    this.crtUser = e;
    this.fetchTemplate$.next(e);
  }

  public onTaskTemplateChange(event: TaskItemDropdown): void {
    this.selectedTaskName = event;
    if (!event) {
      this.getTask.setValue(null);
      this.onTaskSelectChanged(null);
      return;
    }

    const { taskFolderId } = this.selectedTaskName?.defaultTaskFolder || {};
    const isFolderExist = this.listFolder.some((f) => f.id === taskFolderId);

    // set default folder if exist
    if (!this.selectedFolderId && taskFolderId) {
      this.getSelectedFolder.setValue(isFolderExist ? taskFolderId : null);
    }
    if (event) {
      this.onTaskSelectChanged(event);
      this.onUpdateCurrentStep();
    }
  }

  public onUpdateCurrentStep(): void {
    this.isFormValid = false;
    if (!this.selectedTaskName && !this.getTask.value) {
      this.currentStep = CreateTaskStep.TASK_STEP;
      return;
    }

    const skippedSteps = 0;

    if (this.getAssignTo.invalid) {
      this.currentStep = CreateTaskStep.ASSIGNEE_STEP - skippedSteps;
      return;
    }

    if (this.getSelectedFolder.invalid) {
      this.currentStep = CreateTaskStep.FOLDER_STEP - skippedSteps;
      return;
    }
    this.currentStep = CreateTaskStep.FOLDER_STEP - skippedSteps + 1;
    this.isFormValid = true;
  }

  private handleDefaultFromCalendar() {
    this.readonly = true;
    const { propertyId } = this.taskService.calendarEventSelected$.value || {};

    const defaultProperty =
      this.listProperty?.find((el) => el.id === propertyId) ??
      ({} as UserPropertyInPeople);
    this.selectedPropertyId = defaultProperty?.id;

    this.taskService.tasknameSelectedCalander$
      .pipe(takeUntil(this.destroy$))
      .subscribe((taskName) => {
        if (defaultProperty) {
          this.onTaskTemplateChange(taskName);
          this.getSelectedProperty.setValue(defaultProperty);
          this.fetchTemplate$.next(defaultProperty);
          this.handleDisableFormEmpty();
          this.getTask.disable();
        } else {
          this.readonly = false;
        }
      });
  }

  private handleDefaultFromTask() {
    const selectedProperty = this.listProperty?.find(
      (p) =>
        p.id ===
        (this.getSelectedProperty?.value ||
          this.taskService.currentTask$.value?.property.id)
    );

    const isHaveTaskNameId = this.getListTask.some(
      (task) => task?.id === this.selectedTaskNameId
    );

    if (selectedProperty) {
      this.disableSelectProperty = true;
      this.selectedPropertyId = selectedProperty.id;
      this.getSelectedProperty.setValue(selectedProperty);
      this.fetchTemplate$.next(selectedProperty);
    }

    this.selectedTaskNameId = isHaveTaskNameId
      ? this.selectedTaskNameId
      : TaskNameId.blankTask;

    if (this.selectedTaskNameId) {
      this.setDefaultPrefillData(this.selectedTaskNameId);
    }
  }

  private handleDefaultFromNotification() {
    const {
      regionId,
      taskNameId,
      tenancyId,
      complianceId,
      type: eventTypeEmailReminder,
      notificationId
    } = this.notification || {};
    const checkRegionSpecial = [
      RegionId.QLD,
      RegionId.SA,
      RegionId.WA,
      RegionId.ACT
    ].includes(regionId);

    let taskNameIdByEvent = taskNameId;

    if (eventTypeEmailReminder === EEventType.ARREAR) {
      const isRegionArrearsEvent =
        this.calendarService.checkRegionForArreasEvent(regionId);
      taskNameIdByEvent = isRegionArrearsEvent
        ? [
            TaskNameId.tenantVacate,
            TaskNameId.tenantVacateQLD_SA_WA_ACT_RegionIds
          ]?.[+checkRegionSpecial]
        : TaskNameId.breachNotice;
    } else if (
      [EReminderType.TENANT_VACATE, EReminderType.OUTGOING_INSPECTION].includes(
        eventTypeEmailReminder
      )
    ) {
      taskNameIdByEvent = checkRegionSpecial
        ? TaskNameId.tenantVacateQLD_SA_WA_ACT_RegionIds
        : TaskNameId.tenantVacate;
    }

    const task = this.getTaskFromTaskNameId(taskNameIdByEvent);

    if (task) {
      this.onTaskSelectChanged(task);
      this.getTask.setValue(task?.id);
    }

    Object.assign(this, {
      notificationId,
      selectedComplianceId: complianceId,
      selectedTenancyId: tenancyId,
      eventTypeEmailReminder,
      tenancyIdEmailReminder: tenancyId
    });
  }

  public onFolderSelectClosed() {
    this.isShowAddNewFolder = false;
    const newFolder = this.getNewFolder.value;
    this.getNewFolder.reset();
    const maxOrder = this.listFolder.reduce(
      (maxOrder, item) => (item.order > maxOrder ? item.order : maxOrder),
      0
    );
    if (newFolder?.trim()) {
      this.isLoadingAddFolder = true;
      this.dashboardApiService
        .createTaskFolder({
          companyId: this.companyService.currentCompanyId(),
          icon: 'TrudiFiSrFolder',
          name: newFolder,
          order: maxOrder + 1,
          labelId: null
        })
        .pipe(
          finalize(() => {
            this.isLoadingAddFolder = false;
          }),
          takeUntil(this.destroy$)
        )
        .subscribe(async (newFolder) => {
          this.listFolder = [...this.listFolder, newFolder];
          this.getSelectedFolder.setValue(newFolder.id);
          this.inboxSidebarService.setInboxTaskFolder([
            ...((await firstValueFrom(this.inboxSidebarService.taskFolders$)) ||
              []),
            {
              ...newFolder,
              taskCount: 0
            }
          ]);
        });
    }

    this.ngSelectFolder?.blur();
  }

  searchPeople(searchText: string, thisItem: AgentItem) {
    return thisItem.label
      .toLowerCase()
      .includes(searchText.trim().toLowerCase());
  }

  handleSearchFolder($event) {
    this.valueSearchFolder = $event.term;
  }

  /*
    handle default value when open modal
  */
  private handleDefaultFromFolder() {
    const { taskFolderId } = this.selectedTaskName?.defaultTaskFolder || {};
    const isFolderExist = this.listFolder.some((f) => f.id === taskFolderId);
    if (!this.selectedFolderId && taskFolderId) {
      this.getSelectedFolder.setValue(isFolderExist ? taskFolderId : null);
    }
  }

  /*
    function resume for modal
  */

  private findAndHandleTaskByTitle(title: string) {
    const matchingTask = this.getListTask?.find(
      (task) => task?.label?.toUpperCase() === title.toUpperCase()
    );
    if (matchingTask) {
      this.handlePreFillForm(matchingTask);
      this.selectedTaskName = matchingTask;
    }
  }

  private sortTaskByLatestUpdate(): void {
    this.setListTaskMap(this.getSelectedProperty.value?.id, {
      tasks: this.getListTask.sort((a, b) => this.compareTime(a, b))
    });
  }

  compareAssign(item: AgentItem, selected: AgentItem) {
    return item?.id === selected?.id;
  }

  private compareTime(taskA, taskB): number {
    const taskAUpdatedAt = taskA.updatedAt;
    const taskBUpdatedAt = taskB.updatedAt;

    return (
      (taskBUpdatedAt ? new Date(taskBUpdatedAt).getTime() : 0) -
      (taskAUpdatedAt ? new Date(taskAUpdatedAt).getTime() : 0)
    );
  }

  private compareLabels(a, b): number {
    const labelA = a.label.toUpperCase();
    const labelB = b.label.toUpperCase();
    if (labelA > labelB) return 1;
    if (labelA < labelB) return -1;
    return 0;
  }

  private isObjectEmpty(obj): boolean {
    return Object.keys(obj).length === 0;
  }

  clearAllOfTimer() {
    clearTimeout(this.waitToSetValue1);
  }

  ngOnDestroy() {
    this.fetchTemplate$.next(null);
    this.fetchTemplate$.complete();
    this.createNewTaskPopUpService.clear();
    this.createTaskFormService.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
