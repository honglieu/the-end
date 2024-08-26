import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { TrudiTextFieldComponent } from '@trudi-ui';

@Component({
  selector: 'edit-title',
  templateUrl: './edit-title.component.html',
  styleUrls: ['./edit-title.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditTitleComponent {
  @ViewChild('trudiTextField') taskNameInputEl: TrudiTextFieldComponent;
  @Input() isBlockEvent: boolean;
  @Input() title: string;
  @Output() triggerEdit = new EventEmitter();
  constructor() {}

  triggerEvent(event: Event) {
    this.triggerEdit.emit(event);
  }

  public focusInput() {
    if (this.taskNameInputEl) {
      this.taskNameInputEl.inputElem.nativeElement.focus();
    }
  }
}
