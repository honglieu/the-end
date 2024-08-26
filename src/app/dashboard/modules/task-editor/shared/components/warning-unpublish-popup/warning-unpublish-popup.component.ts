import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  ECreatePopupType,
  ETaskTemplateStatus
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'warning-unpublish-popup',
  templateUrl: './warning-unpublish-popup.component.html',
  styleUrls: ['./warning-unpublish-popup.component.scss']
})
export class WarningUnpublishPopupComponent implements OnInit {
  public typeCreateTaskEditor = ECreatePopupType;
  public isDisabled: boolean = true;
  private unsubscribe = new Subject<void>();
  @Input() taskState: ETaskTemplateStatus = ETaskTemplateStatus.DRAFT;
  @Input() visible: boolean = false;
  @Input() taskTemplates = [];
  public dataItems: IReferenceTemplates[] = [];

  @Output() onConfirm: EventEmitter<any> = new EventEmitter();
  @Output() onClose: EventEmitter<void> = new EventEmitter();

  constructor(public taskEditorService: TaskEditorService) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['taskTemplates']) {
      this.dataItems = this.taskTemplates.filter(
        (item) => item.referenceTemplates.length
      );
    }
  }

  handleOk() {
    this.onConfirm.emit(this.taskState);
  }

  handleCancel() {
    this.onClose.emit();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
interface IReferenceTemplate {
  id: string;
  name: string;
}
export interface IReferenceTemplates {
  id: string;
  name: string;
  referenceTemplates: IReferenceTemplate[];
}
