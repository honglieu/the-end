import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { EMailBoxType } from '@shared/enum/inbox.enum';

@Component({
  selector: 'select-mailbox-type',
  templateUrl: './select-mailbox-type.component.html',
  styleUrls: ['./select-mailbox-type.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SelectMailboxTypeComponent {
  @Input() visible: boolean = false;
  @Output() onNext: EventEmitter<EMailBoxType> =
    new EventEmitter<EMailBoxType>();
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  public selectedMailboxType: EMailBoxType;
  public readonly mailBoxType = EMailBoxType;
  public isErrorSelect: boolean = false;

  public onSelectMailboxType(type: EMailBoxType) {
    this.isErrorSelect = false;
    this.selectedMailboxType = type;
  }

  public handleCancel() {
    this.onCancel.emit();
  }

  public handleNext() {
    if (!this.selectedMailboxType) {
      this.isErrorSelect = true;
    } else {
      this.onNext.emit(this.selectedMailboxType);
    }
  }
}
