import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import {
  EAddOn,
  EPopupPlanState
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { ConversationService } from '@services/conversation.service';
import { GlobalService } from '@services/global.service';
import { UPGRADE_REQUEST_SENT } from '@services/messages.constants';
import { SharedService } from '@services/shared.service';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import { EActionShowMessageTooltip } from '@shared/enum/share.enum';
import { EUserPropertyType, UserTypeEnum } from '@shared/enum/user.enum';
import { IMailBox } from '@shared/types/user.interface';
import { CompanyService } from '@services/company.service';
@Component({
  selector: 'upgrade-message',
  templateUrl: './upgrade-message.component.html',
  styleUrls: ['./upgrade-message.component.scss']
})
export class UpgradeMessageComponent implements OnInit {
  @Input() action: string = '';
  @Input() isTooltip: boolean = false;
  @Input() isIcon: boolean = false;
  private unsubscribe = new Subject<void>();
  public companyId: string;
  public roleUser: string = '';
  public upgradeText: string = '';
  public message = {
    [EActionShowMessageTooltip.ADD_NEW_TASKS]: 'To add new tasks,',
    [EActionShowMessageTooltip.PUBLISH_TASKS]: 'To publish tasks,',
    [EActionShowMessageTooltip.EDIT_WORKFLOWS]: 'To edit workflows,',
    [EActionShowMessageTooltip.EDIT_TASK_NAME]: 'To edit task name,',
    [EActionShowMessageTooltip.EDIT_TASK_STATUS]: 'To edit task status,',
    [EActionShowMessageTooltip.ARCHIVE_TASKS]: 'To archive tasks,',
    [EActionShowMessageTooltip.MOVE_TASKS_TO_DRAFT]: 'To move tasks to draft,',
    [EActionShowMessageTooltip.AI_WRITE_REPLY]:
      'To have our AI write your reply,',
    [EActionShowMessageTooltip.GENERATE_YOUR_TASKS]:
      'To have our AI generate your tasks,',
    [EActionShowMessageTooltip.EDIT_SETTINGS]: 'To edit settings,',
    [EActionShowMessageTooltip.AI_WRITE_TASK_TITLES]:
      'To have our AI write your task titles,',
    [EActionShowMessageTooltip.AI_WRITE_TASK_TEMPLATE]:
      'To have our AI write your template,',
    [EActionShowMessageTooltip.AI_WRITE_TASK_MESSAGE]:
      'To have our AI write your message,'
  };
  public isConsole: boolean;
  public userType: string;
  public isAgentOrSupervisorConsole: boolean;
  public classStylesUpSellMessageText = {};
  public currentMailboxId: string;
  public isArchiveMailbox: boolean = false;
  public isDisconnected: boolean = false;
  public isDisconnectCompanyMailbox: boolean;
  public isDisableUpgradeMessage: boolean;
  public isUserRoleOwnerAdmin: boolean;
  public mailBox: IMailBox;
  constructor(
    private userService: UserService,
    private toastService: ToastrService,
    private readonly companyService: CompanyService,
    public conversationService: ConversationService,
    public globalService: GlobalService,
    public sharedService: SharedService,
    private inboxService: InboxService
  ) {}
  ngOnInit(): void {
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isArchiveMailbox) => {
        this.isArchiveMailbox = isArchiveMailbox;
      });
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isDisconnected) => {
        this.isDisconnected = isDisconnected;
      });

    this.isConsole = this.sharedService.isConsoleUsers();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        if (!company) return;
        this.companyId = company.id;
      });
    this.userService
      .getUserDetail()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((user) => {
        if (!user) return;
        this.userType = user.type;
        this.isAgentOrSupervisorConsole =
          this.isConsole &&
          [UserTypeEnum.AGENT, UserTypeEnum.SUPERVISOR].includes(
            this.userType as UserTypeEnum
          );
        this.roleUser = user?.companyAgents.find(
          (item) => item.companyId === this.companyId
        )?.role;
        this.isUserRoleOwnerAdmin = [
          EUserPropertyType.ADMIN,
          EUserPropertyType.OWNER
        ].includes(
          (this.roleUser as EUserPropertyType) ||
            (this.userType as EUserPropertyType)
        );
        this.inboxService.listMailBoxs$
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((listMailBox) => {
            this.mailBox = listMailBox.find(
              (item) => item?.status !== 'ARCHIVE' && item?.type === 'COMPANY'
            );
            this.isDisconnectCompanyMailbox =
              this.mailBox?.status === EMailBoxStatus.DISCONNECT;
          });
        this.upgradeText = this.isUserRoleOwnerAdmin
          ? 'upgrade your plan'
          : 'request plan upgrade';
      });
    this.isDisableUpgradeMessage = this.isUserRoleOwnerAdmin
      ? this.isDisconnectCompanyMailbox
      : this.isArchiveMailbox || this.isDisconnected;

    this.classStylesUpSellMessageText = {
      'font-size-12': this.isIcon,
      'text-underline': !this.isAgentOrSupervisorConsole,
      'cursor-pointer': !this.isAgentOrSupervisorConsole,
      'upgrade-message-text':
        !this.isAgentOrSupervisorConsole && !this.isTooltip,
      'upgrade-tooltip-disabled':
        this.isDisableUpgradeMessage && this.isTooltip,
      'upgrade-message-disabled':
        this.isDisableUpgradeMessage && !this.isTooltip
    };
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentMailboxId) => {
        if (!currentMailboxId) return;
        this.currentMailboxId = currentMailboxId;
      });
  }
  upgradePlan() {
    if (
      [EUserPropertyType.ADMIN, EUserPropertyType.OWNER].includes(
        (this.roleUser as EUserPropertyType) ||
          (this.userType as EUserPropertyType)
      )
    ) {
      this.globalService.setPopupPlanState(EPopupPlanState.SUMMARY_PLAN_POPUP);
    } else {
      if (this.isConsole) {
        return;
      }
      this.conversationService
        .sendMailRequestFeature(EAddOn.SUGGESTED_REPLIES, this.currentMailboxId)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (!res) return;
          this.toastService.success(UPGRADE_REQUEST_SENT);
        });
    }
  }
}
