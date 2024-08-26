import { Component } from '@angular/core';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/calendar-event/step-base/step-base.component';
import { ToastrService } from 'ngx-toastr';
import { ChatGptService } from '@services/chatGpt.service';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { SendMessageService } from '@services/send-message.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';

@Component({
  selector: 'breach-notice-remedy-date',
  templateUrl: './breach-notice-remedy-date.component.html',
  styleUrls: ['./breach-notice-remedy-date.component.scss']
})
export class BreachNoticeRemedyDateComponent extends StepBaseComponent {
  public buttonKey = EButtonStepKey.BREACH_NOTICE_REMEDY_DATE;
  public modalId = StepKey.eventStep.breadNoticeRemedyDate;
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
    private PreventButtonService: PreventButtonService
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
      trudiDynamicParameterService
    );
  }

  public enableProcess() {
    this.handlePopupState({ isShowBreachNoticeRemedyDate: true });
  }

  public onClose() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.handlePopupState({ isShowBreachNoticeRemedyDate: false });
  }

  public onSuccess(eventId) {
    this.complete(null, { eventId });
  }
}
