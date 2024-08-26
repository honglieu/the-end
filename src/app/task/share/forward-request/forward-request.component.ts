import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { ETrudiType } from '@shared/enum/trudi';
import {
  TrudiButton,
  TrudiResponse,
  TrudiResponseVariable
} from '@shared/types/trudi.interface';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { ConversationService } from '@services/conversation.service';
import { ControlPanelService } from '@/app/control-panel/control-panel.service';

@Component({
  selector: 'forward-request',
  templateUrl: './forward-request.component.html',
  styleUrls: ['./forward-request.component.scss']
})
export class ForwardRequestComponent implements OnInit {
  @Input() btnInfo: TrudiButton;
  @Input() activeTag: boolean = false;
  @Input() isComplete: boolean = false;
  @Input() isFrozen: boolean;
  @Input() status: TrudiButtonEnumStatus;
  @Input() isTypeTrudi: string;
  @Input() isStatusSync: string;
  @Input() isTypeUnhappyTrudi: string;

  @Output() onBtnClick = new EventEmitter<TrudiButton>();

  forwardAction = ForwardButtonAction;
  MAINTENANCE_BUTTON_ENUM = TrudiButtonEnumStatus;
  public TYPE_SYNC_MAINTENANCE = SyncMaintenanceType;
  public popupModalPosition = ModalPopupPosition;
  public TYPE_TRUDI = ETrudiType;

  constructor(
    private conversationService: ConversationService,
    private controlPanelService: ControlPanelService
  ) {}
  ngOnInit(): void {
    this.handleReplaceText(this.btnInfo?.text);
  }

  openForwardRequestBox(btnInfo: TrudiButton) {
    btnInfo && this.onBtnClick.next(btnInfo);
  }

  handleReplaceText(text: string) {
    const trudiRes =
      this.conversationService.trudiResponseConversation.getValue()
        ?.trudiResponse;
    let trudiVariable: TrudiResponseVariable;
    switch (trudiRes?.type) {
      case ETrudiType.q_a:
        trudiVariable =
          this.conversationService.trudiResponseConversation.getValue()
            ?.trudiResponse?.data[0]?.body?.variable;
        break;
      case ETrudiType.super_happy_path:
        trudiVariable =
          this.conversationService.trudiResponseConversation.getValue()
            ?.trudiResponse?.data[0]?.body?.suggestions?.data[0]?.body
            ?.variable;
        break;
      default:
        break;
    }

    if (!trudiVariable || !Object.keys(trudiVariable).length) return;
    for (const [key, value] of Object.entries(trudiVariable)) {
      if (text.includes(key)) {
        const reg = new RegExp(key, 'g');
        text = text.trim().replace(reg, value);
      }
    }
    this.btnInfo.text = text;
  }

  changeTicketButtonStatus(
    buttonAction: ForwardButtonAction,
    stepIndex: number,
    status: TrudiButtonEnumStatus
  ) {
    this.conversationService
      .changeTicketButtonStatus(
        this.conversationService.trudiResponseConversation.getValue().id,
        buttonAction,
        stepIndex,
        status
      )
      .subscribe((response: TrudiResponse) => {
        response &&
          this.controlPanelService.reloadForwardRequestList.next(
            response.data[0].body.button
          );
      });
  }

  changeText() {
    switch (this.btnInfo.text) {
      case 'Tell tenant we’re looking into it':
        return 'Tell-tenant-we’re-looking-into-it';
      case 'Forward request to landlord':
        return 'Forward-request-to-landlord';
      case 'Send maintenance request to Property Tree':
        return 'Send-maintenance-request-to-Property-Tree';
      case 'Ask suppliers to quote':
        return 'Ask-suppliers-to-quote';
      case 'Send quote to landlord':
        return 'Send-quote-to-landlord';
      case 'Create work order for supplier':
        return 'Create-work-order-for-supplier';
      case 'Send supplier details to tenant':
        return 'Send-supplier-details-to-tenant';
      case 'Send invoice to Property Tree':
        return 'Send-invoice-to-Property-Tree';
      case 'Notify landlord of completion':
        return 'Notify-landlord-of-completion';
      case 'Notify tenant of quote rejection':
        return 'Notify-tenant-of-quote-rejection';
      default:
        return 'Complete-maintenance-request-in-Property-Tree';
    }
  }
}
