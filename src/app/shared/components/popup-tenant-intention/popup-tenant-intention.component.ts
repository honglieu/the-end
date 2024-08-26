import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { PropertiesService } from '@services/properties.service';

@Component({
  selector: 'app-popup-tenant-intentions',
  templateUrl: './popup-tenant-intention.component.html',
  styleUrls: ['./popup-tenant-intention.component.scss']
})
export class PopupTenantIntentionComponent implements OnInit, OnChanges {
  @Input() showPopup: boolean = false;
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() onClickBack = new EventEmitter<boolean>();
  @Output() isNextModal = new EventEmitter<number>();
  @Output() onStopProcess = new EventEmitter<boolean>();
  @Input() isShowBackButton: boolean = false;
  public title = 'What are the tenant’s intentions?';
  public listChecked: boolean = false;
  public selectedUser = [];

  public popupForwardTenantIntention = {
    fixedTermLease: 'Tenant would like another fixed-term lease',
    periodicLease: 'Tenant would like to move onto a periodic lease',
    unknown: 'Tenant intentions unknown'
  };

  public options = [
    {
      id: '1',
      text: this.popupForwardTenantIntention.fixedTermLease,
      checked: false
    },
    {
      id: '2',
      text: this.popupForwardTenantIntention.periodicLease,
      checked: false
    },
    {
      id: '3',
      text: this.popupForwardTenantIntention.unknown,
      checked: false
    }
  ];

  constructor(private propertyService: PropertiesService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['showPopup']?.currentValue) {
      this.options.forEach((item) => (item.checked = false));
    }
    this.checkListChecked();
  }

  ngOnInit(): void {
    this.checkListChecked();
  }

  onCheckboxChange(itemId: string) {
    if (!itemId || !itemId.length) {
      return;
    }
    this.options.forEach((item) =>
      item.id === itemId
        ? (item.checked = !item.checked)
        : (item.checked = false)
    );
    this.checkListChecked();
  }

  checkListChecked() {
    this.listChecked = this.options.some((item) => item.checked);
  }

  handleClickBack() {
    this.onClickBack.emit();
    this.options.forEach((item) => (item.checked = false));
    this.checkListChecked();
  }

  handleClickNext() {
    const checkedIndex = this.options.findIndex((item) => item.checked);
    this.isNextModal.emit(checkedIndex);
    this.checkListChecked();
  }

  stopProcess() {
    this.isCloseModal.emit();
    this.onStopProcess.emit(true);
    this.options.forEach((item) => (item.checked = false));
    this.checkListChecked();
  }
}
