import { ConversationService } from '@services/conversation.service';
import { UPGRADE_REQUEST_SENT } from '@services/messages.constants';
import { SharedService } from '@services/shared.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import {
  CallTypeEnum,
  ECallTooltipType,
  EConfirmContactType,
  TaskStatusType,
  TaskType
} from '@shared/enum';
import { UserProperty } from '@shared/types/users-by-property.interface';
import {
  ETypeMessage,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  ECrmStatus,
  EOptionSendMessage,
  ETypePage
} from '@/app/user/utils/user.enum';
import { IUserPropertyV2, RMDisplayStatus } from '@/app/user/utils/user.type';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  OnDestroy,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { Subject, filter, takeUntil } from 'rxjs';
import {
  EAddOn,
  EAddOnType,
  EAgencyPlan
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ToastrService } from 'ngx-toastr';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { IParticipant } from '@shared/types/conversation.interface';
import { crmStatus } from '@/app/user/supplier/components/supplier-contact-search/supplier-contact-search.component';
import { MessageService } from '@services/message.service';
import { CompanyService } from '@services/company.service';
import { UserInfoDrawerService } from '@/app/user/shared/components/drawer-user-info/services/user-info-drawer.service';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import dayjs from 'dayjs';
import { TENANCY_STATUS } from '@services/constants';
import { UserTypeInPTPipe } from '@shared/pipes/user-type-in-pt.pipe';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { ISecondaryEmails } from '@shared/types/user.interface';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { PreventButtonService } from '@trudi-ui';
import { EAppMessageCreateType } from '@/app/dashboard/modules/inbox/modules/app-message-list/enum/message.enum';
import { Router } from '@angular/router';
import { AppMessageListService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-list.service';
import { TaskService } from '@services/task.service';
import { stringFormat } from '@core';
import { AppRoute } from '@/app/app.route';
import { EConversationStatus } from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';
import { HelperService } from '@services/helper.service';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';

@Component({
  selector: 'user-header-toolbar',
  templateUrl: './user-header-toolbar.component.html',
  styleUrls: ['./user-header-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserHeaderToolbarComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() userProperty: IUserPropertyV2;
  @Input() selectUserProperty: IUserPropertyV2;
  @Input() currentDataUser: UserProperty;
  @Input() openFrom: ETypePage;
  @Input() isAppMessage: boolean;
  @Input() isDisableActionByOffBoardStatus: boolean;
  @Input() isNotDetectedContact = false;

  public userTypeRM = USER_TYPE_IN_RM;
  public tenancyStatus = TENANCY_STATUS;
  public rmDisplayStatus = RMDisplayStatus;
  public isShowSendMessageModal: boolean = false;
  public isShowCallModal: boolean = false;
  public isShowPlanModal: boolean = false;
  public isRequestSent: boolean = false;
  public isTurnOnCall: boolean = false;
  public isTurnOnPhone: boolean = false;
  public isConsoleUser: boolean;
  public listMobileNumber: string[] = [];
  public selectedRoleParticipant: string = '';
  public currentMailboxId: string;
  public agencyPlans: EAgencyPlan;
  public typeOfCall: CallTypeEnum;
  public selectedParticipant;
  public currentConversation;
  public callTooltipType = {
    voice: ECallTooltipType.CALLING,
    video: ECallTooltipType.CALLING
  };
  public typeMessage = ETypeMessage;
  public ECrmStatus = ECrmStatus;
  public isIconSync: boolean = false;
  public status: string = '';
  public hasAvatar: boolean = false;
  public contactType: string = '';
  public isSupplierContact: boolean = false;
  public secondaryEmailMsg: ISecondaryEmails;
  public crmStatus = crmStatus;
  public crmStatusLabels: object = {};
  public isProgressCall: boolean = false;
  public isProgressCallTooltip: string = '';

  public readonly ETypePage = ETypePage;
  public readonly EUserPropertyType = EUserPropertyType;
  public readonly EConfirmContactType = EConfirmContactType;
  public hideSendMessageButton: boolean = false;
  public readonly EButtonType = EButtonType;
  public readonly EButtonTask = EButtonTask;
  public roleTenant = false;
  public openFromContactPage: boolean = false;
  private destroy$ = new Subject<void>();
  public isRmEnvironment: boolean = false;
  public isPTEnvironment: boolean = false;
  public isSendMessageOptionVisible: boolean = false;
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
  public EOptionSendMessage = EOptionSendMessage;
  public isInboxDetail: boolean = false;
  public isDisableSendMsg: boolean = false;

  constructor(
    private readonly sharedService: SharedService,
    private readonly conversationService: ConversationService,
    private readonly agencyService: AgencyService,
    private readonly inboxService: InboxService,
    private readonly toastService: ToastrService,
    private readonly messageService: MessageService,
    private readonly contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private readonly companyService: CompanyService,
    private readonly cdr: ChangeDetectorRef,
    private readonly userInfoDrawerService: UserInfoDrawerService,
    private readonly userTypeInPTPipe: UserTypeInPTPipe,
    private preventButtonService: PreventButtonService,
    private taskService: TaskService,
    private router: Router,
    private appMessageListService: AppMessageListService,
    private helperService: HelperService,
    private userProfileDrawerService: UserProfileDrawerService
  ) {}

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
      (changes['userProperty']?.currentValue ||
        changes['currentDataUser']?.currentValue) &&
      this.openFrom === ETypePage.TASK_DETAIL
    ) {
      if (!this.userProperty.user.email) {
        this.secondaryEmailMsg = this.userProperty.user.secondaryEmails.find(
          (e) => e.email === this.selectUserProperty.email
        );
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
        this.isProgressCall = res.isProgressCall;
        this.isProgressCallTooltip = this.isProgressCall
          ? 'User is in a call'
          : '';
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
    this.isInboxDetail = this.helperService.isInboxDetail;
    if (!this.taskService.currentTask$?.value?.property?.isTemporary) {
      this.isDisableSendMsg =
        this.taskService.currentTask$?.value?.property?.id !==
          this.currentDataUser?.propertyId && this.isAppMessage;
    }
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

  shouldHandleProcess(): boolean {
    return this.preventButtonService.shouldHandleProcess(
      EButtonTask.TASK_CREATE_MESSAGE,
      EButtonType.TASK
    );
  }

  handleOpenSendMessageModal(
    option: EOptionSendMessage = EOptionSendMessage.SEND_IN_INBOX
  ) {
    if (
      !this.shouldHandleProcess() ||
      (this.isAppMessage &&
        this.userProperty.crmStatus === ECrmStatus.DELETED) ||
      this.isDisableActionByOffBoardStatus ||
      (this.isDisableSendMsg && option === EOptionSendMessage.SEND_IN_TASK)
    ) {
      return;
    }
    this.isSendMessageOptionVisible = false;
    if (this.isAppMessage) {
      if (option === EOptionSendMessage.SEND_IN_TASK) {
        this.router
          .navigate([], { queryParams: { tab: EConversationStatus.open } })
          .then(() => {
            const prefixURL = stringFormat(
              AppRoute.TASK_DETAIL,
              this.taskService.currentTask$.getValue()?.id
            );
            this.router
              .navigateByUrl(
                `${prefixURL}/app-messages?appMessageCreateType=NEW_APP_MESSAGE`
              )
              .then(() => {
                this.appMessageListService.setPreFillCreateNewMessage({
                  receivers: [this.formatDataUser()],
                  isCreateMessageFromUserProfile: true
                });
              });
          });
        this.appMessageListService.setIsHiddenPanel(true);
      } else {
        this.router
          .navigate([], {
            queryParams: {
              appMessageCreateType: EAppMessageCreateType.NewAppMessage,
              status: TaskStatusType.inprogress,
              conversationId: null,
              taskId: null,
              mailBoxId:
                this.conversationService?.currentConversation?.value?.mailBoxId
            },
            queryParamsHandling: 'merge'
          })
          .then(() => {
            this.appMessageListService.setPreFillCreateNewMessage({
              receivers: [this.formatDataUser()],
              isCreateMessageFromUserProfile: true
            });
            this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
              false,
              null
            );
          });
      }
      this.appMessageListService.setIsCreateNewMessage(true);
      this.conversationService.setCurrentConversation(null);
      return;
    }

    const showMessageHasLinkedTask =
      this.taskService.currentTask$?.value?.conversations?.some(
        (conversation) =>
          conversation?.id ===
            this.conversationService?.currentConversation?.value?.id &&
          !!conversation?.linkedTask
      );

    const preFillModal = {
      ...this.sendMsgConfigs
    };
    const isTaskType =
      this.taskService.currentTask$?.value?.taskType === TaskType.MESSAGE;
    preFillModal['otherConfigs.filterSenderForReply'] =
      !isTaskType || (showMessageHasLinkedTask && isTaskType) ? false : true;
    preFillModal['otherConfigs.filterSenderForReplyInTask'] =
      !isTaskType || (showMessageHasLinkedTask && isTaskType) ? true : false;
    preFillModal['body.prefillToCcBccReceiversList'] = {
      to: [this.formatDataUser()]
    };
    preFillModal['header.title'] = '';
    preFillModal['body.prefillSender'] = this.currentDataUser?.id;
    preFillModal['body.prefillSender'] = this.currentDataUser?.id;
    const currentTask = this.taskService.currentTask$.getValue();
    if (option === EOptionSendMessage.SEND_IN_TASK) {
      const tasks = [
        {
          taskId: currentTask.id,
          propertyId: currentTask.property?.id
        }
      ];
      preFillModal['otherConfigs.isReplyAction'] = true;
      preFillModal['otherConfigs.createMessageFrom'] =
        ECreateMessageFrom.TASK_HEADER;
      preFillModal['inputs.selectedTasksForPrefill'] = tasks;
      preFillModal['otherConfigs.isCreateMessageType'] = false;
    }
    if (
      !currentTask?.property.isTemporary &&
      option === EOptionSendMessage.SEND_IN_TASK
    ) {
      preFillModal['header.hideSelectProperty'] = true;
      preFillModal['header.showDropdown'] = false;
      preFillModal['otherConfigs.conversationPropertyId'] =
        currentTask.property.id || currentTask.propertyId || null;
    } else {
      preFillModal['otherConfigs.conversationPropertyId'] =
        this.openFrom === ETypePage.TASK_DETAIL
          ? this.userProperty.property?.id || null
          : this.currentDataUser?.propertyId || null;
      preFillModal['header.isPrefillProperty'] = false;
    }
    this.userInfoDrawerService.openSendMsg({
      state: true,
      id: this.currentDataUser?.id,
      modal: preFillModal,
      typeSend: option
    });
  }

  formatDataUser() {
    const formattedData = {
      ...this.currentDataUser,
      userType: this.currentDataUser?.type,
      userId: this.currentDataUser?.userId || this.currentDataUser?.id,
      userPropertyId:
        this.userProperty?.id || this.currentDataUser?.userPropertyId
    };

    if (this.openFrom === ETypePage.TASK_DETAIL) {
      Object.assign(formattedData, { type: this.userProperty.type });
    }

    if (this.secondaryEmailMsg && this.openFrom === ETypePage.TASK_DETAIL) {
      Object.assign(formattedData, {
        email: this.secondaryEmailMsg.email,
        secondaryEmailId: this.secondaryEmailMsg.id
      });
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

  extractKeyword(input: string): string | null {
    const regex = /(?:_)([^_]+)$/;
    const match = input.match(regex);
    return match ? match[1] : null;
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
        this.isIconSync = !this.currentDataUser?.isSystemCreate;
        userStatus =
          this.crmStatusLabels[
            this.currentDataUser?.status || this.currentDataUser?.displayStatus
          ];
        contactType = this.currentDataUser?.type;
        break;
      case ETypePage.OTHER:
        this.isIconSync = false;
        contactType = this.currentDataUser?.contactType;
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

        this.isIconSync = !this.currentDataUser?.isSystemCreate;
        this.isSupplierContact =
          this.userProperty.userType === EUserPropertyType.SUPPLIER;
        contactType =
          this.currentDataUser?.type === EUserPropertyType.LEAD
            ? this.currentDataUser?.title
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
        this.isIconSync = !this.currentDataUser?.isSystemCreate;
        userStatus =
          this.currentDataUser?.displayStatus || this.currentDataUser?.status;
        contactType = this.userTypeRM.LANDLORD_PROSPECT;
        break;
      case ETypePage.TENANTS_PROSPECT:
        this.isIconSync = !this.currentDataUser?.isSystemCreate;
        userStatus =
          this.currentDataUser?.displayStatus || this.currentDataUser?.status;
        contactType = this.userTypeRM.TENANT_PROSPECT;
        break;
      default:
        userStatus =
          this.currentDataUser.displayStatus || this.currentDataUser?.status;
        contactType = this.currentDataUser?.type;

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

  handlePhoneCall() {
    this.userInfoDrawerService.openCallRequest({
      state: true,
      typeCall: CallTypeEnum.voiceCall,
      user: this.userProperty,
      callTo: this.contactType,
      listMobileNumber: [
        this.currentDataUser?.phoneNumber,
        ...(this.currentDataUser?.mobileNumber?.filter(
          (p) => p !== this.currentDataUser?.phoneNumber
        ) || []),
        ...(this.currentDataUser?.secondaryPhones || []).map(
          (p) => p.phoneNumber
        )
      ]
    });
  }

  handleVideoCall() {
    if (
      this.isProgressCall ||
      (this.isAppMessage &&
        this.userProperty.crmStatus === ECrmStatus.DELETED) ||
      this.isDisableActionByOffBoardStatus
    ) {
      return;
    }

    this.userInfoDrawerService.openCallRequest({
      state: true,
      typeCall: CallTypeEnum.videoCall,
      user: this.userProperty,
      callTo: `${this.currentDataUser?.fullName} (${this.contactType})`.trim(),
      listMobileNumber: [this.currentDataUser?.phoneNumber]
    });
  }

  handleUpgradePlan(template: ECallTooltipType) {
    switch (template) {
      case ECallTooltipType.VIDEO_CALL_ADMIN:
      case ECallTooltipType.VOICE_CALL_ADMIN:
        this.userInfoDrawerService.openUpgradePlan({ state: true });
        break;
      case ECallTooltipType.VIDEO_CALL_MENBER:
        if (this.isConsoleUser) return;
        this.conversationService
          .sendMailRequestFeature(EAddOn.MOBILE_APP, this.currentMailboxId)
          .subscribe(() => {
            this.toastService.success(UPGRADE_REQUEST_SENT);
          });
        break;
      case ECallTooltipType.VOICE_CALL_MENBER:
        if (this.isConsoleUser) return;
        this.conversationService
          .sendMailRequestFeature(EAddOn.OUTGOING_CALLS, this.currentMailboxId)
          .subscribe(() => {
            this.toastService.success(UPGRADE_REQUEST_SENT);
          });
        break;
    }
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
