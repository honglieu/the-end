import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation
} from '@angular/core';

@Component({
  selector: 'move-to-task-modal',
  templateUrl: './move-to-task-modal.component.html',
  styleUrls: ['./move-to-task-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoveToTaskModalComponent {
  @Input() visible: boolean = false;
  @Input() propertyIds: string[];
  @Input() conversationId: string;
  @Input() taskIds: string[];
  @Input() folderUid: string;
  @Input() isUnHappyPath: boolean;
  @Input() isShowAddress: boolean;

  @Output() visibleChange = new EventEmitter<void>();
  @Output() exportConversationHistory = new EventEmitter<void>();
  @Output() createNewTask = new EventEmitter<void>();

  public readonly EViewDetailMode = EViewDetailMode;

  constructor() {}

  handleBackPopupMoveTask() {
    this.visible = false;
    this.visibleChange.emit();
  }

  handleQuitModal() {
    this.visible = false;
    this.visibleChange.emit();
  }
}
