import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { OutOfOfficeService } from '@/app/mailbox-setting/services/out-of-office-state.service';
import { OutOfOfficeFormService } from '@/app/mailbox-setting/services/out-of-office-form.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { defaultConfigs } from '@/app/mailbox-setting/utils/out-of-office-config';
import {
  IPopupState,
  ISelectedReceivers,
  IConfigs
} from '@/app/mailbox-setting/utils/out-of-office.interface';
import { TrudiSendMsgUserService } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';

@Component({
  selector: 'office-add-contact-card',
  templateUrl: './office-add-contact-card.component.html',
  styleUrls: ['./office-add-contact-card.component.scss']
})
export class OfficeAddContactCardComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() contact: ISelectedReceivers[] = [];
  @Output() onTrigger: EventEmitter<any> = new EventEmitter();

  public ModalPopupPosition = ModalPopupPosition;
  public isChangeContactCard: boolean = false;
  public tempListContract = [];
  public configs: IConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      title: 'Add contact card'
    }
  };
  public EUserPropertyType = EUserPropertyType;

  constructor(
    private outOfOfficeService: OutOfOfficeService,
    private outOfOfficeContactForm: OutOfOfficeFormService,
    public trudiSendMsgUserService: TrudiSendMsgUserService
  ) {}

  get outOfOfficeForm(): FormGroup {
    return this.outOfOfficeContactForm.outOfOfficeGroup;
  }

  get selectedContactCard(): AbstractControl {
    return this.outOfOfficeForm.get('selectedContactCard');
  }

  get listReceiver(): ISelectedReceivers[] {
    return this.outOfOfficeService.getListReceiver();
  }

  get popupState(): IPopupState {
    return this.outOfOfficeService.getPopupState();
  }

  ngOnInit(): void {
    this.selectedContactCard.setValue(
      this.outOfOfficeContactForm.getSelectedContactCard()
    );
  }

  onClose(): void {
    this.outOfOfficeService.setPopupState({
      addContactCardOutside: false
    });
  }

  onCloseAfterAdd(): void {
    this.outOfOfficeService.setPopupState({
      addContactCardOutside: false
    });
  }

  onTriggerClick(isCheck: boolean): void {
    if (isCheck) {
      this.outOfOfficeContactForm.setSelectedContactCard(
        this.selectedContactCard.value
      );
      this.onTrigger.emit();
    }
    this.onCloseAfterAdd();
  }
}
