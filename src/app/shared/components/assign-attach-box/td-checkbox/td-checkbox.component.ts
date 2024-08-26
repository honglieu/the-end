import { Agent, InviteStatus } from '@shared/types/agent.interface';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef
} from '@angular/core';

@Component({
  selector: 'td-checkbox',
  templateUrl: './td-checkbox.component.html',
  styleUrls: ['./td-checkbox.component.css']
})
export class TdCheckboxAssignComponent implements OnInit {
  @Input() dataE2e;
  @Input() reverse = false;
  @Input() spaceBetween = true;
  @Input() isChecked = false;
  @Input() label = '';
  @Input() labelTemplate: TemplateRef<any>;
  @Input() divider: false;
  @Input() size = 24;
  @Input() isSMS: boolean = false;
  @Input() customCheckbox: {
    checked: string;
    uncheck: string;
    disable: string;
    deactived: string;
  } = {
    checked: 'userChecked',
    uncheck: 'userUnCheck',
    disable: 'checkboxDisable',
    deactived: 'checkboxDeactived'
  };
  @Input() disableCheckbox: boolean = false;
  @Input() inviteStatus: InviteStatus = InviteStatus.ACTIVE;
  @Input() listInviteStatus: typeof InviteStatus = InviteStatus;
  @Input() currentUser: Agent;
  @Output() tdCheckboxChanged = new EventEmitter<boolean>();
  disabled = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit() {
    this.el.nativeElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onToggleCheckbox();
    });
  }

  onCheckboxChange(e: boolean) {
    if (!this.disabled && !this.disableCheckbox) {
      this.tdCheckboxChanged.emit(e);
    }
  }
  onToggleCheckbox() {
    if (
      !this.isChecked &&
      this.currentUser?.inviteStatus === InviteStatus.DEACTIVATED
    )
      return;
    if (!this.disabled && !this.disableCheckbox) {
      this.isChecked = !this.isChecked;
      this.tdCheckboxChanged.emit(this.isChecked);
    }
  }
}
