import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild
} from '@angular/core';
import uuid4 from 'uuid4';
@Component({
  selector: 'switch-checkbox',
  templateUrl: './switch-checkbox.component.html',
  styleUrls: ['./switch-checkbox.component.scss']
})
export class SwitchCheckboxComponent implements OnInit {
  @ViewChild('changeInput') changeResolve: ElementRef<HTMLInputElement>;
  @Input() reverse = false;
  @Input() label = '';
  @Input() isChecked = true;
  @Input() index = -1;
  @Input() labelTemplate: TemplateRef<any>;
  @Input() reminderToggle: boolean = false;
  @Input() customClass: string = '';
  @Input() dataE2E: string = '';
  @Input() disabled = false;
  @Output() tdCheckboxChanged = new EventEmitter<boolean>();

  internalId: string = `switch-checkbox-${uuid4()}`;

  constructor() {}

  ngOnInit(): void {
    if (this.index >= 0) {
      this.internalId = 'resol' + this.index;
    }
  }

  onCheckboxChange(e: boolean, isEnter?: boolean) {
    if (!this.disabled) {
      this.tdCheckboxChanged.emit(e);
    }
    if (isEnter) {
      this.isChecked = e;
    }
  }
}
