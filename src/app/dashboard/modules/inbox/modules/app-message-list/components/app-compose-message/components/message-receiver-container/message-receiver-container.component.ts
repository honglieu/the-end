import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import {
  ISelectedReceivers,
  ISendMsgConfigs
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { whiteListClickOutsideSelectReceiver } from '@shared/constants/outside-white-list.constant';
import { MessageReceiverComponent } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/components/message-receiver/message-receiver.component';

@Component({
  selector: 'message-receiver-container',
  templateUrl: './message-receiver-container.component.html',
  styleUrls: ['./message-receiver-container.component.scss']
})
export class MessageReceiverContainerComponent implements AfterViewInit {
  @ViewChild('toField', { static: false })
  toField: MessageReceiverComponent;

  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() isRmEnvironment: boolean = false;
  @Output() changeReceivers = new EventEmitter();
  public isShowPreview: boolean = false;
  public whiteListClickOutsideSelectReceiver: string[] = [
    ...whiteListClickOutsideSelectReceiver
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private trudiSendMsgFormService: TrudiSendMsgFormService
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.toField) {
        this.isShowPreview = false;
        this.toField.onFocusAndOpenSelect();
        this.cdr.markForCheck();
      }
    });
  }

  get sendMsgForm() {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get selectedReceivers(): AbstractControl {
    return this.sendMsgForm?.get('selectedReceivers');
  }

  compareWith(receiverA: ISelectedReceivers, receiverB: ISelectedReceivers) {
    return (
      receiverA.id === receiverB.id &&
      receiverA.propertyId === receiverB.propertyId &&
      (receiverA.secondaryEmail?.id == receiverB.secondaryEmailId ||
        receiverA.secondaryEmail?.id == receiverB.secondaryEmail?.id)
    );
  }

  setPreviewLabel(isShow: boolean) {
    const dropdown = document.querySelector('.ng-dropdown-panel');
    if (dropdown && this.isShowPreview) {
      this.isShowPreview = isShow;
    }
  }

  handleClickOutSide() {
    this.isShowPreview = true;
    this.cdr.markForCheck();
  }

  onClickToField() {
    if (this.isShowPreview) {
      this.isShowPreview = false;
      setTimeout(() => {
        this.toField.onFocusAndOpenSelect();
      }, 0);
      this.cdr.markForCheck();
    }
  }
}
