import { Component, OnDestroy, OnInit } from '@angular/core';
import { IAgencySettingTab } from '@trudi-ui';
import { CurrentUser } from '@shared/types/user.interface';
import { UserService } from '@/app/dashboard/services/user.service';
import { Subject, combineLatest, distinctUntilChanged, takeUntil } from 'rxjs';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { PermissionService } from '@services/permission.service';
import { ERole } from '@/app/auth/auth.interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import {
  EAddOn,
  EAddOnType,
  EAgencyPlan
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ConversationService } from '@services/conversation.service';
import { ToastrService } from 'ngx-toastr';
import { UPGRADE_REQUEST_SENT } from '@/app/services/messages.constants';
import { EAgencySettingsTabTitle } from './utils/enum';
import { ActionLinkService } from '@/app/services/action-link.service';
import { Router } from '@angular/router';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AppRoute } from '@/app/app.route';
import { FacebookAccountService } from '@/app/dashboard/services/facebook-account.service';
import { EPageMessengerConnectStatus } from '@/app/dashboard/shared/types/facebook-account.interface';
import { WhatsappAccountService } from '@/app/dashboard/services/whatsapp-account.service';
import { WhatsAppConnectStatus } from '@/app/dashboard/shared/types/whatsapp-account.interface';

@Component({
  selector: 'agency-settings',
  templateUrl: './agency-settings.component.html',
  styleUrls: ['./agency-settings.component.scss']
})
export class AgencySettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject();
  currentUser: CurrentUser;
  currentRole: ERole | string;
  UserTypeEnum = UserTypeEnum;
  popupState = {
    plansSummary: false,
    requestSent: false,
    requestFromTab: false
  };
  agencyPlans: EAgencyPlan;
  public previousUrl = '';
  public currentMailboxId: string;
  isConnectWhatsAppScreen = false;
  isConnectFacebookScreen = false;

  agencyLogoTabs: IAgencySettingTab<Object>[] = [
    {
      label: 'COMPANY',
      tabs: [
        {
          title: 'Team',
          link: 'team',
          icon: 'usersOutline'
        },
        {
          title: 'Company details',
          link: 'agency-details',
          icon: 'buildingSetting'
        },
        {
          title: 'Billing',
          link: 'billing',
          icon: 'billingSetting'
        },
        {
          title: 'CRM Integrations',
          link: 'integrations',
          icon: 'linkSetting'
        },
        {
          title: 'Response times',
          link: 'response-time',
          icon: 'timeSetting'
        }
      ]
    },
    {
      label: 'AI & AUTOMATION',
      tabs: [
        {
          title: 'Tasks',
          link: 'task-editor/list',
          icon: 'taskNameSetting'
        },
        {
          title: 'Policies',
          link: 'policies',
          icon: 'documentSetting'
        }
      ]
    },
    {
      label: 'CHANNELS',
      tabs: [
        {
          title: 'Email',
          link: 'email-settings',
          icon: 'mailThin'
        },
        {
          title: 'Voicemail',
          link: 'voicemail',
          icon: 'voicemailSetting'
        },
        {
          title: 'SMS',
          link: 'sms',
          icon: 'smsSetting'
        },
        {
          title: 'Trudi® Mobile App',
          link: 'mobile-app/emergency-contacts',
          icon: 'smartphoneSetting'
        },
        {
          title: 'Messenger',
          link: 'messenger',
          icon: 'messengerSetting'
        },
        {
          title: 'WhatsApp',
          link: 'whatsapp',
          icon: 'Whatsapp'
        }
      ]
    }
  ];

  constructor(
    private userService: UserService,
    private permissionService: PermissionService,
    private conversationService: ConversationService,
    private toastService: ToastrService,
    private readonly agencyDashboardService: AgencyService,
    private actionLinkService: ActionLinkService,
    private router: Router,
    private inboxService: InboxService,
    private facebookAccountService: FacebookAccountService,
    private whatsAppAccountService: WhatsappAccountService
  ) {}

  ngOnInit(): void {
    this.currentRole = this.permissionService.getCurrentRole;
    const isMember = (this.currentRole as ERole) === ERole.MEMBER;
    if (isMember) this.handleHideTab(EAgencySettingsTabTitle.BILLING);

    this.userService
      .getUserDetail()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        const userType = res.type;
        this.currentUser = res;
        const isConsole = [
          UserTypeEnum.AGENT,
          UserTypeEnum.ADMIN,
          UserTypeEnum.SUPERVISOR
        ].includes(userType as UserTypeEnum);
      });

    this.agencyDashboardService.currentPlan$
      .pipe(takeUntil(this.destroy$))
      .subscribe((configPlan) => {
        if (!configPlan) return;
        this.agencyPlans = configPlan.plan;
        const isVoicemailEnabled = localStorage.getItem('isVoicemailEnabled');
        const isMobileAppEnabled =
          configPlan.features[EAddOnType.MOBILE_APP].state;

        const isSMSFeatureEnabled =
          configPlan.features[EAddOnType.SMS]?.state || false;

        this.agencyLogoTabs = this.agencyLogoTabs.map((item) => {
          return {
            ...item,
            tabs: item.tabs.map((tab) => {
              if (tab.title === EAgencySettingsTabTitle.VOICEMAIL) {
                return {
                  ...tab,
                  disabled: isVoicemailEnabled === 'false',
                  showTooltip: true
                };
              }
              return tab;
            })
          };
        });
        if (!isMobileAppEnabled) {
          this.handleHideTab(EAgencySettingsTabTitle.MOBILE_APP);
        }

        if (!isSMSFeatureEnabled) {
          this.handleHideTab(EAgencySettingsTabTitle.SMS);
        }
      });

    combineLatest([
      this.actionLinkService.previousUrl$.pipe(distinctUntilChanged()),
      this.facebookAccountService.currentPageMessengerActive$,
      this.whatsAppAccountService.currentPageWhatsappActive$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([url, pageFacebookConnected, pageWhatsAppConnected]) => {
        let backUrl = url;

        const isFacebookDisconnectedOrArchived =
          !pageFacebookConnected ||
          pageFacebookConnected?.status ===
            EPageMessengerConnectStatus.ARCHIVED;

        const isWhatsAppDisconnectedOrArchived =
          !pageWhatsAppConnected ||
          pageWhatsAppConnected?.status === WhatsAppConnectStatus.ARCHIVED;

        if (
          (isFacebookDisconnectedOrArchived &&
            url?.includes(AppRoute.FACEBOOK_MESSAGE_INDEX)) ||
          (isWhatsAppDisconnectedOrArchived &&
            url?.includes(AppRoute.WHATSAPP_MESSAGE_INDEX))
        ) {
          const urlObj = new URL(url, window.location.origin);
          urlObj.searchParams.delete('channelId');
          backUrl = urlObj.pathname + urlObj.search;
        }
        this.previousUrl = backUrl;
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentMailboxId) => {
        if (!currentMailboxId) {
          return this.inboxService.setCurrentMailBoxId(
            localStorage.getItem('mailBoxId')
          );
        }
        this.currentMailboxId = currentMailboxId;
      });
  }

  removeChannelIdFromUrl(url: string): string {
    const urlParts = url.split('&');
    const filteredUrlParts = urlParts.filter(
      (part) => !part.includes('channelId=')
    );
    return filteredUrlParts.join('&');
  }

  handleHideTab(tabId: EAgencySettingsTabTitle) {
    this.agencyLogoTabs = this.agencyLogoTabs.map((item) => {
      return {
        ...item,
        tabs: item.tabs.filter((tab) => tab.title !== tabId)
      };
    });
  }

  handlePopupState(state: {
    plansSummary?: boolean;
    requestSent?: boolean;
    requestFromTab?: boolean;
  }) {
    this.popupState = { ...this.popupState, ...state };
    if (state.requestSent && state.requestFromTab) {
      this.conversationService
        .sendMailRequestFeature(EAddOn.VOICE_MAIL, this.currentMailboxId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.toastService.success(UPGRADE_REQUEST_SENT);
        });
    }
  }

  handleClick() {
    if (this.previousUrl) {
      this.router.navigateByUrl(this.previousUrl);
    } else {
      this.router.navigate(['/dashboard', 'inbox']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
