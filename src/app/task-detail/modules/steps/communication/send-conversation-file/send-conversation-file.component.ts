import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/communication/step-base/step-base.component';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { SendMessageService } from '@services/send-message.service';
import { ConversationService } from '@services/conversation.service';
import { ToastrService } from 'ngx-toastr';
import { FilesService } from '@services/files.service';
import { SharedService } from '@services/shared.service';
import { dropdownList } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import {
  EFooterButtonType,
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { Subject, takeUntil } from 'rxjs';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ChatGptService } from '@services/chatGpt.service';
import { ICustomControl } from '@/app/task-detail/modules/steps/utils/communicationType';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'send-conversation-file',
  templateUrl: './send-conversation-file.component.html'
})
export class SendConversationFileComponent
  extends StepBaseComponent
  implements OnInit, OnChanges, OnDestroy
{
  public selectedFile = [];
  public listOfFile = [];
  private unsubscribe = new Subject<void>();
  public selectFileText = {
    header: this.model?.fields?.customControl?.title,
    notFound: 'No documents found'
  };
  public isRequired: boolean;
  public buttonKey = EButtonStepKey.SEND_CONVERSATION_FILES;
  public modalId = StepKey.communicationStep.sendConversationFile;

  constructor(
    public override taskService: TaskService,
    public override trudiService: TrudiService,
    public override sendMessageService: SendMessageService,
    public override conversationService: ConversationService,
    public override toastService: ToastrService,
    public override filesService: FilesService,
    public override stepService: StepService,
    public fileService: FilesService,
    public sharedService: SharedService,
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      this.modelData = this.model;
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        'body.prefillTitle': this.modelData?.fields.msgTitle,
        'footer.buttons.showBackBtn': true,
        'footer.buttons.nextButtonType': EFooterButtonType.DROPDOWN,
        'footer.buttons.dropdownList': dropdownList,
        trudiButton: this.modelData
      };
      this.getCustomControlAttachmentFile();
    }
  }

  getCustomControlAttachmentFile() {
    const preScreenAttachmentFile: ICustomControl =
      this.modelData.fields.customControl;
    this.isRequired = preScreenAttachmentFile.isRequired;
    this.selectFileText.header = preScreenAttachmentFile.title;
  }

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.handlePopupState({
        isSelectFiles: false,
        isTrudiSendMessage: false
      });
      this.enableProcess();
    }
  }

  enableProcess() {
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    this.getListOfFile();
    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.isSelectFiles);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ isSelectFiles: true });
  }

  handleUpdateSelectedFilesState(selectedFiles = []) {
    this.listOfFile.forEach((file) => (file.checked = false));
    selectedFiles.forEach((file) => {
      if (file.id) {
        const fileTemp = this.listOfFile.find((it) => it.id === file.id);
        if (fileTemp) {
          fileTemp.checked = true;
        }
      }
    });
  }

  getListOfFile() {
    this.fileService
      .getAttachmentFilesDocument()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.listOfFile = res?.reduce((list, doc) => {
            return (list = [
              ...list,
              ...doc?.propertyDocuments?.filter(
                (file) => !file?.name.includes('undefined')
              )
            ]);
          }, []);
        }
        this.handleUpdateSelectedFilesState([]);
      });
  }

  openSendMsgModal() {
    this.prefillConfig({
      listOfFiles: this.selectedFile,
      rawMsg: this.model?.fields?.msgBody
    });
    this.messageFlowService
      .openSendMsgModal(this.sendMessageConfigs)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Back:
            this.onBackFromSendMsg();
            this.PreventButtonService.setCurrentModalActive(this.buttonKey);
            break;
          case ESendMessageModalOutput.MessageSent:
            this.onSendMsg(rs.data);
            this.PreventButtonService.deleteProcess(
              this.buttonKey,
              EButtonType.STEP
            );
            break;
          case ESendMessageModalOutput.Quit:
            this.onConfirmClose();
            break;
        }
      });
  }

  onGetSelectedFile(files = []) {
    this.handleUpdateSelectedFilesState(files);
    this.selectedFile = this.filesService.mapFilesUpload(files);
    const dynamicFiles = this.mapDynamicFiles();
    this.selectedFile = [...this.selectedFile, ...dynamicFiles];
    this.handlePopupState({ isTrudiSendMessage: true, isSelectFiles: false });
    this.openSendMsgModal();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event?.event) {
      case ESentMsgEvent.SUCCESS:
        this.handlePopupState({ isTrudiSendMessage: false });
        this.filesService.originalLocalFiles.next([]);
        this.listOfFile = [];
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

  onBackFromSendMsg() {
    this.handlePopupState({
      isTrudiSendMessage: false,
      isSelectFiles: true
    });
    this.PreventButtonService.setCurrentModalActive(this.buttonKey);
  }

  onConfirmClose() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.listOfFile = [];
    this.filesService.originalLocalFiles.next([]);
    this.handlePopupState({ isTrudiSendMessage: false });
  }

  override ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  onQuit() {
    this.resetPopupState();
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
  }
}
