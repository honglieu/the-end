import { animate, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, map, switchMap, takeUntil } from 'rxjs';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { Agent } from '@shared/types/agent.interface';
import { TaskItem } from '@shared/types/task.interface';
import { getFilterItem } from '@shared/components/filter-by-portfolio/filter-by-portfolio.component';
import { InboxFilterLoadingService } from '@/app/dashboard/modules/inbox/services/inbox-filter-loading.service';
import { LoadingService } from '@services/loading.service';
import { EMenuDropdownType } from '@shared/directives/menuKeyboard.directive';
import { TaskStatusType } from '@shared/enum';
import { EPlacement } from '@shared/types';

const NOTE_ZONE_TRANSITION = '.25s';

@Component({
  selector: 'filter-by-assignee',
  templateUrl: './filter-by-assignee.component.html',
  styleUrls: ['./filter-by-assignee.component.scss'],
  animations: [
    trigger('toTopFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          NOTE_ZONE_TRANSITION,
          style({ opacity: 1, transform: 'translateY(8px)' })
        )
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(8px)' }),
        animate(
          NOTE_ZONE_TRANSITION,
          style({ opacity: 0, transform: 'translateY(-10px)' })
        )
      ])
    ]),
    trigger('collapse', [
      transition(':enter', [
        style({ height: '0' }),
        animate(NOTE_ZONE_TRANSITION, style({ height: '108px' }))
      ]),
      transition(':leave', [
        style({ height: '108px' }),
        animate(NOTE_ZONE_TRANSITION, style({ height: '0' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('0.25s', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.25s', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class FilterByAssigneeComponent implements OnInit, OnDestroy {
  @Input() task: TaskItem;
  @Input() disabled: boolean = false;
  @Input() iconBottom: boolean = true;
  @Input() isInbox: boolean = false;
  @Input() teamMembers: number = 0;

  @Input() set popoverPlacement(value: 'bottomRight' | 'leftTop') {
    this.placement = value;
  }
  public assigneeList = [];
  public placement: 'bottomRight' | 'leftTop' = 'bottomRight';
  private unsubscribe = new Subject<void>();
  public assignBoxPlacement = EPlacement.BOTTOM_LEFT;
  public selectedAssignee = [];
  public visibleDropdown: boolean = false;
  public pmName;
  public isConsole: boolean = false;
  public EMenuDropdownType = EMenuDropdownType;
  public queryParams: Params;

  constructor(
    public taskService: TaskService,
    public sharedService: SharedService,
    private inboxFilterService: InboxFilterService,
    private router: Router,
    private userService: UserService,
    private _changeDetector: ChangeDetectorRef,
    private inboxFilterLoading: InboxFilterLoadingService,
    public loadingService: LoadingService,
    private activeRouter: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.activeRouter.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((params) => (this.queryParams = params));
    this.getPortfolioList();
    this.getPMName();
  }

  public changePopoverPlacement(value: typeof this.popoverPlacement) {
    this.popoverPlacement = value;
    this._changeDetector.markForCheck();
  }

  onShowPopupAssign(event: MouseEvent) {
    event.stopPropagation();
  }

  filterListMessage(listIdAgency: Agent[]) {
    this.router.navigate([], {
      queryParams: { assignedTo: listIdAgency },
      queryParamsHandling: 'merge'
    });
  }

  getPMName() {
    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs) {
          this.pmName = `${rs.firstName} ${rs.lastName}`;
        }
      });
  }

  getPortfolioList() {
    this.inboxFilterLoading.onMultiLoading();
    this.inboxFilterService
      .getSelectedAgency()
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((selectedRes) => {
          let selectedList = selectedRes || [];
          return this.inboxFilterService.getListDataFilter().pipe(
            map((assignees) => {
              return {
                assignees: assignees.filter((r) => {
                  return r.inviteStatus === 'ACTIVE';
                }),
                selectedList: selectedList
              };
            })
          );
        })
      )
      .subscribe(({ assignees, selectedList }) => {
        this.assigneeList = getFilterItem(assignees, selectedList);
        this.selectedAssignee = this.assigneeList
          .filter((item) => selectedList.includes(item.id))
          .map((assignee) => assignee.id);
        const nonExistingIds = selectedList.filter(
          (id) => !assignees.some((assignee) => assignee.id === id)
        );
        if (nonExistingIds.length > 0) {
          this.router.navigate([], {
            queryParams: { assignedTo: this.selectedAssignee },
            queryParamsHandling: 'merge'
          });
          this.loadingService.onLoading();
        }
        const isTaskType =
          this.queryParams['inboxType'] === TaskStatusType.my_task;
        const myTaskCount = this.teamMembers < 2 ? 1 : isTaskType ? 1 : 0;
        this.inboxFilterService.patchValueSelectedItem(
          'assignee',
          this.disabled
            ? this.isConsole
              ? 1
              : myTaskCount
            : this.selectedAssignee.length
        );
        this.inboxFilterLoading.offMultiLoading();
      });
    this._changeDetector.markForCheck();
  }

  onDropdownMenuVisibleChange(event) {
    this.visibleDropdown = event;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
