import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { TaskService } from '@services/task.service';
import { ISocketSyncAttachmentEmailClient } from '@shared/types/socket.interface';
import uuidv4 from 'uuid4';
import { isEqual } from 'lodash-es';

@Component({
  selector: 'msg-attachment-load',
  templateUrl: './msg-attachment-load.component.html',
  styleUrls: ['./msg-attachment-load.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MsgAttachmentLoadComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() conversationId: string = null;
  @Input() attachmentSynced: boolean = false;
  @Output() attachmentSyncedChange = new EventEmitter<boolean>();
  @Input() threadIds: string[] = [];
  @Input() key: string = null;
  @Output() keyChange = new EventEmitter<string>();
  private us$ = new Subject();

  constructor(
    private cd: ChangeDetectorRef,
    private ws: RxWebsocketService,
    private ts: TaskService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.threadIds?.length &&
      !isEqual(this.threadIds, changes['threadIds']?.previousValue)
    ) {
      this.triggerSyncIfThreadIdsExist();
    }
  }

  ngOnInit(): void {
    this.initKey();
    this.subscribeToSyncMailClient();
  }

  private initKey(): void {
    this.key = uuidv4();
    this.updateKey();
  }

  private triggerSyncIfThreadIdsExist(): void {
    if (this.threadIds.length > 0) {
      this.ts.triggerSyncAttachment.next(this.threadIds);
    }
  }

  private subscribeToSyncMailClient(): void {
    this.ws.onSyncAttachmentMailClient
      .pipe(takeUntil(this.us$))
      .subscribe((res) => this.handleSyncClientResponse(res));
  }

  private handleSyncClientResponse(
    res: ISocketSyncAttachmentEmailClient
  ): void {
    if (this.areAllThreadIdsIncluded(res?.threadIds)) {
      this.updateSyncStatusAndReload();
    }
  }

  private areAllThreadIdsIncluded(threadIds: string[]): boolean {
    return threadIds?.every((item) => this.threadIds.includes(item));
  }

  private updateSyncStatusAndReload(): void {
    this.updateSyncStatus(true);
    this.triggerReloadAfterSync();
  }

  private updateSyncStatus(synced: boolean): void {
    this.attachmentSynced = synced;
    this.attachmentSyncedChange.emit(this.attachmentSynced);
    this.cd.markForCheck();
  }

  private updateKey(): void {
    this.keyChange.emit(this.key);
    this.cd.markForCheck();
  }

  private triggerReloadAfterSync(): void {
    this.ts.triggerReloadHistoryAfterSync.next({
      key: this.key,
      status: true,
      threadIds: this.threadIds
    });
  }

  ngOnDestroy() {
    this.us$.next(true);
    this.us$.complete();
  }
}
