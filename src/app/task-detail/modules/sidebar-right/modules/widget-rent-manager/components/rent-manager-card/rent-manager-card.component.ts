import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilKeyChanged,
  filter,
  Subject,
  takeUntil,
  tap
} from 'rxjs';
import { RentManagerIssueService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue.service';
import { IRentManagerIssue } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { SharedService } from '@services/shared.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

interface IWidget {
  isShowBackground: boolean;
  isShowSuccess: boolean;
}

@Component({
  selector: 'rent-manager-card',
  templateUrl: './rent-manager-card.component.html',
  styleUrls: ['./rent-manager-card.component.scss']
})
export class RentManagerCardComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  public widgetState$: BehaviorSubject<IWidget> = new BehaviorSubject(null);
  public syncStatus$: BehaviorSubject<ESyncStatus> =
    new BehaviorSubject<ESyncStatus>(null);
  public status: string;
  public category: string;

  //Do not show background when init
  @Input() set syncStatus(syncStatus: ESyncStatus) {
    this.syncStatus$.next(syncStatus);
  }

  @Input() cardData: IRentManagerIssue;
  @Output() retry: EventEmitter<void> = new EventEmitter<void>();
  @Output() remove: EventEmitter<void> = new EventEmitter<void>();
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() clickCard: EventEmitter<void> = new EventEmitter<void>();
  isConsole: boolean;

  public ESyncStatus = ESyncStatus;
  private DUE_TIME_TO_SHOW_BACKGROUND: number = 3000;

  constructor(
    private rentManagerIssueService: RentManagerIssueService,
    public sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.widgetState$
      .asObservable()
      .pipe(
        filter((state: IWidget) => !!state),
        distinctUntilKeyChanged('isShowSuccess'),
        debounceTime(this.DUE_TIME_TO_SHOW_BACKGROUND),
        tap(() => {
          this.widgetState$.next({
            isShowBackground: false,
            isShowSuccess: false
          });
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe();
    this.syncStatus$
      .asObservable()
      .pipe(
        filter((syncStatus) => !!syncStatus),
        tap((syncStatus: ESyncStatus) => {
          if (
            syncStatus === ESyncStatus.COMPLETED &&
            this.cardData?.syncState === 'UPDATE'
          ) {
            this.widgetState$.next({
              isShowBackground: true,
              isShowSuccess: true
            });
          }
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe();
    this.rentManagerIssueService.rmIssueData$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((res) => {
        this.status = res?.status?.find(
          (st) => st.id === this.cardData?.statusId
        )?.name;
        this.category = res?.category?.find(
          (st) => st.id === this.cardData.details.categoryId
        )?.name;
      });
  }

  handleClickRetry($event) {
    $event.stopPropagation();
    this.retry.emit($event);
  }

  handleClickRightBtn($event) {
    $event.stopPropagation();
    if (this.cardData?.details?.externalId) {
      this.cancel.emit();
    } else {
      this.remove.emit();
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
