import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { InviteStatus } from '@shared/types/agent.interface';
import { Portfolio } from '@shared/types/user.interface';

export enum EMessageStatusFilter {
  NEW = 'NEW',
  UNSEEN_BY_ME = 'UNSEEN_BY_ME',
  WAIT_PM_REPLY = 'WAIT_PM_REPLY',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  UNOPENED_BY_CUSTOMER = 'UNOPENED_BY_CUSTOMER',
  WAIT_CUSTOMER_REPLY = 'WAIT_CUSTOMER_REPLY'
}

@Component({
  selector: 'filter-status-box',
  templateUrl: './filter-status-box.component.html',
  styleUrls: ['./filter-status-box.component.scss']
})
export class FilterStatusBoxComponent implements OnInit, OnDestroy {
  @Input() onTop?: boolean = true;
  @Input() left?: boolean = true;
  @Input() filterList = [];
  @Output() itemsSelected = new EventEmitter<Portfolio>(null);
  private unsubscribe = new Subject<void>();
  public listInviteStatus: typeof InviteStatus = InviteStatus;
  public listStatus = [
    {
      type: EMessageStatusFilter.NEW,
      label: 'New',
      selected: false
    },
    {
      type: EMessageStatusFilter.UNSEEN_BY_ME,
      label: 'Unseen by me',
      selected: false
    },
    {
      type: EMessageStatusFilter.WAIT_PM_REPLY,
      label: 'Awaiting reply',
      selected: false
    },
    {
      type: EMessageStatusFilter.DELIVERY_FAILED,
      label: 'Delivery failed',
      selected: false
    },
    {
      type: EMessageStatusFilter.UNOPENED_BY_CUSTOMER,
      label: 'Unopened by customer',
      selected: false
    },
    {
      type: EMessageStatusFilter.WAIT_CUSTOMER_REPLY,
      label: 'No customer reply',
      selected: false
    }
  ];
  public selectedList = [];
  public selectedAgency = [];
  constructor(
    private readonly elr: ElementRef,
    private inboxFilterService: InboxFilterService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.onTop) {
      this.elr.nativeElement.style.top = 'unset';
      this.elr.nativeElement.style.bottom = '-100%';
    }
    if (this.left) {
      this.elr.nativeElement.style.left = 'unset';
      this.elr.nativeElement.style.right = '100%';
    }
    this.getSelectedAssigneeList();
  }

  onClearFilter() {
    this.listStatus.forEach((item) => {
      item.selected = false;
    });
    this.selectedList = [];
    this.filterListMessage(this.selectedList);
    this.filterList.forEach((item) => {
      item.selected = false;
    });
  }

  handleCheckbox(i: number) {
    this.listStatus[i].selected = !this.listStatus[i].selected;
    if (this.listStatus[i].selected) {
      this.selectedList = [...this.selectedList, this.listStatus[i]?.type];
    } else {
      this.selectedList = this.selectedList.filter(
        (item) => item !== this.listStatus[i].type
      );
      const item = this.listStatus.find(
        (search) => search.type === this.listStatus[i]?.type
      );
      item.selected = false;
    }
    this.filterListMessage(this.selectedList);
  }

  filterListMessage(selectedList) {
    this.inboxFilterService.setSelectedStatus(selectedList);
    this.router.navigate([], {
      queryParams: {
        messageStatus: selectedList,
        taskId: null,
        conversationId: null
      },
      queryParamsHandling: 'merge'
    });
  }

  getSelectedAssigneeList() {
    this.inboxFilterService.selectedStatus$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res.length) {
          this.selectedList = res;
          this.listStatus = this.listStatus.map((one) =>
            res.includes(one.type)
              ? { ...one, selected: true }
              : { ...one, selected: false }
          );
        } else {
          this.selectedList = [];
          this.listStatus.forEach((item) => (item.selected = false));
        }
      });
  }

  onClickPopup(e: Event) {
    e.stopPropagation();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
