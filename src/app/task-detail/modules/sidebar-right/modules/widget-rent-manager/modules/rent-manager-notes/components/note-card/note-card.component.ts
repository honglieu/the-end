import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  SimpleChanges
} from '@angular/core';
import { Subject } from 'rxjs';
import { IRentManagerNote } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/interfaces/rent-manager-notes.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
@Component({
  selector: 'note-card',
  templateUrl: './note-card.component.html',
  styleUrls: ['./note-card.component.scss']
})
export class NoteCardComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  @Input() syncStatus: ESyncStatus;
  @Input() cardData: IRentManagerNote;
  @Output() retry: EventEmitter<void> = new EventEmitter<void>();
  @Output() remove: EventEmitter<void> = new EventEmitter<void>();
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() clickCard: EventEmitter<void> = new EventEmitter<void>();

  public ESyncStatus = ESyncStatus;
  public isShowBackgroundSucess: boolean = false;
  constructor() {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['syncStatus']?.currentValue) {
      if (
        this.syncStatus === ESyncStatus.COMPLETED &&
        this.cardData?.syncState === 'UPDATE'
      ) {
        this.isShowBackgroundSucess = true;
      } else {
        this.isShowBackgroundSucess = false;
      }
    }
  }
  ngOnInit(): void {}

  handleOpenModal() {
    this.clickCard.emit();
  }

  handleClickRetry() {
    this.retry.emit();
  }

  handleClickRemove() {
    if (this.cardData?.externalId) {
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
