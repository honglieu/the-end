import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { IUserPropertyV2, RMDisplayStatus } from '@/app/user/utils/user.type';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import { EPropertyProfileStep } from '@shared/components/property-profile/enums/property-profile.enum';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { ECrmStatus, ETypePage } from '@/app/user/utils/user.enum';
import {
  CallTypeEnum,
  ECallTooltipType,
  EConfirmContactType,
  EUserPropertyType,
  SocketType,
  TaskStatusType,
  TaskType
} from '@shared/enum';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ESentMsgEvent,
  ETypeMessage,
  ISendMsgResponseV2,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { TENANCY_STATUS } from '@services/constants';
import { EAddOnType } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ISecondaryEmails } from '@shared/types/user.interface';
import { filter, Subject, takeUntil } from 'rxjs';
import { SharedService } from '@services/shared.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { MessageService } from '@services/message.service';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { CompanyService } from '@services/company.service';
import { UserTypeInPTPipe } from '@shared/pipes/user-type-in-pt.pipe';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { IParticipant } from '@shared/types/conversation.interface';
import dayjs from 'dayjs';
import { crmStatus } from '@/app/user/supplier/components/supplier-contact-search/supplier-contact-search.component';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { TaskService } from '@services/task.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { ASSIGN_TO_MESSAGE } from '@services/messages.constants';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { ConversationService } from '@services/conversation.service';

@Component({
  selector: 'user-property-details-header',
  templateUrl: './user-property-details-header.component.html',
  styleUrls: ['./user-property-details-header.component.scss']
})
export class UserPropertyDetailsHeaderComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() userProperty: IUserPropertyV2;
  @Input() currentDataUser: UserProperty;
  @Input() openFrom: ETypePage;
  @Input() isAppMessage: boolean;

  public userTypeRM = USER_TYPE_IN_RM;
  public tenancyStatus = TENANCY_STATUS;
  public rmDisplayStatus = RMDisplayStatus;
  public isShowSendMessageModal: boolean = false;
  public isTurnOnCall: boolean = false;
  public isTurnOnPhone: boolean = false;
  public isConsoleUser: boolean;
  public currentMailboxId: string;
  public typeOfCall: CallTypeEnum;
  public currentConversation;
  public callTooltipType = {
    voice: ECallTooltipType.CALLING,
    video: ECallTooltipType.CALLING
  };
  public typeMessage = ETypeMessage;
  public isIconSync: boolean = false;
  public status: string = '';
  public hasAvatar: boolean = false;
  public contactType: string = '';
  public isSupplierContact: boolean = false;
  public secondaryEmailMsg: ISecondaryEmails;
  public crmStatus = crmStatus;
  public crmStatusLabels: object = {};

  public readonly ETypePage = ETypePage;
  public readonly EUserPropertyType = EUserPropertyType;
  public readonly EConfirmContactType = EConfirmContactType;
  public readonly EButtonType = EButtonType;
  public readonly EButtonTask = EButtonTask;
  public roleTenant = false;
  public openFromContactPage: boolean = false;
  public isContactVerifiedOTP: boolean;
  public isContactUnverifiedOTP: boolean;
  public isRmEnvironment: boolean = false;
  public isPTEnvironment: boolean = false;
  public sendMsgConfigs = {
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'footer.buttons.sendType': ISendMsgType.BULK,
    'body.prefillReceivers': true,
    'body.receiverTypes': true,
    'body.tinyEditor.attachBtn.disabled': false,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'body.receiver.prefillSelected': true,
    'body.isFromInlineMsg': false,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.SCRATCH,
    'otherConfigs.isForwardConversation': false,
    'otherConfigs.isCreateMessageType': true,
    'otherConfigs.isForwardOrReplyMsg': true,
    'otherConfigs.isShowGreetingContent': true,
    'inputs.openFrom': TaskType.MESSAGE
  };
  private destroy$ = new Subject<void>();

  constructor(
    private readonly sharedService: SharedService,
    private readonly agencyService: AgencyService,
    private readonly inboxService: InboxService,
    private readonly messageService: MessageService,
    private readonly contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private readonly companyService: CompanyService,
    private readonly cdr: ChangeDetectorRef,
    private readonly userTypeInPTPipe: UserTypeInPTPipe,
    public readonly voicemailInboxService: VoiceMailService,
    private readonly toastCustomService: ToastCustomService,
    public readonly propertyProfileService: PropertyProfileService,
    private taskService: TaskService,
    private _messageFlowService: MessageFlowService,
    private conversationService: ConversationService
  ) {}

  handleBack(): void {
    const currentStep = this.propertyProfileService.getCurrentStep();
    const isRM =
      this.propertyProfileService.getCurrentCompany()?.CRM ===
      ECrmSystemId.RENT_MANAGER;
    if (currentStep === EPropertyProfileStep.OWNERSHIP_DETAIL || isRM) {
      this.propertyProfileService.navigateToStep(
        EPropertyProfileStep.PROPERTY_DETAIL
      );
    } else {
      const tenancyId = this.userProperty?.idUserPropertyGroup
        ? this.userProperty?.idUserPropertyGroup
        : this.propertyProfileService.getCurrentTenancy();

      this.propertyProfileService.navigateToStep(
        EPropertyProfileStep.TENANCY_DETAIL,
        tenancyId
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['openFrom']?.currentValue &&
      this.openFrom !== ETypePage.TASK_DETAIL
    ) {
      this.hasAvatar = [
        ETypePage.LANLORDS_PROSPECT,
        ETypePage.TENANTS_LANLORDS,
        ETypePage.TENANTS_PROSPECT
      ].includes(this.openFrom);

      this.openFromContactPage = [
        ETypePage.LANLORDS_PROSPECT,
        ETypePage.TENANTS_LANLORDS,
        ETypePage.TENANTS_PROSPECT,
        ETypePage.SUPPLIER,
        ETypePage.TENANTS_LANLORDS_PT,
        ETypePage.TENANTS_LANLORDS_RM,
        ETypePage.OTHER
      ].includes(this.openFrom);
    }

    if (
      changes['userProperty']?.currentValue ||
      changes['currentDataUser']?.currentValue
    ) {
      if (
        !this.userProperty?.user?.email &&
        this.userProperty?.user?.secondaryEmails?.length > 0
      ) {
        this.secondaryEmailMsg = this.userProperty.user.secondaryEmails?.[0];
      }
      this.handleMapDataByPage();
    }

    this.roleTenant =
      [
        EConfirmContactType.TENANT,
        EConfirmContactType.TENANT_PROPERTY,
        EConfirmContactType.TENANT_PROSPECT,
        EConfirmContactType.TENANT_UNIT
      ].includes(this.userProperty?.type as EConfirmContactType) ||
      this.openFrom === ETypePage.TENANTS_PROSPECT;
  }

  ngOnInit(): void {
    this.agencyService.currentPlan$
      .pipe(
        takeUntil(this.destroy$),
        filter((configPlan) => !!configPlan)
      )
      .subscribe((configPlan) => {
        if (!configPlan) return;
        this.isTurnOnPhone =
          configPlan.features[EAddOnType.OUTGOING_CALLS].state;
        this.isTurnOnCall = configPlan.features[EAddOnType.MOBILE_APP].state;
        this.cdr.markForCheck();
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentMailboxId) => {
        this.currentMailboxId = currentMailboxId;
      });

    this.messageService.callButtonData
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.callTooltipType = res.isProgressCall
          ? {
              voice: ECallTooltipType.CALLING,
              video: ECallTooltipType.CALLING
            }
          : {
              ...res.callTooltipType,
              voice:
                res.callTooltipType.voice ??
                (res.callBtnTooltip ? ECallTooltipType.DEFAULT : null)
            };
      });
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment = this.companyService.isRentManagerCRM(company);
        this.isPTEnvironment = this.companyService.isPropertyTreeCRM(company);
        this.handleMapDataByPage();
      });
    this.handleMapPTContactType();

    this.voicemailInboxService.currentVoicemailConversation$
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentVoicemailConversation) => {
        const {
          isUnVerifiedPhoneNumber,
          propertyIdSelected,
          userIdSelected,
          isProvidedOtp
        } = currentVoicemailConversation?.trudiResponse?.data?.[0].body || {};
        const isContactSelected =
          propertyIdSelected === this.currentDataUser.propertyId &&
          userIdSelected === this.currentDataUser.id;
        this.isContactVerifiedOTP =
          isContactSelected && !isUnVerifiedPhoneNumber && isProvidedOtp;
        this.isContactUnverifiedOTP =
          isContactSelected && isUnVerifiedPhoneNumber && isProvidedOtp;
      });
  }

  handleMapPTContactType() {
    if (!this.isPTEnvironment || this.openFrom === ETypePage.TASK_DETAIL)
      return;
    this.userProperty = {
      ...this.userProperty,
      displayType: this.userTypeInPTPipe.transform(
        this.userProperty?.contactType?.['displayType'] || '',
        true,
        {
          contactType: this.userProperty?.contactType?.type,
          isPrimary: this.userProperty?.['isPrimary'],
          type: this.userProperty?.['type']
        },
        false
      )
    };
  }

  handleOpenSendMessageModal() {
    const showMessageHasLinkedTask =
      this.taskService.currentTask$?.value?.conversations?.some(
        (conversation) =>
          conversation?.id ===
            this.conversationService?.currentConversation?.value?.id &&
          !!conversation?.linkedTask
      );
    const isTaskType =
      this.taskService.currentTask$?.value?.taskType === TaskType.MESSAGE;
    const preFillModal = {
      ...this.sendMsgConfigs
    };
    preFillModal['otherConfigs.filterSenderForReply'] =
      !isTaskType || (showMessageHasLinkedTask && isTaskType) ? false : true;
    preFillModal['otherConfigs.filterSenderForReplyInTask'] =
      !isTaskType || (showMessageHasLinkedTask && isTaskType) ? true : false;
    preFillModal['body.prefillToCcBccReceiversList'] = {
      to: [this.formatDataUser()]
    };
    preFillModal['header.title'] = '';
    preFillModal['body.prefillSender'] = this.userProperty?.user?.id;
    preFillModal['otherConfigs.conversationPropertyId'] =
      this.openFrom === ETypePage.TASK_DETAIL
        ? this.userProperty.property?.id || null
        : this.userProperty?.propertyId || null;
    preFillModal['body.prefillSender'] = this.userProperty?.user?.id;
    this._messageFlowService
      .openSendMsgModal(preFillModal)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.MessageSent:
            this.onSendMsgModal(rs.data);
            break;
          default:
            break;
        }
      });
  }

  onSendMsgModal(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        if (event?.isDraft) {
          return;
        }
        if (event?.type && event?.type === ISendMsgType.SCHEDULE_MSG) {
          this.toastCustomService.handleShowToastForScheduleMgsSend(event);
        } else {
          const dataForToast = {
            conversationId:
              event.data?.[0]?.conversationId ||
              (event.data as ISendMsgResponseV2)?.conversation?.id ||
              (event.data as any)?.jobReminders?.[0]?.conversationId,
            taskId:
              event.data?.[0]?.taskId ||
              (event.data as ISendMsgResponseV2)?.task?.id ||
              (event.data as any)?.jobReminders?.[0]?.taskId,
            isShowToast: true,
            type:
              event?.type === ISendMsgType.SCHEDULE_MSG
                ? SocketType.send
                : SocketType.newTask,
            mailBoxId: event.mailBoxId || (event.data as any)?.mailBoxId,
            taskType: TaskType.MESSAGE,
            pushToAssignedUserIds: [],
            status:
              event.data?.[0]?.messageType ||
              (event.data as ISendMsgResponseV2)?.task?.status ||
              event.data?.[0]?.status ||
              TaskStatusType.inprogress
          };
          this.toastCustomService.openToastCustom(
            dataForToast,
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );
        }
        this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE, {
          enableHtml: true
        });
        break;
      default:
        break;
    }
  }
  formatDataUser() {
    const formattedData = {
      ...this.currentDataUser,
      ...this.userProperty?.user,
      userPropertyContactType: this.userProperty.contactType,
      userPropertyType: this.userProperty.type,
      userType: this.currentDataUser?.type || this.userProperty?.userType,
      userId: this.currentDataUser?.userId || this.userProperty?.user?.id,
      propertyId: this.propertyProfileService.getPropertyId(),
      type: this.userProperty.type,
      userPropertyId:
        this.userProperty?.id || this.currentDataUser?.userPropertyId
    };

    if (this.secondaryEmailMsg) {
      if (!formattedData.email) {
        Object.assign(formattedData, {
          email: this.secondaryEmailMsg.email,
          secondaryEmailId: this.secondaryEmailMsg.id
        });
      } else {
        Object.assign(formattedData, {
          secondaryEmailId: this.secondaryEmailMsg.id
        });
      }
    }
    return formattedData;
  }

  mapFullNameUser(currentUser) {
    this.currentDataUser = {
      ...currentUser,
      fullName: this.sharedService.displayName(
        currentUser?.firstName,
        currentUser?.lastName
      )
    } as UserProperty;
  }

  handleMapDataByPage() {
    let userStatus = '';
    let contactType = '';
    switch (this.openFrom) {
      case ETypePage.TENANTS_LANLORDS:
        this.isIconSync = true;
        userStatus = this.handleStatus(this.userProperty.status);
        contactType = this.userProperty.userPropertyGroup.type;
        break;
      case ETypePage.SUPPLIER:
        this.mapCrmStatusLabel();
        this.isSupplierContact = true;
        this.isIconSync = !this.currentDataUser.isSystemCreate;
        userStatus =
          this.crmStatusLabels[
            this.currentDataUser?.status || this.currentDataUser?.displayStatus
          ];
        contactType = this.currentDataUser.type;
        break;
      case ETypePage.OTHER:
        this.isIconSync = false;
        contactType = this.currentDataUser.contactType;
        break;
      case ETypePage.TASK_DETAIL:
        this.mapCrmStatusLabel();
        this.currentDataUser = {
          ...this.currentDataUser,
          isPrimary: this.userProperty.isPrimary,
          userPropertyContactType: this.userProperty.contactType,
          userPropertyType: this.userProperty.type
        };
        this.hasAvatar = ![
          EUserPropertyType.SUPPLIER,
          EUserPropertyType.OTHER
        ].includes(this.userProperty.userType as EUserPropertyType);

        this.isIconSync = !this.currentDataUser.isSystemCreate;
        this.isSupplierContact =
          this.userProperty.userType === EUserPropertyType.SUPPLIER;
        contactType =
          this.currentDataUser.type === EUserPropertyType.LEAD
            ? this.currentDataUser.title
            : this.contactTitleByConversationPropertyPipe.transform(
                this.currentDataUser as unknown as Partial<IParticipant>,
                {
                  isNoPropertyConversation: false,
                  isMatchingPropertyWithConversation: true,
                  showOnlyRole: true,
                  showFullContactRole: true
                }
              );
        userStatus =
          this.userProperty.userType === EUserPropertyType.OTHER ||
          this.userProperty.type === EUserPropertyType.LEAD
            ? ''
            : this.handleStatus(this.userProperty.status) ||
              this.userProperty?.userPropertyGroup?.status ||
              this.crmStatusLabels[
                this.currentDataUser?.status ||
                  this.userProperty.user.status ||
                  this.currentDataUser?.displayStatus
              ] ||
              this.currentDataUser?.displayStatus;
        userStatus =
          [ECrmStatus.PROSPECT, ECrmStatus.PROSPECT.toLowerCase()].includes(
            userStatus
          ) && !this.isRmEnvironment
            ? 'Prospective'
            : userStatus;
        break;
      case ETypePage.LANLORDS_PROSPECT:
        this.isIconSync = !this.currentDataUser.isSystemCreate;
        userStatus =
          this.currentDataUser.displayStatus || this.currentDataUser.status;
        contactType = this.userTypeRM.LANDLORD_PROSPECT;
        break;
      case ETypePage.TENANTS_PROSPECT:
        this.isIconSync = !this.currentDataUser.isSystemCreate;
        userStatus =
          this.currentDataUser.displayStatus || this.currentDataUser.status;
        contactType = this.userTypeRM.TENANT_PROSPECT;
        break;
      default:
        userStatus =
          this.currentDataUser?.displayStatus || this.currentDataUser?.status;
        contactType = this.currentDataUser.type;

        break;
    }
    this.status = userStatus;
    this.contactType = contactType;
    const currentDataUser =
      this.openFrom === ETypePage.TENANTS_LANLORDS
        ? this.userProperty.user
        : this.currentDataUser;
    this.mapFullNameUser(currentDataUser);
  }

  handleStatus(status: string) {
    if (this.isRmEnvironment) {
      return this.rmDisplayStatus[status] || status;
    }

    const vacateDate = this.userProperty?.userPropertyGroup?.lease?.vacateDate;
    if (status === ECrmStatus.ACTIVE && dayjs(vacateDate).isValid()) {
      if (dayjs().isAfter(dayjs(vacateDate))) {
        return this.tenancyStatus.vacated;
      }
      return this.tenancyStatus.vacating;
    } else if (status === ECrmStatus.PROSPECT) {
      return this.tenancyStatus.prospective;
    }

    return status;
  }

  mapCrmStatusLabel() {
    this.crmStatus.forEach(
      (status) => (this.crmStatusLabels[status.status] = status.text)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
