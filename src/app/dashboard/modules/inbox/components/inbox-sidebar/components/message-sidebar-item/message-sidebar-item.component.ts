import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { IMessageRoute } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { EFolderType } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { SharedMessageViewService } from '@/app/services/shared-message-view.service';
import { IMailBox } from '@shared/types/user.interface';
import { TaskStatusType } from '@shared/enum';
import {
  FeaturesConfigPlan,
  IFeaturesConnectionStatus
} from '@/app/console-setting/agencies/utils/console.type';
import { EAddOnType } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { FacebookAccountService } from '@/app/dashboard/services/facebook-account.service';
import { FacebookOpenFrom } from '@/app/dashboard/shared/types/facebook-account.interface';
import { SharedService } from '@/app/services/shared.service';
import { PermissionService } from '@/app/services/permission.service';

@Component({
  selector: 'message-sidebar-item',
  templateUrl: './message-sidebar-item.component.html',
  styleUrls: ['./message-sidebar-item.component.scss']
})
export class MessageSidebarItemComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() item: IMessageRoute;
  @Input() routerLink: string = 'messages';
  @Input() mailbox: IMailBox;
  @Input() features: FeaturesConfigPlan;
  @Input() featuresConnectionStatus: IFeaturesConnectionStatus;
  @Output() onClick = new EventEmitter();
  public EMailBoxStatus = EMailBoxStatus;
  public showTotal: boolean = false;
  private destroy$ = new Subject<void>();
  public isAccountAdded: boolean;
  readonly EFolderType = EFolderType;
  readonly TaskStatusType = TaskStatusType;
  public queryParams: Params;
  public tooltipText: string = ``;
  public isShowWarning: boolean = false;
  public isConsole = false;
  public isPermissionEdit: boolean;

  get matchRouter(): boolean {
    const url = this.router?.url;
    let matchRouter =
      url.includes(`/${this.item?.routerLink}`) &&
      new URLSearchParams(url).get('mailBoxId') === (this.mailbox?.id || null);
    if (
      this.item?.routerLink === ERouterLinkInbox.MESSENGER ||
      this.item?.routerLink === ERouterLinkInbox.WHATSAPP
    ) {
      if (this.item?.channelId) {
        matchRouter =
          url.includes(`/${this.item?.routerLink}`) &&
          url.includes(this.item?.channelId);
      } else {
        matchRouter =
          url.includes(`/${this.item?.routerLink}`) &&
          !url.includes('channelId=');
      }
    }
    return matchRouter;
  }

  constructor(
    public inboxService: InboxService,
    private inboxSidebarService: InboxSidebarService,
    private router: Router,
    private sharedMessageViewService: SharedMessageViewService,
    private activatedRoute: ActivatedRoute,
    private readonly facebookAccountService: FacebookAccountService,
    private sharedService: SharedService,
    private permissionService: PermissionService
  ) {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.queryParams = params;
      });
  }

  ngOnInit(): void {
    this.inboxSidebarService
      .getAccountAdded()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isAccountAdded = res;
      });

    this.isConsole = this.sharedService.isConsoleUsers();
    this.handleFeature();
    this.checkPermission();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['features'] || changes['featuresConnectionStatus']) {
      this.handleFeature();
    }
  }

  handleFeature() {
    if (!this.features) return;
    const featureMap = {
      [EFolderType.VOICEMAIL_MESSAGES]: EAddOnType.VOICE_MAIL,
      [EFolderType.MESSENGER]: EAddOnType.MESSENGER,
      [EFolderType.APP_MESSAGES]: EAddOnType.MOBILE_APP,
      [EFolderType.SMS]: EAddOnType.SMS,
      [EFolderType.WHATSAPP]: EAddOnType.WHATSAPP
    };

    const tooltipTextMap = {
      [EAddOnType.VOICE_MAIL]: `Your Voicemail feature is turned OFF`,
      [EAddOnType.MESSENGER]: `Your Messenger feature is turned OFF`,
      [EAddOnType.MOBILE_APP]: `Your Trudi® app feature is turned OFF`,
      [EAddOnType.SMS]: `Your SMS feature is turned OFF`,
      [EAddOnType.WHATSAPP]: `Your WhatsApp feature is turned OFF`
    };
    const featureKey = featureMap[this.item?.folderType];
    if (
      featureKey &&
      ((!this.features[featureKey].state && this.features[featureKey]) ||
        (this.featuresConnectionStatus &&
          this.featuresConnectionStatus[featureKey] === false))
    ) {
      if (featureKey === EAddOnType.SMS && this.isConsole) {
        this.isShowWarning = false;
        this.tooltipText = '';
      } else {
        this.isShowWarning = true;
        this.tooltipText = !this.features[featureKey].state
          ? tooltipTextMap[featureKey]
          : '';
      }
    } else {
      this.isShowWarning = false;
      this.tooltipText = ``;
    }
  }

  handleClick(item) {
    if (!item) return;

    let queryParams = {
      channelId: this.item?.channelId || null,
      inboxType: this.queryParams['inboxType'],
      mailBoxId: this.mailbox?.id,
      status: TaskStatusType.inprogress,
      showMessageInTask: [
        ERouterLinkInbox.VOICEMAIL_MESSAGES,
        ERouterLinkInbox.SMS_MESSAGES,
        ERouterLinkInbox.APP_MESSAGES,
        ERouterLinkInbox.WHATSAPP,
        ERouterLinkInbox.MESSENGER
      ].includes(this.item?.routerLink as ERouterLinkInbox)
        ? undefined
        : this.queryParams['showMessageInTask'],
      search: this.queryParams['search']
    };

    this.router
      .navigate([`dashboard/inbox/${item.routerLink}/all`], {
        queryParams
      })
      .then(() => {
        this.sharedMessageViewService.setIsSelectingMode(false);
        this.onClick.emit(item);
      });
  }

  handleReconnectFacebookMessenger() {
    this.facebookAccountService.login(FacebookOpenFrom.inbox).subscribe();
  }

  checkPermission() {
    this.isPermissionEdit = this.permissionService.hasFunction(
      'COMPANY_DETAIL.PROFILE.EDIT'
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
