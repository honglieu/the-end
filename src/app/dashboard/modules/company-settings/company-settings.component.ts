import { ERole } from '@/app/auth/auth.interface';
import {
  EAgencyPlan,
  EAddOn,
  EAddOnType
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ActionLinkService } from '@services/action-link.service';
import { ConversationService } from '@services/conversation.service';
import { UPGRADE_REQUEST_SENT } from '@services/messages.constants';
import { PermissionService } from '@services/permission.service';
import { UserTypeEnum } from '@shared/enum';
import { CurrentUser } from '@shared/types/user.interface';
import { IAgencySettingTab } from '@trudi-ui';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { EAgencySettingsTabTitle } from '@/app/dashboard/modules/agency-settings/utils/enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';

@Component({
  selector: 'company-settings',
  templateUrl: './company-settings.component.html',
  styleUrls: ['./company-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanySettingsComponent implements OnInit, OnDestroy {
  @Output() hiddenDropdownSelect = new EventEmitter<boolean>();
  private destroy$ = new Subject();
  public currentUser: CurrentUser;
  public currentRole: ERole | string;
  readonly UserTypeEnum = UserTypeEnum;
  public popupState = {
    plansSummary: false,
    requestSent: false,
    requestFromTab: false
  };
  public agencyPlans: EAgencyPlan;
  public previousUrl = '';
  public currentMailboxId: string;

  public companySettingTabs: IAgencySettingTab<Object>[] = [
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
    private inboxService: InboxService
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
        this.currentUser = res;
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

        this.companySettingTabs = this.companySettingTabs.map((item) => {
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

    this.actionLinkService.previousUrl$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((url) => {
        this.previousUrl = url;
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentMailboxId) => {
        if (!currentMailboxId) return;
        this.currentMailboxId = currentMailboxId;
      });
  }

  handleHideTab(tabId: EAgencySettingsTabTitle) {
    this.companySettingTabs = this.companySettingTabs.map((item) => {
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

  hiddenDropdown(e: boolean) {
    this.hiddenDropdownSelect.emit(e);
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
