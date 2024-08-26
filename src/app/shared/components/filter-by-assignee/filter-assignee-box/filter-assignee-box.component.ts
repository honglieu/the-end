import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { Agent, InviteStatus } from '@shared/types/agent.interface';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Component({
  selector: 'filter-assignee-box',
  templateUrl: './filter-assignee-box.component.html',
  styleUrls: ['./filter-assignee-box.component.scss']
})
export class FilterAssigneeBoxComponent implements OnInit, OnDestroy {
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;
  @Input() onTop?: boolean = true;
  @Input() left?: boolean = true;
  @Input() assigneeList = [];
  @Output() itemsSelected = new EventEmitter<Agent>(null);

  private unsubscribe = new Subject<void>();
  public listItemId: string[] = [];
  public searchValue: string = '';
  public searchList = [];
  public selectedList = [];
  public pageSize: number = 20;
  public pageIndex: number = 1;
  public totalPage: number = 0;
  public isLoadingList: boolean = false;
  public isScrolledToBottom: boolean = false;
  public LAZY_LOAD_ASSIGNEE = 52;
  public refreshValueSubject$: BehaviorSubject<void> = new BehaviorSubject(
    null
  );
  public totalItem = 0;

  constructor(
    private readonly elr: ElementRef,
    private inboxFilterService: InboxFilterService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.left) {
      this.elr.nativeElement.style.left = 'unset';
      this.elr.nativeElement.style.right = '100%';
    }
    this.searchList = this.assigneeList.sort((x, y) => {
      return x.selected ? -1 : y.selected ? 1 : 0;
    });
    this.getSelectedAssignee();
    this.totalItem = this.assigneeList.length;
  }

  search() {
    if (this.searchValue) {
      this.searchList = this.assigneeList.filter((item) => {
        return item.label
          .toLowerCase()
          .includes(this.searchValue.toLowerCase().trim());
      });
    } else {
      this.searchList = [...this.assigneeList];
    }
    this.totalItem = this.searchList.length;
  }

  getStyle() {
    return {
      height: this.totalItem < 8 ? `${this.totalItem * 52}px` : '324px'
    };
  }

  handleCheckbox(i: number) {
    if (
      !this.searchList[i].selected &&
      this.searchList[i].inviteStatus === InviteStatus.DEACTIVATED
    )
      return;
    this.searchList[i].selected = !this.searchList[i].selected;
    if (this.searchList[i].selected) {
      this.selectedList = [...this.selectedList, this.searchList[i]?.id];
    } else {
      this.selectedList = this.selectedList.filter(
        (item) => item !== this.searchList[i].id
      );
      const item = this.assigneeList.find(
        (search) => search.id === this.searchList[i]?.id
      );
      item.selected = false;
    }
    this.filterListMessage(this.selectedList);
  }

  filterListMessage(listIdAssignee) {
    this.inboxFilterService.setSelectedAgency(listIdAssignee);
    this.router.navigate([], {
      queryParams: { assignedTo: listIdAssignee, taskId: null },
      queryParamsHandling: 'merge'
    });
  }

  onClearSearch() {
    this.searchList = [...this.assigneeList];
    this.searchValue = '';
    this.totalItem = this.searchList.length;
    this.pageIndex = 1;
    this.refreshValueSubject$.next();
  }

  onClearFilter() {
    this.selectedList = [];
    this.filterListMessage([]);
    this.searchList.forEach((item) => {
      item.selected = false;
    });
    this.refreshValueSubject$.next();
  }

  getSelectedAssignee() {
    this.selectedList = this.assigneeList
      .filter((assignee) => assignee.selected === true)
      .map((assignee) => assignee.id);
  }

  onScroll() {
    const element = this.viewport?.elementRef.nativeElement;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (
      distanceFromBottom <= this.LAZY_LOAD_ASSIGNEE &&
      !this.isScrolledToBottom &&
      this.pageIndex < this.totalPage
    ) {
      this.isScrolledToBottom = true;
      this.pageIndex = this.pageIndex + 1;
      this.refreshValueSubject$.next();
    }
  }

  onClickPopup(e: Event) {
    e.stopPropagation();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
