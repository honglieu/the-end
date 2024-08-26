import { BehaviorSubject, Subject, filter, tap, takeUntil } from 'rxjs';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';
import { IRentManagerInspection } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/interfaces/rent-manager-inspection.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

@Component({
  selector: 'rent-manager-inspection-card',
  templateUrl: './rent-manager-inspection-card.component.html',
  styleUrls: ['./rent-manager-inspection-card.component.scss']
})
export class RentManagerInspectionCardComponent implements OnInit, OnDestroy {
  @Input() inspectionCard: IRentManagerInspection;
  @Input() set syncStatus(syncStatus: ESyncStatus) {
    this.syncStatus$.next(syncStatus);
  }
  @Output() clickCard = new EventEmitter<IRentManagerInspection>();
  @Output() retry = new EventEmitter<IRentManagerInspection>();
  @Output() remove = new EventEmitter<IRentManagerInspection>();
  @Output() cancel = new EventEmitter<IRentManagerInspection>();
  private destroyed$ = new Subject<void>();
  public syncStatus$: BehaviorSubject<ESyncStatus> =
    new BehaviorSubject<ESyncStatus>(null);
  public readonly ESyncStatus = ESyncStatus;
  public firstTimeSyncSuccess = false;
  constructor() {}

  ngOnInit(): void {
    this.syncStatus$
      .asObservable()
      .pipe(
        filter((syncStatus) => !!syncStatus),
        tap((syncStatus: ESyncStatus) => {
          if (
            syncStatus === ESyncStatus.COMPLETED &&
            this.inspectionCard?.syncState === 'UPDATE'
          ) {
            this.firstTimeSyncSuccess = true;
          } else {
            this.firstTimeSyncSuccess = false;
          }
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe();
  }

  handleOpenModal() {
    this.clickCard.emit(this.inspectionCard);
  }

  handleRetryWidget() {
    this.retry.emit();
  }

  handleRemoveWidget() {
    if (this.inspectionCard?.externalInspectionId) {
      this.cancel.emit(this.inspectionCard);
    } else {
      this.remove.emit(this.inspectionCard);
    }
  }

  handleCancelWidget() {
    this.cancel.emit(this.inspectionCard);
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
