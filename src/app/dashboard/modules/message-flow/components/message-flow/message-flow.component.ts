import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EModalID } from '@/app/dashboard/services/modal-management.service';
import { PreventButtonService } from '@trudi-ui';
import { TrudiSendMsgUserService } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { ISendMsgTriggerEvent } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { Component, OnDestroy, OnInit, HostBinding } from '@angular/core';
import { Subject, pairwise, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

// TODO: refactor code state popup
@Component({
  selector: 'message-flow',
  templateUrl: './message-flow.component.html',
  styleUrls: ['./message-flow.component.scss'],
  providers: [TrudiSendMsgUserService]
})
export class MessageFlowComponent implements OnInit, OnDestroy {
  public EModalID = EModalID;
  private destroy$ = new Subject();
  constructor(
    private messageFlowService: MessageFlowService,
    private preventButtonService: PreventButtonService,
    private router: Router
  ) {}

  public isProcessing$ = this.messageFlowService.isProcessing$;
  public currentModal$ = this.messageFlowService.currentModal$;
  public config$ = this.messageFlowService.sendMsgConfig$;

  @HostBinding('attr.class') get classes() {
    return `message-flow ${
      this.messageFlowService.isProcessing ? 'message-flow-processing' : ''
    }`;
  }

  ngOnInit(): void {
    this.currentModal$.pipe(takeUntil(this.destroy$), pairwise()).subscribe({
      next: ([prevId, currId]) => {
        if (currId === null && prevId) {
          this.preventButtonService.deleteCurrentModalActive(prevId as any);
        }

        if (currId) {
          this.preventButtonService.setCurrentModalActive(currId as any);
        }
      }
    });
  }

  handleCloseSendMsgModal() {
    if (this.messageFlowService.output$) {
      this.messageFlowService.closeAll();
      this.messageFlowService.triggerCloseMsg$.next();
      this.messageFlowService.output$.next({
        data: null,
        type: ESendMessageModalOutput.Quit
      });
      this.messageFlowService.output$.complete();
    }
    this.messageFlowService.closeAll();
    this.messageFlowService.stopProcess();
  }

  handleBack(modalId: EModalID) {
    this.messageFlowService.back(modalId);
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    //Todo refactor
    if (this.messageFlowService.sended$) {
      this.messageFlowService.sended$.next(event);
      this.messageFlowService.sended$.complete();
    }
    if (this.messageFlowService.output$) {
      this.messageFlowService.output$.next({
        data: event,
        type: ESendMessageModalOutput.MessageSent
      });
      this.messageFlowService.output$.complete();
    }
    this.messageFlowService.closeAll();
    this.messageFlowService.stopProcess();

    if (this.router.url.includes('inbox/detail')) {
      this.messageFlowService.sendMsgCommunicationStep$.next(true);
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
