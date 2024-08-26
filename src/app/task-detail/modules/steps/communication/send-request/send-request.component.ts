import { TrudiDynamicParameterService } from './../../../../../trudi-send-msg/services/trudi-dynamic-paramater.service';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  OnDestroy,
  Input
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { PropertiesService } from '@services/properties.service';
import { SendMessageService } from '@services/send-message.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { UserService } from '@services/user.service';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/communication/step-base/step-base.component';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ChatGptService } from '@services/chatGpt.service';
import { PhotoType } from '@shared/types/task.interface';
import { Subject, takeUntil } from 'rxjs';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EButtonStepKey, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';

@Component({
  selector: 'send-request',
  templateUrl: './send-request.component.html'
})
export class SendRequestComponent
  extends StepBaseComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() listImage: PhotoType[] = [];
  public hiddenFooter: boolean = true;
  private unsubscribe = new Subject<void>();
  public summaryText: string = '';
  public summaryPhotoFiles: PhotoType[];
  public buttonKey = EButtonStepKey.SEND_REQUEST;

  constructor(
    public override taskService: TaskService,
    public override trudiService: TrudiService,
    public override sendMessageService: SendMessageService,
    public override conversationService: ConversationService,
    public override toastService: ToastrService,
    public override filesService: FilesService,
    public override stepService: StepService,
    public propertyService: PropertiesService,
    public userService: UserService,
    public override chatGptService: ChatGptService,
    public override trudiDynamicParameterService: TrudiDynamicParameterService,
    public override toastCustomService: ToastCustomService,
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
      trudiDynamicParameterService,
      toastCustomService
    );
  }

  override ngOnInit() {
    super.ngOnInit();
    this.messageFlowService.triggerCloseMsg$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.PreventButtonService.deleteProcess(
          this.buttonKey,
          EButtonType.STEP
        );
        this.resetPopupState();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        'body.prefillTitle': this.model.fields.msgTitle,
        'footer.buttons.showBackBtn': false,
        trudiButton: this.model,
        'header.showDropdown': false,
        'inputs.listOfFiles': this.model?.fields?.files || [],
        'inputs.rawMsg': this.model?.fields?.msgBody
      };
    }
  }

  enableProcess() {
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.isTrudiSendMessage, () =>
        this.openSendMsgModal()
      );
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ isTrudiSendMessage: true });
    this.openSendMsgModal();
  }

  openSendMsgModal() {
    this.prefillConfig({
      rawMsg: this.model?.fields?.msgBody,
      listOfFiles: this.model?.fields?.files
    });
    this.messageFlowService
      .openSendMsgModal(this.sendMessageConfigs)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Back:
            this.onBack();
            break;
          case ESendMessageModalOutput.MessageSent:
            this.PreventButtonService.deleteProcess(
              this.buttonKey,
              EButtonType.STEP
            );
            this.onSendMsg(rs.data);
            break;
          case ESendMessageModalOutput.Quit:
            this.PreventButtonService.deleteProcess(
              this.buttonKey,
              EButtonType.STEP
            );
            this.resetPopupState();
            break;
        }
      });
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.handlePopupState({ isTrudiSendMessage: false });
        if (event.isDraft) {
          return;
        }
        this.complete(event);
        this.handleSendMsgToast(event);
        break;
      default:
        break;
    }
  }

  handleCloseSendMsgPopup() {
    this.handlePopupState({ isTrudiSendMessage: false });
  }

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.handlePopupState({ isTrudiSendMessage: false });
      this.enableProcess();
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
