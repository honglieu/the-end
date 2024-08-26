import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Topic } from '@shared/types/task.interface';
import { Agent } from '@shared/types/agent.interface';
import { TaskStatusType } from '@shared/enum/task.enum';
import { EInboxQueryParams } from '@shared/enum/inbox.enum';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { ICalendarEventFilterTask } from '@shared/types/calendar.interface';
import {
  Subject,
  combineLatest,
  map,
  takeUntil,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  debounceTime,
  switchMap
} from 'rxjs';
import { SharedService } from '@services/shared.service';
import { TrudiToolbarComponent } from '@shared/components/trudi-toolbar/trudi-toolbar.component';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { InboxFilterLoadingService } from '@/app/dashboard/modules/inbox/services/inbox-filter-loading.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { GroupType } from '@shared/enum/user.enum';
import { PortfolioService } from '@/app/dashboard/services/portfolio.service';
import { getFilterItem } from '@shared/components/filter-by-portfolio/filter-by-portfolio.component';

@Component({
  selector: 'filter-dropdown',
  templateUrl: './filter-dropdown.component.html',
  styleUrls: ['./filter-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterDropdownComponent implements OnInit, OnDestroy {
  @Input() taskDetailViewMode = EViewDetailMode.TASK;
  constructor(
    private inboxFilterService: InboxFilterService,
    private route: ActivatedRoute,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    public mailboxSettingService: MailboxSettingService,
    public webSocketService: RxWebsocketService,
    private sharedService: SharedService,
    private inboxFilterLoading: InboxFilterLoadingService,
    private portfolioService: PortfolioService
  ) {}

  private unsubscribe = new Subject<void>();
  public assigneeList: Agent[] = [];
  public calendarEventFilterList: ICalendarEventFilterTask[] = [];
  public disabledFilterTask: boolean = false;
  public isFilterDisabled = false;
  public tooltipTemplate: string = 'Turn off focused view to use filters';
  public isShowDropdown: boolean = false;
  public isAiAssistant: boolean = false;
  public isInbox: boolean = false;
  public isLoading: boolean = true;
  public statusParam: TaskStatusType;
  public statusType = TaskStatusType;
  public teamMembers: number = 0;
  public isConsole: boolean = false;
  public prefixIconTaskType: string = 'chevronLeft';
  public prefixIconEvent: string = 'chevronLeft';
  public listTaskEditor: Topic[] = [];
  public selectedTaskEditorId: string[] = [];
  public shouldDisplayTaskFilter: boolean = false;
  public isTaskType: boolean = false;
  readonly EViewDetailMode = EViewDetailMode;
  public visibleDropdown: boolean = false;
  public isContractFilter: boolean = true;
  public isHiddenTaskMessage: boolean = false;
  @ViewChild(TrudiToolbarComponent) private _toolbar: TrudiToolbarComponent;

  public popoverPlacement: {
    portfolio: 'bottomRight' | 'leftTop' | 'rightTop';
    assignee: 'bottomRight' | 'leftTop' | 'rightTop';
    taskType: 'bottomRight' | 'leftTop' | 'rightTop';
    calendarEvent: 'bottomRight' | 'leftTop' | 'rightTop';
    status: 'bottomRight' | 'leftTop' | 'rightTop';
  } = {
    portfolio: 'rightTop',
    assignee: 'rightTop',
    taskType: 'rightTop',
    calendarEvent: 'rightTop',
    status: 'rightTop'
  };

  ngOnInit(): void {
    this.isLoading = true;
    this.checkShowInbox();
    this.displayTaskFilter();
    this.isConsole = this.sharedService.isConsoleUsers();
    this.getCalendarEventTask();
    this.subscribeMailboxSettings();
    this.getListAgency();
    this.getListTaskEditor();
    this.getSelectedFilter();
    this.checkShowAiAssistant();
    this.getListPortfolio();
    this.detectChangeFocusView();
    this._subcribeLoading();
    this.setCountSelectedItem();
    this.subcribeIsFilterDisabled();
    this.getShowMessageInTask();
    this.checkHideTaskMessage();
  }

  private _subcribeLoading() {
    this.isTaskType = this.router.url.includes('tasks');
    this.inboxFilterLoading.multiLoading$
      .pipe(debounceTime(300))
      .subscribe((loading) => {
        this.isLoading = loading;
        this.cdRef.markForCheck();
      });
  }

  private subcribeIsFilterDisabled() {
    this.inboxFilterService.isFilterDisabled$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((status) => (this.isFilterDisabled = status));
  }

  private displayTaskFilter() {
    this.route.queryParams
      .pipe(
        takeUntil(this.unsubscribe),
        map((params) => this.router.url.includes('tasks')),
        distinctUntilChanged()
      )
      .subscribe((hasTaskTypeID) => {
        this.shouldDisplayTaskFilter = hasTaskTypeID;
        setTimeout(() => {
          this._toolbar?.markForCheck();
        }, 300);
      });
  }

  private detectChangeFocusView() {
    this.route.queryParams
      .pipe(takeUntil(this.unsubscribe), distinctUntilKeyChanged('inboxType'))
      .subscribe(() => {
        setTimeout(() => {
          this._toolbar?.markForCheck();
        }, 300);
      });
  }

  getCalendarEventTask() {
    this.inboxFilterService
      .getCalendarEventFilterList()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.calendarEventFilterList = [...res];
        let { eventType, startDate, endDate } = this.route.snapshot.queryParams;
        let convertToArrayEventType = this.convertToArray(eventType);
        if ((eventType?.length > 0 || (startDate && endDate)) && res) {
          this.inboxFilterService.setSelectedCalendarEventId({
            eventType: convertToArrayEventType,
            startDate,
            endDate
          });
        }
      });
  }

  subscribeMailboxSettings() {
    this.mailboxSettingService.mailboxSetting$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailboxSettings) => {
        this.teamMembers = mailboxSettings?.teamMembers;
        //Clear filter when change to private mailbox
        if (this.teamMembers <= 1)
          this.inboxFilterService.setSelectedPortfolio([]);
        this.cdRef.markForCheck();
      });

    combineLatest([
      this.mailboxSettingService.mailBoxId$,
      this.webSocketService.onSocketUpdatePermissionMailBox
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([mailBoxId, socket]) => {
        if (socket.data?.id === mailBoxId) {
          this.teamMembers = socket.data?.teamMembers;
          this.cdRef.markForCheck();
        }
      });
  }

  getListTaskEditor() {
    this.inboxFilterService
      .getlistTaskEditor()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        let { taskEditorId } = this.route.snapshot.queryParams;
        if (taskEditorId && res) {
          this.inboxFilterService.setSelectedTaskEditorId(
            this.convertToArray(taskEditorId)
          );
        }
        this.listTaskEditor = res['PUBLISHED'] ? res['PUBLISHED'] : [];
        this.sortTasksByName(this.listTaskEditor);
      });
  }

  getListPortfolio() {
    let { propertyManagerId } = this.route.snapshot.queryParams;
    if (propertyManagerId) {
      if (typeof propertyManagerId === 'string') {
        propertyManagerId = [propertyManagerId];
      }
      this.inboxFilterService.setSelectedPortfolio(propertyManagerId);
    }
  }

  getListAgency() {
    let { assignedTo } = this.route.snapshot.queryParams;
    if (assignedTo) {
      if (typeof assignedTo === 'string') {
        assignedTo = [assignedTo];
      }
      this.inboxFilterService.setSelectedAgency(assignedTo);
    }
  }

  getShowMessageInTask() {
    let { showMessageInTask } = this.route.snapshot.queryParams;
    if (showMessageInTask) {
      this.inboxFilterService.setShowMessageInTask(
        showMessageInTask === 'true' ? true : false
      );
    }
  }

  convertToArray(value) {
    return Array.isArray(value) || !value ? value : [value];
  }

  sortTasksByName(tasks) {
    tasks?.sort((taskA, taskB) => {
      const nameTaskA = taskA.name.toLowerCase();
      const nameTaskB = taskB.name.toLowerCase();
      const comparison = nameTaskA.localeCompare(nameTaskB);
      return comparison;
    });
  }

  getSelectedFilter() {
    let { search } = this.route.snapshot.queryParams;
    if (search) {
      this.inboxFilterService.setSearchDashboard(search);
    }
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((param) => {
        const { status, taskStatus, aiAssistantType } = param;
        if (taskStatus) {
          this.statusParam = taskStatus;
          this.isContractFilter = true;
        } else if (aiAssistantType) {
          this.isContractFilter = false;
        } else {
          this.statusParam = status;
          this.isContractFilter = true;
        }
        this.cdRef.markForCheck();
      });
  }

  checkShowAiAssistant() {
    this.isAiAssistant = this.router.url.includes(
      EInboxQueryParams.AI_ASSISTANT
    );
    this.router.events.pipe(takeUntil(this.unsubscribe)).subscribe(() => {
      this.isAiAssistant = this.router.url.includes(
        EInboxQueryParams.AI_ASSISTANT
      );

      if (this.isAiAssistant) this.isFilterDisabled = !this.isAiAssistant;
      this.cdRef.markForCheck();
    });
  }

  checkShowInbox() {
    this.isInbox = this.router.url.includes(
      EInboxQueryParams.MESSAGES ||
        EInboxQueryParams.APP_MESSAGE ||
        EInboxQueryParams.VOICEMAIL_MESSAGES ||
        EInboxQueryParams.SMS_MESSAGES ||
        EInboxQueryParams.MESSENGER ||
        EInboxQueryParams.WHATSAPP
    );
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.isInbox =
          this.router.url.includes(`inbox/${EInboxQueryParams.MESSAGES}`) ||
          this.router.url.includes(`inbox/${EInboxQueryParams.APP_MESSAGE}`) ||
          this.router.url.includes(
            `inbox/${EInboxQueryParams.VOICEMAIL_MESSAGES}`
          ) ||
          this.router.url.includes(`inbox/${EInboxQueryParams.SMS_MESSAGES}`) ||
          this.router.url.includes(`inbox/${EInboxQueryParams.MESSENGER}`) ||
          this.router.url.includes(`inbox/${EInboxQueryParams.WHATSAPP}`);

        this._toolbar?.markForCheck();
      });
  }

  private checkHideTaskMessage() {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.isHiddenTaskMessage =
          this.router.url.includes(`inbox/${EInboxQueryParams.SMS_MESSAGES}`) ||
          this.router.url.includes(`inbox/${EInboxQueryParams.MESSENGER}`) ||
          this.router.url.includes(`inbox/${EInboxQueryParams.WHATSAPP}`) ||
          this.router.url.includes(`inbox/${EInboxQueryParams.APP_MESSAGE}`) ||
          this.router.url.includes(
            `inbox/${EInboxQueryParams.VOICEMAIL_MESSAGES}`
          );
        this.cdRef.markForCheck();
      });
  }

  handleChange(status: boolean) {
    this.isFilterDisabled = status;
    this.cdRef.markForCheck();
  }

  onFilterAssigneeVisibleChange(visible: boolean) {
    this.popoverPlacement.assignee = visible ? 'rightTop' : 'rightTop';
  }

  onFilterPortfolioVisibleChange(visible: boolean) {
    this.popoverPlacement.portfolio = visible ? 'rightTop' : 'rightTop';
  }

  onFilterTaskTypeVisibleChange(visible: boolean) {
    if (visible) {
      this.popoverPlacement.taskType = 'rightTop';
      this.prefixIconTaskType = 'chevronLeft';
    } else {
      this.popoverPlacement.taskType = 'rightTop';
      this.prefixIconTaskType = 'chevronLeft';
    }
  }

  onFilterEventVisibleChange(visible: boolean) {
    if (visible) {
      this.popoverPlacement.calendarEvent = 'rightTop';
      this.prefixIconEvent = 'chevronRight';
    } else {
      this.popoverPlacement.calendarEvent = 'rightTop';
      this.prefixIconEvent = 'chevronRight';
    }
  }

  onFilterStatusVisibleChange(visible: boolean) {
    this.popoverPlacement.status = visible ? 'rightTop' : 'rightTop';
  }

  setCountSelectedItem() {
    const getSelectedPortfolio$ = this.inboxFilterService
      .getSelectedPortfolio()
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((selectedRes) => {
          let selectedList = selectedRes || [];
          return this.portfolioService.getPortfolios$().pipe(
            map((portfolios) => {
              const listPortfolio = portfolios
                .map((group) => group.portfolios)
                .flat();
              return {
                portfolios: listPortfolio.filter(
                  (r) => r.isFollowed || !this.isFilterDisabled
                ),
                selectedList: selectedList
              };
            })
          );
        })
      );

    combineLatest([
      this.inboxFilterService.selectedInboxType$,
      this.inboxFilterService.getSelectedAgency()
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([selectedInboxType, selectedAssignee]) => {
        const isFocused = selectedInboxType === GroupType.MY_TASK;
        this.inboxFilterService.patchValueSelectedItem(
          'assignee',
          this.isConsole ? 0 : isFocused ? 1 : selectedAssignee.length
        );
      });

    this.inboxFilterService
      .getSelectedCalendarEventCurrentId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.inboxFilterService.patchValueSelectedItem(
          'eventType',
          (data?.eventType || []).length
        );
      });

    this.inboxFilterService.selectedStatus$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((selectedStatus) => {
        const isTaskType = this.router.url.includes('tasks');
        if (isTaskType) return;
        this.inboxFilterService.patchValueSelectedItem(
          'messageStatus',
          (selectedStatus || []).length
        );
      });

    this.inboxFilterService.showMessageInTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((showMessageInTask) => {
        const hiddenShowTaskCount =
          this.router.url.includes('inbox/whatsapp-messages') ||
          this.router.url.includes('inbox/app-messages') ||
          this.router.url.includes('inbox/sms-messages') ||
          this.router.url.includes('inbox/facebook-messages') ||
          this.router.url.includes('inbox/voicemail-messages') ||
          this.router.url.includes('tasks');
        this.inboxFilterService.patchValueSelectedItem(
          'showTaskMessage',
          !hiddenShowTaskCount && showMessageInTask ? 1 : 0
        );
      });

    combineLatest([
      this.inboxFilterService.selectedInboxType$,
      getSelectedPortfolio$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([selectedInboxType, { portfolios, selectedList }]) => {
        const selectedPortfolio = getFilterItem(
          portfolios,
          selectedList,
          ''
        ).filter((item) => selectedList.includes(item.agencyAgentId));
        const isFocused = selectedInboxType === GroupType.MY_TASK;
        const portfoliosCount = isFocused
          ? selectedPortfolio.filter((item) => item.isFollowed)?.length
          : selectedPortfolio.length;
        this.inboxFilterService.patchValueSelectedItem(
          'portfolio',
          portfoliosCount
        );
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
