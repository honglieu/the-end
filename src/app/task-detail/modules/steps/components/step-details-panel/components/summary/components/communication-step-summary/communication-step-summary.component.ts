import {
  EStepType,
  ETypeSend
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { CompanyEmailSignatureService } from '@/app/services/company-email-signature.service';
import { DialogService } from '@/app/services/dialog.service';
import {
  ContactTitleByConversationPropertyPipe,
  TrudiButtonEnumStatus
} from '@/app/shared';
import { ECtaOption } from '@/app/task-detail/modules/steps/components/cta-buttons/cta-buttons.component';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  IConversationParticipant,
  StepDetail,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import { MAP_TYPE_RECEIVER_TO_LABEL } from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit
} from '@angular/core';
import { Router } from '@angular/router';
import { PreviewEmailComponent } from './components/preview-email/preview-email.component';
import { ButtonKey, EButtonType, PreventButtonService } from '@trudi-ui';

@Component({
  selector: 'communication-step-summary',
  templateUrl: './communication-step-summary.component.html',
  styleUrl: './communication-step-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommunicationStepSummaryComponent implements OnInit {
  @Input() currentStep: TrudiStep & StepDetail = null;
  @Input() buttonKey: ButtonKey;
  removedRecipientTitle = 'This conversation is removed from task';

  unexecutedTitle: string;
  executedTitle: string;
  contacts: string;
  conversationRecipients: { toField: string; ccBcc: string }[];

  EStepStatus = TrudiButtonEnumStatus;

  constructor(
    private companyEmailSignatureService: CompanyEmailSignatureService,
    private dialogService: DialogService<PreviewEmailComponent>,
    private stepService: StepService,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private router: Router,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    if (this.currentStep.fields.typeSend === ETypeSend.SINGLE_EMAIL) {
      this.unexecutedTitle = 'Send single email to';
      this.executedTitle = `${
        this.currentStep.reminderTimes ? 'Scheduled for send' : 'Sent an'
      } email to:`;
    } else {
      this.unexecutedTitle = 'Send bulk emails to';
      this.executedTitle = this.currentStep.reminderTimes
        ? 'Scheduled for send'
        : this.currentStep.conversationParticipants?.length === 1
        ? 'Sent an email to:'
        : `Sent
       bulk ${this.currentStep.conversationParticipants?.length} emails to:`;
    }

    this.contacts = this.currentStep?.fields?.sendTo
      ?.map(
        (contact) =>
          MAP_TYPE_RECEIVER_TO_LABEL[contact]?.toLowerCase() || contact
      )
      .join(', ');

    this.conversationRecipients =
      this.currentStep.conversationParticipants?.map((conversation) => {
        return this.getRecipientFromConversation(conversation);
      });
  }

  getUserRole(participants, conversation) {
    const emailMetadataFiled = {
      ...participants,
      type: participants?.userType ?? ''
    };
    const userRole = this.contactTitleByConversationPropertyPipe.transform(
      emailMetadataFiled,
      {
        isNoPropertyConversation: conversation?.isTemporaryProperty,
        isMatchingPropertyWithConversation:
          conversation?.conversationPropertyId === participants?.propertyId,
        showOnlyRole: true,
        showFullContactRole: true,
        showCrmStatus: true
      }
    );

    return userRole;
  }

  getRecipientFromConversation(conversation: IConversationParticipant): {
    toField: string;
    ccBcc: string;
  } {
    const { to, cc, bcc } = conversation.participants;
    const userRole = this.getUserRole(to[0], conversation);
    const toField = to.length
      ? `${
          conversation?.conversationPropertyId
            ? to[0]?.firstName || to[0]?.lastName
            : to[0]?.originalEmailName || to[0]?.email
        } ${userRole ? `(${userRole})` : ''}`
      : '';

    const moreTo = to.length > 1 ? `+${to.length - 1}` : '';
    const ccField = cc.length ? `${cc.length} Cc` : '';
    const bccField = bcc.length ? `${bcc.length} Bcc` : '';
    const ccBcc = toField
      ? [moreTo, ccField, bccField].filter(Boolean).join(', ')
      : [ccField, bccField].filter(Boolean).join(', ');

    return {
      toField,
      ccBcc: toField && (moreTo || ccField || bccField) ? ', ' + ccBcc : ccBcc
    };
  }

  navigateToDetail(conversationId, isLinked) {
    if (!isLinked) {
      return;
    }

    const queryParams = {
      taskId: this.currentStep.taskId,
      conversationId
    };
    this.router.navigate(
      [`dashboard/inbox/detail/${this.currentStep.taskId}`],
      {
        queryParams
      }
    );
    this.stepService.updateShowStepDetailPanel(false);
  }

  openPreviewEmailModal() {
    this.stepService.disableTriggerDetailPanel$.next(true);
    this.dialogService
      .createDialog(PreviewEmailComponent, {
        emailSignature:
          this.companyEmailSignatureService.signatureContent.value,
        emailBody: this.currentStep.fields.msgBody,
        disabled: this.currentStep.disabled,
        currentStep: this.currentStep
      })
      .afterClose.subscribe((isExecute) => {
        this.stepService.disableTriggerDetailPanel$.next(false);
        if (isExecute) {
          if (!this.shouldHandleProcess()) return;
          this.stepService.setCtaButtonOption({
            stepId: this.currentStep.id,
            stepType: this.currentStep.stepType as EStepType,
            option: ECtaOption.EXECUTE
          });
          this.stepService.setCurrentStep(null);
        }
      });
  }

  shouldHandleProcess(): boolean {
    return this.preventButtonService.shouldHandleProcess(
      this.buttonKey,
      EButtonType.STEP
    );
  }
}
