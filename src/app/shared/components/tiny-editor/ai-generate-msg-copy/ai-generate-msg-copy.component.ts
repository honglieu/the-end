import { AgencyService } from '@/app/dashboard/services/agency.service';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { NzPopoverDirective } from 'ng-zorro-antd/popover';
import { Subject, finalize, take, takeUntil } from 'rxjs';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';
import {
  ChatGptService,
  EBoxMessageType,
  IGenerateSendMsgBody
} from '@services/chatGpt.service';
import { ToastrService } from 'ngx-toastr';
import { EActionShowMessageTooltip } from '@shared/enum/share.enum';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { SETTING_EVENT } from './components/ai-setting-control/ai-setting-control.component';
import { TaskService } from '@services/task.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import {
  EStepType,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { HandleInitAISummaryContent } from '@shared/feature/function.feature';
import { IFromUserMailBox } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { UserService } from '@services/user.service';
import { SharedService } from '@services/shared.service';
import { getServiceDataFromConfig } from '@/app/trudi-send-msg/utils/helper-functions';

export enum AISETTING_PLACEMENT {
  MSG_MODAL = 'MSG_MODAL',
  INLINE_MESSAGE = 'INLINE',
  TASK_EDITOR = 'TASK_EDITOR'
}

export enum GENERATE_OPTION {
  BASE_ON_MSG = 'Write a reply based on last message received',
  TELL_AI = 'Tell our AI roughly what you’d like to say'
}

export const AITitle = {
  0: 'AI generated reply',
  1: "Tell our AI roughly what you'd like to say"
};

export const generateOptions = Object.values(GENERATE_OPTION).map((option) => ({
  label: option,
  value: option,
  disabled: false
}));

@Component({
  selector: 'ai-generate-msg-copy',
  templateUrl: './ai-generate-msg-copy.component.html',
  styleUrls: ['./ai-generate-msg-copy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiGenerateMsgCopyComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @ViewChild('popover') popover: NzPopoverDirective;
  @Input() label: string = AITitle[0];
  @Input() placement: AISETTING_PLACEMENT;
  @Input() isAIShowHelpPopover: boolean = true;
  @Input() fromMore: boolean = false;
  @Input() showGeneratedOptions = false;
  @Output() hidePopover = new EventEmitter();
  private destroy$ = new Subject<void>();
  form: FormGroup;
  public showPopover: boolean = false;
  public tooltipTextControl: string = 'Have our AI to write your reply';
  public actionLimited: boolean = false;
  public placeHolderDescription: string =
    'Ask the tenants if they want to renew their lease at the property for another 12 months';
  public showHelpPopover: boolean = false;
  public showBtnTmp: boolean = true;
  public disableGenerateBtn: boolean = false;
  public actionShowMessageTooltip = EActionShowMessageTooltip;
  public isShowSetting = false;
  public generateOptions = generateOptions;
  public AISETTING_PLACEMENT = AISETTING_PLACEMENT;
  public readonly icon = {
    AI: 'frame',
    more: 'textEditorMore',
    moreSelected: 'textEditorMoreSelected'
  };

  private basisCodes = [
    'Pre-screen',
    'Recipient',
    'Property',
    'Company',
    'Tenancy',
    'Landlord'
  ];
  private calendarCodes = ['Breach notice', 'Entry notice', 'Custom event'];
  private isEnableSuggestReplySetting: boolean = false;
  private isArchiveMailbox: boolean = false;
  private readonly AI_WRITE_TEMPLATE_MSG = 'Have our AI write your template';
  private readonly UPGRADE_PLAN_MSG =
    'To have our AI write your template, upgrade your plan.';
  public isConsole: boolean = false;

  get disabled() {
    if (this.isConsole) return false;
    return !this.isEnableSuggestReplySetting || this.isArchiveMailbox;
  }

  constructor(
    private fb: FormBuilder,
    private chatGptService: ChatGptService,
    private communicationFormService: CommunicationStepFormService,
    private agencyService: AgencyService,
    private toastService: ToastrService,
    private cdr: ChangeDetectorRef,
    private toastrService: ToastrService,
    // private propertyService: PropertiesService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgService: TrudiSendMsgService,
    private taskService: TaskService,
    public inboxService: InboxService,
    // private conversationService: ConversationService,
    private taskTemplateService: TaskTemplateService,
    private userService: UserService,
    private sharedService: SharedService
  ) {
    this.form = this.fb.group({
      description: ['', Validators.required],
      generateOption: new FormControl(null)
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.['placement'].currentValue === AISETTING_PLACEMENT.INLINE_MESSAGE
    ) {
      this.generateOption.setValue(GENERATE_OPTION.TELL_AI);
      this.generateOption.valueChanges.subscribe(() => {
        if (this.generateOption.value === GENERATE_OPTION.TELL_AI) {
          this.description.setValidators([Validators.required]);
          this.description.markAsUntouched();
        } else {
          this.description.clearValidators();
        }
        this.description.updateValueAndValidity();
      });
    }

    changes['fromMore'] &&
      this.visibleChange(changes['fromMore'].currentValue || false);
  }

  ngAfterViewInit(): void {
    this.handleShowHelpPopover();
  }

  handleShowHelpPopover() {
    const trudiBtn = this.trudiSendMsgService.configs.value
      ?.trudiButton as TrudiStep;
    const isCommunicationStep =
      trudiBtn?.type === ETypeElement.STEP &&
      trudiBtn?.stepType === EStepType.COMMUNICATE;

    if (this.placement === AISETTING_PLACEMENT.TASK_EDITOR) {
      this.taskTemplateService.taskTemplate$
        .pipe(takeUntil(this.destroy$), take(1))
        .subscribe(({ template }) => {
          this.showHelpPopover =
            !template.hasCreateFirstCommunicationStep &&
            !this.communicationFormService.getSelectedStep();
          this.cdr.markForCheck();
        });
    } else if (
      this.placement === AISETTING_PLACEMENT.MSG_MODAL &&
      !isCommunicationStep
    ) {
      const currentUserId = localStorage.getItem('userId');
      this.agencyService
        .getIsShowAIIntroduce(currentUserId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          if (res) {
            this.showHelpPopover = res.isShowAiIntroduce;
            this.cdr.markForCheck();
          }
        });
    }
  }

  ngOnInit(): void {
    this.subscribeUser();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isShow: boolean) => {
        // AI Toolbar at send msg modal already filtered out archived mailboxes
        this.isArchiveMailbox =
          this.placement === AISETTING_PLACEMENT.MSG_MODAL ? false : isShow;
      });

    this.subscribeActionLimited();
    this.subscribeEnableSuggestReplySetting();
    this.chatGptService.onLoading
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.disableGenerateBtn = !!res?.status;
        this.cdr.markForCheck();
        if (res && !res?.status) {
          this.description.setValue('');
        }
      });
  }

  subscribeActionLimited() {
    this.chatGptService.getActionLimited
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        this.actionLimited = false;
        if (this.actionLimited) {
          this.tooltipTextControl =
            'You have reached your monthly limit of AI generated replies. Upgrade your plan.';
          this.placeHolderDescription =
            'Example: Ask the tenants if they want to renew their lease at the property for another 12 months';
        }
      });
  }

  subscribeEnableSuggestReplySetting() {
    ChatGptService.enableSuggestReplySetting
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        this.isEnableSuggestReplySetting = status;
        this.setToolTipTextControl();
        this.cdr.markForCheck();
      });
  }

  private setToolTipTextControl() {
    if (this.placement === AISETTING_PLACEMENT.TASK_EDITOR) {
      if (this.isConsole) {
        this.tooltipTextControl = this.AI_WRITE_TEMPLATE_MSG;
      } else {
        this.tooltipTextControl = this.isEnableSuggestReplySetting
          ? this.AI_WRITE_TEMPLATE_MSG
          : this.UPGRADE_PLAN_MSG;
      }
    }
  }

  private subscribeUser() {
    this.userService.userInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.isConsole = this.sharedService.isConsoleUsers();
        this.setToolTipTextControl();
        this.cdr.markForCheck();
      });
  }

  get communicationForm() {
    return this.communicationFormService.getCommunicationForm;
  }

  get messageCopyControl() {
    return this.communicationForm?.get('messageCopy');
  }

  get generateOption() {
    return this.form?.get('generateOption');
  }

  get description() {
    return this.form?.get('description');
  }

  get isShowGenerateOption() {
    return (
      this.generateOption &&
      generateOptions.length > 0 &&
      this.showGeneratedOptions
    );
  }

  get isShowPMDescription() {
    return (
      (this.isShowGenerateOption &&
        this.generateOption?.value === GENERATE_OPTION.TELL_AI) ||
      !this.isShowGenerateOption
    );
  }

  get isLastMsgFromPM() {
    return Boolean(
      !this.chatGptService.getLastMsgFromCurrentConversation().length
    );
  }

  get upgrageMessageAction() {
    return this.placement === AISETTING_PLACEMENT.MSG_MODAL
      ? this.actionShowMessageTooltip.AI_WRITE_TASK_MESSAGE
      : this.placement === AISETTING_PLACEMENT.TASK_EDITOR
      ? this.actionShowMessageTooltip.AI_WRITE_TASK_TEMPLATE
      : this.actionShowMessageTooltip.AI_WRITE_REPLY;
  }

  getEventTypes() {
    let codes = this.chatGptService.codeOptions?.value ?? [];
    return codes
      .filter(
        (item) =>
          item &&
          !this.basisCodes.includes(item.title) &&
          this.calendarCodes.includes(item.title)
      )
      .map((item) => this.convertToSnakeCase(item.title));
  }

  getActionTypes() {
    let codes = this.chatGptService.codeOptions?.value ?? [];
    let ignoreCodes = [...this.basisCodes, ...this.calendarCodes];
    return codes
      .filter((item) => item && !ignoreCodes.includes(item.title))
      .map((item) => this.convertToSnakeCase(item.title));
  }

  convertToSnakeCase(str: string): string {
    str = str.trim();
    str = str.replace(/[\s\W]+/g, '_');
    str = str.toUpperCase();
    return str;
  }

  handleSettingsTrigger(event: SETTING_EVENT) {
    if (event === SETTING_EVENT.CANCEL) {
      this.showPopover = false;
    }
    this.isShowSetting = !this.isShowSetting;
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    switch (this.placement) {
      case AISETTING_PLACEMENT.TASK_EDITOR:
        this.generateInTaskEditor();
        break;

      case AISETTING_PLACEMENT.INLINE_MESSAGE:
        this.generateInline();
        break;

      case AISETTING_PLACEMENT.MSG_MODAL:
        this.generateInSendMsgModal();
        break;

      default:
        break;
    }
    this.showPopover = !this.form.valid;
    if (!this.showPopover && this.fromMore) {
      this.hidePopover.emit();
    }
  }

  generateInline() {
    if (this.generateOption?.value === GENERATE_OPTION.BASE_ON_MSG) {
      this.description.reset('');
    }
    this.chatGptService.generateBody.next({
      ...this.chatGptService.generateBody.value,
      description: this.description.value
    });
    const isTellAIToGenerate =
      this.isLastMsgFromPM &&
      this.generateOption?.value === GENERATE_OPTION.TELL_AI;
    if (isTellAIToGenerate) {
      const currentConversation =
        this.taskService.currentTask$.value?.conversations?.[0];
      this.chatGptService.generateBody.next({
        ...this.chatGptService.generateBody.value,
        description: this.description.value,
        message: this.description.value,
        conversationId: currentConversation?.id,
        receiveUserId: currentConversation?.userId
      });
    }
    this.chatGptService.generateBody.next({
      ...this.chatGptService.generateBody.value,
      description: this.description.value,
      message: this.description.value
    });
    this.chatGptService.enableGenerate.next(true);
    this.chatGptService.cancelChatGpt.next(false);
    this.chatGptService.showPopover$.next(false);
    this.chatGptService.onGenerate.next({
      enable: true,
      skipValidate: true,
      show: true,
      isTellAIToGenerate
    });
  }

  generateInTaskEditor() {
    this.communicationFormService.isSubmittedAiGenerateMsgCopyForm = true;
    const body = this.formatBody(this.communicationForm.value);
    this.chatGptService
      .generateMessageCopy(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (!data) {
            this.toastService.error(
              'AI failed to generate reply. Please try again.'
            );
            return;
          }
          this.communicationForm.get('messageCopy').setValue(data.content);
          this.communicationForm.get('emailTitle').setValue(data.emailTitle);
        },
        error: (err) => {
          this.toastService.error(
            'AI failed to generate reply. Please try again.'
          );
        },
        complete: () => {
          this.form.reset();
        }
      });
  }

  generateInSendMsgModal() {
    this.chatGptService.generateBody.next({
      ...this.chatGptService.generateBody.value,
      description: this.description.value
    });
    this.chatGptService.onLoading.next({
      type: EBoxMessageType.POPUP,
      status: true
    });

    let selectedReceivers =
      this.trudiSendMsgFormService.sendMsgForm.value.selectedReceivers;
    let receiveUserIds = [] as string[];
    if (selectedReceivers.length > 0) {
      let listReceivers = selectedReceivers
        .map((item) => item?.data)
        .flat()
        .filter(Boolean);

      if (!listReceivers.length) {
        listReceivers = selectedReceivers;
      }
      receiveUserIds = Array.from(
        new Set<string>(listReceivers.map((i) => i.id))
      );
    }
    this.chatGptService.cancelChatGpt.next(false);
    const config = this.trudiSendMsgService.configs.value;
    const { currentUserId, description, toneOfVoice } =
      this.chatGptService.generateBody.value;
    const isOpenedSendMsgFromTrudiButton = config?.trudiButton;
    const { propertyId, conversationId } = getServiceDataFromConfig(config);
    const msgModalPropertyId =
      this.trudiSendMsgFormService.property?.value?.id || '';
    const isSendBulk =
      [
        ECreateMessageFrom.MULTI_MESSAGES,
        ECreateMessageFrom.MULTI_TASKS
      ].includes(config.otherConfigs.createMessageFrom) ||
      !!this.trudiSendMsgService.configs.value?.otherConfigs
        ?.isCreateMessageType;
    let body = {
      propertyId: isOpenedSendMsgFromTrudiButton
        ? propertyId
        : msgModalPropertyId,
      conversationId: isSendBulk ? null : conversationId || null,
      currentUserId,
      receiveUserIds: receiveUserIds,
      toneOfVoice,
      description,
      taskData: this.trudiSendMsgService.configs.value?.body?.taskData || {},
      messageId: config.body.replyToMessageId
    } as IGenerateSendMsgBody;
    if (
      [
        ECreateMessageFrom.MULTI_MESSAGES,
        ECreateMessageFrom.MULTI_TASKS,
        ECreateMessageFrom.CONTACT,
        ECreateMessageFrom.CALENDAR,
        ECreateMessageFrom.TASK_STEP
      ].includes(config.otherConfigs.createMessageFrom)
    ) {
      const selectedReceivers =
        this.trudiSendMsgFormService?.sendMsgForm?.value?.selectedReceivers;
      let sendToType: string[] = [];
      if (selectedReceivers) {
        selectedReceivers.map((item) => {
          if (item.group && !sendToType.includes(item.group)) {
            sendToType.push(item.group);
          }
        });
      }
      body = {
        ...body,
        sendToType,
        isSendBulkMessage: true
      };
    }
    this.chatGptService.onGenerate.next(null);
    this.chatGptService
      .generateSendMsg(body)
      .pipe(
        finalize(() => {
          this.chatGptService.onLoading.next({
            type: EBoxMessageType.POPUP,
            status: false
          });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res) {
            const lines = this.chatGptService.processContentAI(res.content);
            const paragraphs = lines.map((line: string) => `<p>${line}</p>`);
            const outputHTML = paragraphs.join('');
            const initAISummaryContent = HandleInitAISummaryContent(outputHTML);
            this.chatGptService.replyContent.next(initAISummaryContent);
            this.chatGptService.replyFrom.next(EBoxMessageType.POPUP);
          }
          const senderControl =
            this.trudiSendMsgFormService.sendMsgForm.get('selectedSender');
          const currentSender = senderControl.value as IFromUserMailBox;
          const { mailBoxId } = currentSender;
          const newSender =
            this.trudiSendMsgService.listSenderMailBoxBS.value.find(
              (senderMailBox) =>
                senderMailBox.id === currentUserId &&
                senderMailBox.mailBoxId === mailBoxId
            );
          if (newSender) {
            senderControl.setValue(newSender);
          }
        },
        error: () => {
          this.toastrService.error('Unable to create message');
        },
        complete: () => {}
      });
  }

  formatBody(communicationFormValue) {
    const { stepName, stepType, sendTo, emailTitle } = communicationFormValue;
    const { toneOfVoice, currentUserId } =
      this.chatGptService.generateBody.value;
    return {
      sendToType: sendTo,
      stepType,
      stepName,
      emailTitle,
      description: this.form.get('description').value,
      taskData: {
        essentialData: {},
        listSupplier: []
      },
      eventTypes: this.getEventTypes(),
      actionTypes: this.getActionTypes(),
      currentUserId,
      toneOfVoice
    };
  }

  visibleChange($event: boolean) {
    if (this.form.invalid) {
      this.description.reset('');
    }
    this.showPopover = $event;
    if (this.showPopover) {
      this.messageCopyControl?.setValidators([]);
      this.messageCopyControl?.updateValueAndValidity();
      if (this.placement === AISETTING_PLACEMENT.INLINE_MESSAGE) {
        this.generateOptions[0].disabled = this.isLastMsgFromPM;
        if (this.generateOptions[0].disabled) {
          this.generateOption.setValue(GENERATE_OPTION.TELL_AI);
        }
      }
    }
    if (!this.showPopover && this.fromMore) this.hidePopover.emit();
  }

  toggleHelp() {
    this.showHelpPopover = false;
    this.updateIsShowAIIntroduce();
  }

  nzPopoverVisibleChange($event: boolean) {
    this.showHelpPopover = $event;
    this.showBtnTmp = !$event;
    this.updateIsShowAIIntroduce();
  }

  updateIsShowAIIntroduce() {
    this.agencyService
      .updateIsShowAIIntroduce({
        userId: localStorage.getItem('userId')
      })
      .subscribe();
  }

  ngOnDestroy(): void {
    if (!this.showPopover && this.popover) {
      this.popover.hide();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
