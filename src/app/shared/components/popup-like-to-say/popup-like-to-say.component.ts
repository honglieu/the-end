import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { ControlPanelService } from '@/app/control-panel/control-panel.service';
import { PropertiesService } from '@services/properties.service';

declare const loader: any;

@Component({
  selector: 'app-popup-like-to-say',
  templateUrl: 'popup-like-to-say.component.html',
  styleUrls: ['./popup-like-to-say.component.scss']
})
export class PopupLikeToSayComponent implements OnInit, OnChanges {
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() isBackModal = new EventEmitter<boolean>();
  @Output() isNextModal = new EventEmitter<number>();
  @Input() showPopup: boolean;
  @Input() showBackBtn = false;

  public expenditureLimit = '0';
  public popupForwardLandlordLikeToSay = {
    askForApproval: `Ask for approval to repair under $${
      this.expenditureLimit || 0
    } expenditure limit`,
    adviseQuotes: 'Advise that quotes will be obtained (no call-out-fee)',
    requestApproval: 'Request approval to obtain quotes with call-out-fee',
    confirmPlans:
      'Confirm if landlord plans to attend to maintenance themselves'
  };

  public options = [
    {
      id: '1',
      text: this.popupForwardLandlordLikeToSay.askForApproval,
      checked: false,
      dataE2e: 'ask-option'
    },
    {
      id: '2',
      text: this.popupForwardLandlordLikeToSay.adviseQuotes,
      checked: false,
      dataE2e: 'advise-option'
    },
    {
      id: '3',
      text: this.popupForwardLandlordLikeToSay.requestApproval,
      checked: false,
      dataE2e: 'request-option'
    },
    {
      id: '4',
      text: this.popupForwardLandlordLikeToSay.confirmPlans,
      checked: false,
      dataE2e: 'confirm-option'
    }
  ];

  public listChecked: boolean = false;

  constructor(
    private controlPanelService: ControlPanelService,
    private propertiesService: PropertiesService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['showPopup']?.currentValue && this.showPopup) {
      this.expenditureLimit = this.propertiesService.expenditureLimit || '';
      this.popupForwardLandlordLikeToSay = {
        ...this.popupForwardLandlordLikeToSay,
        askForApproval: `Ask for approval to repair under $${
          this.expenditureLimit || 0
        } expenditure limit`
      };
      this.options.map((item) =>
        item.id === '1'
          ? (item.text = this.popupForwardLandlordLikeToSay.askForApproval)
          : null
      );
      this.checkListChecked();
    }
  }

  ngOnInit() {
    this.checkListChecked();
  }

  onNext() {
    const itemCheckedIndex = this.options.findIndex((item) => item.checked);
    this.controlPanelService.forwardLandlordData = {
      ...this.controlPanelService.forwardLandlordData,
      type: {
        id: this.options[itemCheckedIndex].id,
        name: this.options[itemCheckedIndex].text
      }
    };

    this.isNextModal.emit(itemCheckedIndex);
    this.options[itemCheckedIndex].checked = false;
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

  onClose() {
    this.isCloseModal.emit(true);
    this.options.map((item) => (item.checked = false));
    this.controlPanelService.resetForwardLandlordData();
  }

  onBack() {
    this.isBackModal.emit(true);
    this.options.map((item) => (item.checked = false));
    this.controlPanelService.resetForwardLandlordData();
  }
}
