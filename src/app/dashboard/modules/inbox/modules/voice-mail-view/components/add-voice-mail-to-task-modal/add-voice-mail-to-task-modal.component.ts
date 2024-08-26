import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { Subject } from 'rxjs';
import { VoiceMailMenuService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail-menu.service';
import { TaskItem } from '@shared/types/task.interface';
import { MenuOption } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'add-voice-mail-to-task-modal',
  templateUrl: './add-voice-mail-to-task-modal.component.html',
  styleUrls: ['./add-voice-mail-to-task-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddVoiceMailToTaskModalComponent implements OnDestroy {
  @Input() visible: boolean = false;
  @Input() currentVoicemailTask: TaskItem;
  @Input() currentVoicemailTasks: TaskItem[];
  @Output() visibleChange = new EventEmitter<void>();
  @Output() exportConversationHistory = new EventEmitter<void>();

  pmEmail: string;
  isActionInProgress: boolean = false;
  readonly headerTitle = 'Select an option to continue';
  readonly MenuOption = MenuOption;

  get isSelectedMove() {
    return this.inboxToolbarService.hasItem;
  }

  private unsubscribe$ = new Subject<void>();

  constructor(
    private readonly voiceMailMenuService: VoiceMailMenuService,
    public readonly inboxToolbarService: InboxToolbarService,
    private activatedRoute: ActivatedRoute
  ) {}

  handleMenu(option) {
    this.isActionInProgress = true;
    this.voiceMailMenuService
      .handleMenuChange({
        message: this.currentVoicemailTask,
        messages: this.currentVoicemailTasks,
        option,
        conversationId:
          this.activatedRoute.snapshot.queryParams['conversationId']
      })
      .then(() => {});
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
