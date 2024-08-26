import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation
} from '@angular/core';

@Component({
  selector: 'encourage-user',
  templateUrl: './encourage-user.component.html',
  styleUrls: ['./encourage-user.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EncourageUserComponent {
  @Input() visible: boolean = false;
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onNext: EventEmitter<void> = new EventEmitter<void>();

  constructor() {}

  handleCancel(): void {
    this.onCancel.emit();
  }

  handleNext(): void {
    this.onNext.emit();
  }
}
