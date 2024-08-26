import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ChatGptService } from '@services/chatGpt.service';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { SendMessageService } from '@services/send-message.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/communication/step-base/step-base.component';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { EAction } from './components/schedule-property-entry/type/schedule-property-entry.type';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'entry-notice-entry-date',
  templateUrl: './entry-notice-entry-date.component.html',
  styleUrls: ['./entry-notice-entry-date.component.scss']
})
export class EntryNoticeEntryDateComponent extends StepBaseComponent {
  public EAction = EAction;
  public buttonKey = EButtonStepKey.ENTRY_NOTICE_ENTRY_DATE;
  public modalId = StepKey.eventStep.entryNoticeEntryDate;

  constructor(
    public override taskService: TaskService,
    public override trudiService: TrudiService,
    public override sendMessageService: SendMessageService,
    public override conversationService: ConversationService,
    public override toastService: ToastrService,
    public override filesService: FilesService,
    public override stepService: StepService,
    public override chatGptService: ChatGptService,
    public override trudiDynamicParameterService: TrudiDynamicParameterService,
    private PreventButtonService: PreventButtonService,
    public override toastCustomService: ToastCustomService
  ) {
    super(
      taskService,
      trudiService,
      sendMessageService,
      conversationService,
      toastService,
      filesService,
      stepService,
      chatGptService,
      trudiDynamicParameterService,
      toastCustomService
    );
  }

  public enableProcess() {
    this.handlePopupState({ isShowEntryNoticeEntryDate: true });
  }

  public updateButtonStep(eventId) {
    this.complete(null, { eventId });
  }

  handleQuit() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.handlePopupState({ isShowEntryNoticeEntryDate: false });
  }
}
