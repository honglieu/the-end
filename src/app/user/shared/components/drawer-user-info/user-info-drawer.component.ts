import { UserAgentApiService } from '@/app/user/services/user-agent-api.service';
import { EOptionSendMessage, ETypePage } from '@/app/user/utils/user.enum';
import { IUserPropertyV2 } from '@/app/user/utils/user.type';
import {
  animate,
  style,
  transition,
  state,
  trigger
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  filter,
  takeUntil,
  tap
} from 'rxjs';
import {
  ICallRequest,
  IExportConversation,
  ISendMsg,
  IUpgradePlan,
  IUserContact
} from '@/app/user/shared/interfaces/user-info-drawer.interfaces';
import { ConversationService } from '@services/conversation.service';
import { omit } from 'lodash-es';
import {
  ESentMsgEvent,
  ETypeMessage,
  ISendMsgResponseV2,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ASSIGN_TO_MESSAGE } from '@services/messages.constants';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { whiteListInUserInfoDrawer } from './constants/constants';
import { UserInfoDrawerService } from './services/user-info-drawer.service';
import {
  EConversationType,
  ECreatedFrom,
  EMessageComeFromType,
  EMessageType,
  EUserPropertyType,
  SocketType,
  TaskStatusType,
  TaskType,
  UserTypeEnum
} from '@shared/enum';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { CompanyService } from '@services/company.service';
import { IMessage } from '@shared/types/message.interface';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { trudiUserId } from '@/app/services/constants';
import { TaskItem } from '@shared/types/task.interface';
import { HelperService } from '@/app/services/helper.service';
import { EUserSendType } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.enum';

const NOTE_ZONE_TRANSITION = '.25s';

@Component({
  selector: 'user-info-drawer',
  templateUrl: 'user-info-drawer.component.html',
  styleUrls: ['user-info-drawer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('toTopFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          NOTE_ZONE_TRANSITION,
          style({ opacity: 1, transform: 'translateY(8px)' })
        )
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(8px)' }),
        animate(
          NOTE_ZONE_TRANSITION,
          style({ opacity: 0, transform: 'translateY(-10px)' })
        )
      ])
    ]),
    trigger('collapse', [
      transition(':enter', [
        style({ height: '0' }),
        animate(NOTE_ZONE_TRANSITION, style({ height: '108px' }))
      ]),
      transition(':leave', [
        style({ height: '108px' }),
        animate(NOTE_ZONE_TRANSITION, style({ height: '0' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('0.25s', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.25s', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('openClose', [
      state('false', style({ display: 'none', width: '0' })),
      state(
        'true',
        style({ display: 'flex', width: '372px', flexDirection: 'column' })
      ),
      transition('false <=> true', [animate('0.3s ease-out')])
    ])
  ]
})
export class UserInfoDrawerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() visible: boolean = false;
  @Input() openFrom: ETypePage;
  @Input() currentDataUser: IUserContact;
  @Input() isAppMessage: boolean;
  @Input() isSMSMessage: boolean;
  @Input() isWhatsApp: boolean;

  @Output() triggerCloseDrawer = new EventEmitter();

  @ViewChild('infinityScroll')
  infinityScroll: ElementRef<HTMLElement>;
  public listUser: IUserPropertyV2[] = [];
  public isLoading: boolean = true;
  public whiteListInUserInfoDrawer = whiteListInUserInfoDrawer;
  public exportConversationState: IExportConversation;
  public sendMsgState: ISendMsg;
  public callRequestState: ICallRequest;
  public upgradePlanState: IUpgradePlan;
  public isRmSystem: boolean = false;
  public companyId?: string;
  public disableExportButton: boolean = false;
  public isMailboxType: boolean = false;
  public isSender: boolean = false;
  public readonly EUserPropertyType = EUserPropertyType;
  public readonly ECreatedFrom = ECreatedFrom;
  public isDisableActionByOffBoardStatus: boolean;
  private destroy$ = new Subject<void>();

  readonly ETypePage = ETypePage;
  readonly ETypeMessage = ETypeMessage;
  readonly EUserSendType = EUserSendType;
  readonly EConversationType = EConversationType;
  public isTaskDetail: boolean;
  unhappyCaseContent: {
    title: string;
    description: string;
  };

  get isHiddenAddContactButton() {
    if (
      this.currentDataUser?.conversationType === EConversationType.SMS &&
      this.currentDataUser?.pmNameClick
    ) {
      return false;
    }

    return (
      this.listUser.length &&
      this.currentDataUser?.userSendType !== EUserSendType.PAGE &&
      (!this.currentDataUser?.isAppUser ||
        [
          EConversationType.VOICE_MAIL,
          EConversationType.SMS,
          EConversationType.WHATSAPP
        ].includes(
          this.currentDataUser?.conversationType as EConversationType
        ) ||
        (this.currentDataUser?.conversationType ===
          EConversationType.MESSENGER &&
          this.currentDataUser.isUserVerified))
    );
  }

  constructor(
    private readonly userAgentApiService: UserAgentApiService,
    private readonly conversationService: ConversationService,
    private readonly toastCustomService: ToastCustomService,
    private readonly agencyService: AgencyService,
    private readonly userInfoDrawerService: UserInfoDrawerService,
    private readonly cdr: ChangeDetectorRef,
    private readonly messageFlowService: MessageFlowService,
    private readonly companyService: CompanyService,
    private readonly userProfileDrawerService: UserProfileDrawerService,
    private helper: HelperService
  ) {}

  ngOnInit(): void {
    this.companyService.getCurrentCompany().subscribe((company) => {
      this.isRmSystem = this.agencyService.isRentManagerCRM(company);
      this.companyId = company.id;
    });

    this.conversationService
      .getParticipantChanged()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.currentDataUser = {
          ...this.currentDataUser,
          ...omit(res, [
            'email',
            'conversationId',
            'isReassign',
            'oldUserId',
            'createdAt'
          ])
        };

        if (this.currentDataUser && this.visible) {
          this.handleTaskDetail();
        }
      });

    this.agencyService.currentPlan$
      .pipe(
        takeUntil(this.destroy$),
        filter((configPlan) => !!configPlan)
      )
      .subscribe((configPlan) => {
        if (!configPlan.plan) return;
        this.userInfoDrawerService.openUpgradePlan({
          plan: configPlan.plan
        });
      });

    this.userInfoDrawerService.exportConversation$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => (this.exportConversationState = data));

    this.userInfoDrawerService.sendMsg$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.sendMsgState = data;
        if (!data.state) return;
        this.messageFlowService
          .openSendMsgModal(data.modal as Record<string, unknown>)
          .pipe(takeUntil(this.destroy$))
          .subscribe((rs) => {
            switch (rs.type) {
              case ESendMessageModalOutput.MessageSent:
                this.onSendMsgModal(rs.data);
                break;
              case ESendMessageModalOutput.Quit:
                this.onCloseMultiModal();
                break;
              default:
                break;
            }
          });
      });

    this.userInfoDrawerService.callRequest$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => (this.callRequestState = data));

    this.userInfoDrawerService.upgradePlan$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => (this.upgradePlanState = data));

    this.userInfoDrawerService.deletedUserForSms$
      .pipe(filter(Boolean), takeUntil(this.destroy$))
      .subscribe((currentDataUser) => {
        this.deleteContactSms(currentDataUser);
      });

    this.userInfoDrawerService.deletedUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((userId) => {
        if (this.openFrom === ETypePage.TASK_DETAIL) {
          this.listUser = this.listUser.filter(
            (u) => ![u.userId, u.user.id].includes(userId)
          );

          if (
            this.currentDataUser &&
            this.visible &&
            [EConversationType.MESSENGER, EConversationType.WHATSAPP].includes(
              this.currentDataUser.conversationType
            )
          ) {
            this.handleTaskDetail();
          }
        }
      });

    this.conversationService.currentConversation
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentConversation) => {
        if (
          currentConversation &&
          [TaskStatusType.completed, TaskStatusType.resolved].includes(
            currentConversation.status
          )
        ) {
          this.isDisableActionByOffBoardStatus =
            currentConversation?.conversationType === EConversationType.APP &&
            !!currentConversation?.offBoardedDate;
        }
      });
    this.isTaskDetail = this.helper.isInboxDetail;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['visible']?.previousValue !== changes['visible']?.currentValue
    ) {
      this.isLoading = true;
    }
    if (this.currentDataUser && this.visible) {
      const {
        userType,
        pmUserId,
        isSender,
        sendFromUserType,
        isBlockNumber,
        conversationType
      } = this.currentDataUser || {};
      this.isMailboxType = userType === EUserPropertyType.MAILBOX;
      this.isSender = isSender;
      this.unhappyCaseContent = this.setUnhappyCaseContent(conversationType);

      if (
        ((isSender
          ? this.isMailboxType && pmUserId === trudiUserId
          : this.isMailboxType) &&
          !this.isAppMessage) ||
        (sendFromUserType === UserTypeEnum.MAILBOX && this.isMailboxType) ||
        isBlockNumber
      ) {
        this.listUser = [];
        this.isLoading = false;
        return;
      }

      switch (this.openFrom) {
        case ETypePage.TASK_DETAIL:
          this.handleTaskDetail();
          break;
        case ETypePage.TENANTS_LANLORDS:
          this.handleTenantsLandlords();
          break;
        default:
          this.isLoading = false;
          break;
      }
    } else {
      if (this.visible) {
        this.listUser = [];
      }
      this.unhappyCaseContent = null;
      this.isLoading = false;
    }
  }

  private setUnhappyCaseContent(conversationType: EConversationType): {
    title: string;
    description: string;
  } {
    const ConversationTypeLabels = {
      [EConversationType.SMS]: 'user',
      [EConversationType.WHATSAPP]: 'user',
      [EConversationType.MESSENGER]: 'user',
      [EConversationType.VOICE_MAIL]: 'phone number',
      DEFAULT: 'email address'
    };
    const mappedLabel =
      ConversationTypeLabels[conversationType] ||
      ConversationTypeLabels.DEFAULT;
    return {
      title: `We can't find this ${mappedLabel} in your database.`,
      description: `If you recognize this ${mappedLabel}, take a moment to assign a contact for faster recognition next time.`
    };
  }

  private handleTaskDetail(): void {
    const {
      email,
      userPropertyId,
      fromPhoneNumber,
      conversationType,
      pmName,
      pmUserId,
      channelUserId,
      emailVerified,
      conversationId,
      pmNameClick
    } = this.currentDataUser ?? {};

    const isFromVoicemail = conversationType === EConversationType.VOICE_MAIL;
    const isFromSMS = conversationType === EConversationType.SMS;
    const isFromFacebookMessages =
      conversationType === EConversationType.MESSENGER;
    const isFromWhatsApp = conversationType === EConversationType.WHATSAPP;
    let observable = this.userAgentApiService.getLinkedContactsByEmail(
      email,
      userPropertyId ?? null
    );

    let fetchSinglePM = false;

    if (conversationType === EConversationType.APP) {
      observable = this.userAgentApiService.getLinkedContactsByEmail(
        email,
        userPropertyId ?? null,
        conversationType
      );
    }

    if (isFromVoicemail) {
      observable =
        this.userAgentApiService.getLinkedContactsByPhone(fromPhoneNumber);
    }

    if (isFromFacebookMessages) {
      observable = this.userAgentApiService.getLinkedContactsByEmailForFBUser(
        emailVerified,
        userPropertyId,
        channelUserId
      );
    }

    if (pmName && pmUserId) {
      // for email channels
      observable = this.userAgentApiService.getTeamMember(pmUserId);
      fetchSinglePM = true;
    }

    if (isFromSMS || (isFromWhatsApp && !pmNameClick)) {
      observable =
        this.userAgentApiService.getLinkedContactsSms(conversationId);
    }

    if (
      pmNameClick &&
      (isFromWhatsApp || isFromFacebookMessages || isFromSMS)
    ) {
      // click on PM name
      //show other contact match with PM email
      observable = this.userAgentApiService.getLinkedContactsByEmail(
        email,
        userPropertyId ?? null,
        conversationType
      );
      fetchSinglePM = false;
    }

    this.fetchUserData(observable, email, fetchSinglePM);
  }

  private handleTenantsLandlords(): void {
    const { userPropertyId } = this.currentDataUser;
    const payload = [userPropertyId];
    const observable = this.userAgentApiService.getUserPropertyV2(payload);
    this.fetchUserData(observable);
  }

  handleGetUserProfileDrawer(data, email?: string, fetchSinglePM?: boolean) {
    let dataListUser = data;
    if (fetchSinglePM) {
      this.listUser = dataListUser ? [dataListUser] : [];
    } else {
      if (
        this.isAppMessage &&
        ![EUserPropertyType.LEAD, EUserPropertyType.MAILBOX]?.includes(
          this.currentDataUser.userType
        )
      ) {
        dataListUser = data.filter(
          (user) =>
            user?.userType === EUserPropertyType.USER &&
            user?.user?.email === email
        );
      }
      this.mapListUser(dataListUser);
      this.filterPMContacts();
    }
    if (this.infinityScroll?.nativeElement) {
      this.infinityScroll.nativeElement.scrollTop = 0;
    }
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  private fetchUserData(
    apiCall: Observable<IUserPropertyV2[]>,
    email?: string,
    fetchSinglePM?: boolean
  ): void {
    apiCall
      .pipe(
        distinctUntilChanged(),
        tap(() => {
          this.isLoading = true;
        }),
        takeUntil(this.destroy$),
        debounceTime(300),
        filter(Boolean)
      )
      .subscribe({
        next: (data) => {
          if (!data) return;
          this.handleGetUserProfileDrawer(data, email, fetchSinglePM);
          this.userProfileDrawerService.setTrigerRefreshListProperty(false);
        },
        error: () => {
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  mapListUser(data: IUserPropertyV2[]): void {
    this.listUser = data.map((item) => ({
      ...item,
      user: {
        ...item.user,
        propertyId:
          this.openFrom !== ETypePage.TASK_DETAIL
            ? this.currentDataUser.propertyId
            : item.property?.id,
        type:
          this.openFrom !== ETypePage.TASK_DETAIL
            ? this.currentDataUser.type
            : item.user?.type,
        conversationType: this.currentDataUser?.conversationType
      }
    }));
  }

  filterPMContacts() {
    if (this.openFrom === ETypePage.TASK_DETAIL && !this.isAppMessage) {
      const currentUserId =
        (this.currentDataUser as unknown as IMessage).messageType ===
        EMessageType.ticket
          ? (this.currentDataUser as unknown as IMessage).emailMetadata
              ?.from?.[0]?.userId
          : this.currentDataUser.userId;

      const matchedOnlyPM = this.listUser.every(
        (user) =>
          user.type === EUserPropertyType.LEAD &&
          ![user.userId, user.user?.id].includes(currentUserId)
      );

      if (matchedOnlyPM) {
        this.listUser = [];
      }
    }
  }

  handleAddContact() {
    this.messageFlowService.isAddContact.next(true);
    this.handleTaskDetail();
    this.userProfileDrawerService.setTrigerRefreshListProperty(true);
  }

  onCloseDrawer(): void {
    this.triggerCloseDrawer.emit();
    this.visible = false;
    this.listUser = [];
    this.isLoading = true;
  }

  exportConversationHistory() {
    this.disableExportButton = true;
    const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userPropertyId = this.exportConversationState.userPropertyId;

    this.conversationService
      .exportHistoryConversation(userPropertyId, clientTimeZone)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.disableExportButton = false;
          this.closeExportModal();
          this.cdr.markForCheck();
        },
        error: () => {
          this.disableExportButton = false;
          this.closeExportModal();
          this.cdr.markForCheck();
        }
      });
  }

  closeExportModal() {
    this.userInfoDrawerService.openExportConversation({
      state: false,
      userPropertyId: ''
    });
  }

  onSendMsgModal(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        if (event?.isDraft) {
          return;
        }
        if (event?.type && event?.type === ISendMsgType.SCHEDULE_MSG) {
          if (
            this.sendMsgState?.typeSend === EOptionSendMessage.SEND_IN_INBOX
          ) {
            this.toastCustomService.handleShowToastForScheduleMgsSend(event);
          } else {
            this.toastCustomService.handleShowToastMessSend(event);
          }
        } else {
          if (
            this.sendMsgState?.typeSend === EOptionSendMessage.SEND_IN_INBOX
          ) {
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
          } else {
            this.toastCustomService.handleShowToastMessSend(event);
          }
        }
        if (this.sendMsgState?.typeSend === EOptionSendMessage.SEND_IN_INBOX) {
          this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE, {
            enableHtml: true
          });
        }
        break;
      case ESentMsgEvent.COMPLETED:
        this.userInfoDrawerService.openSendMsg({ state: false });
        break;
      default:
        break;
    }
  }

  isTaskAssignedToAgent(task: TaskItem, agentId: string) {
    return (
      task?.assignToAgents.some(
        (el) => el.id === (agentId || localStorage.getItem('userId'))
      ) &&
      (task?.status === TaskStatusType.inprogress ||
        task?.status === TaskStatusType.completed)
    );
  }

  onChangePlanSummaryModal() {
    this.userInfoDrawerService.openUpgradePlan({
      state: false,
      stateRequestSend: true
    });
  }

  onCloseMultiModal() {
    this.userInfoDrawerService.closeMultiModal();
  }

  deleteContactSms(currentDataUser) {
    this.listUser = this.listUser?.map((item) => {
      const isCurrentDataUser =
        [item.userId, item.user.id].includes(currentDataUser.id) &&
        item.propertyId === currentDataUser.propertyId;
      return {
        ...item,
        user: {
          ...item.user,
          secondaryPhones: isCurrentDataUser
            ? currentDataUser.secondaryPhones
            : item.user.secondaryPhones,
          secondaryEmails: isCurrentDataUser
            ? currentDataUser.secondaryEmails
            : item.user.secondaryEmails
        }
      };
    });

    const listEmail = [
      currentDataUser?.email?.toLowerCase(),
      ...currentDataUser?.secondaryEmails?.map(({ email }) =>
        email?.toLowerCase()
      )
    ].filter(Boolean);
    const listPhoneNumber = [
      currentDataUser?.phoneNumber,
      ...currentDataUser?.secondaryPhones?.map(({ phoneNumber }) => phoneNumber)
    ].filter(Boolean);
    const hasPhone = listPhoneNumber.includes(
      this.currentDataUser?.fromPhoneNumber
    );
    const hasEmail = listEmail.includes(
      this.currentDataUser?.emailVerified?.toLowerCase()
    );

    if (!hasPhone && !hasEmail) {
      this.listUser = this.listUser.filter(
        (item) =>
          !(
            [item.userId, item.user.id].includes(currentDataUser.id) &&
            item.propertyId === currentDataUser.propertyId
          )
      );
      this.userProfileDrawerService.setTrigerRefreshListProperty(true);
    }
  }

  ngOnDestroy(): void {
    this.onCloseMultiModal();
    this.userProfileDrawerService.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
