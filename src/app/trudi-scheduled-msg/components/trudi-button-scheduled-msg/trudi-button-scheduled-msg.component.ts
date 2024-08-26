import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { TrudiScheduledMsgService } from './../../services/trudi-scheduled-msg.service';
import { Subject, takeUntil } from 'rxjs';
import { SocketType } from '@shared/enum/socket.enum';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { TaskService } from '@services/task.service';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { DEBOUNCE_SOCKET_TIME } from '@services/constants';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ITrudiScheduledMsgCount } from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';

@Component({
  selector: 'trudi-button-scheduled-msg',
  templateUrl: './trudi-button-scheduled-msg.component.html',
  styleUrls: ['./trudi-button-scheduled-msg.component.scss']
})
export class TrudiButtonScheduledMsgComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() position: number = 10;
  @Input() conversationId: string;
  @Output() onOpenModal = new EventEmitter();

  numberOfScheduledMsg = 0;
  public readonly EButtonType = EButtonType;
  public readonly EButtonTask = EButtonTask;
  private unsubscribe = new Subject<void>();
  private scheduleMsgCount: ITrudiScheduledMsgCount = null;
  constructor(
    private trudiScheduledMsgService: TrudiScheduledMsgService,
    private webSocketService: RxWebsocketService,
    private taskService: TaskService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conversationId']?.currentValue) {
      if (this.scheduleMsgCount?.conversationId === this.conversationId) {
        this.numberOfScheduledMsg = this.scheduleMsgCount.count || 0;
      }
    }
  }

  ngOnInit(): void {
    this.trudiScheduledMsgService.scheduleMessageCount$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((msg) => {
        this.scheduleMsgCount = msg;
        if (!msg || msg.conversationId !== this.conversationId) return;
        this.numberOfScheduledMsg = msg.count || 0;
      });
    this.webSocketService.onSocketJob
      .pipe(
        filter((res) =>
          Boolean(
            res &&
              res.taskId === this.taskService.currentTask$.value?.id &&
              res.type === SocketType.newScheduleJob
          )
        ),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        res.conversationIds?.forEach((id) =>
          this.handleNewJobReminderCount(id)
        );
      });
  }

  handleNewJobReminderCount(conversationId: string) {
    this.trudiScheduledMsgService
      .jobRemindersCount(conversationId)
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe)
      )
      .subscribe();
  }

  shouldHandleProcess(): boolean {
    return this.preventButtonService.shouldHandleProcess(
      EButtonTask.SCHEDULE_MSG_FOR_SEND,
      EButtonType.TASK
    );
  }

  onOpenScheduledMsgModal() {
    if (!this.shouldHandleProcess()) return;
    this.onOpenModal.emit();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
