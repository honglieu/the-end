import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { IntegrationContentOptions } from '@/app/dashboard/utils/constants';
import { CompanyService } from '@services/company.service';
import {
  IIntegrations,
  ISettingTaskActivityLogPayload
} from '@shared/types/agency.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EmailProvider } from '@shared/enum';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { PermissionService } from '@/app/services/permission.service';

@Component({
  selector: 'agency-integrations',
  templateUrl: './agency-integrations.component.html',
  styleUrls: ['./agency-integrations.component.scss']
})
export class AgencyIntegrationsComponent implements OnInit, OnDestroy {
  public integartionContent: IIntegrations;
  public isFromRM: boolean = false;
  private destroy$ = new Subject<void>();
  public helpCentreLink = '';
  public isFirstTime = false;
  isMailboxFromSendGrid: boolean = false;
  public isRmEnvironment: boolean = false;
  public isAutoSyncCompletedTask: boolean = false;
  public isPermissionEdit: boolean = false;

  constructor(
    private agencyService: AgencyService,
    private dashboardService: DashboardApiService,
    private companyService: CompanyService,
    public inboxService: InboxService,
    public mailboxSettingService: MailboxSettingService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.companyService.getCurrentCompany(),
      this.dashboardService.getSSOZendesk()
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([company, zendesk]) => {
        const isFromRM = this.agencyService.isRentManagerCRM(company);
        const environmentName = isFromRM
          ? ECRMSystem.RENT_MANAGER
          : ECRMSystem.PROPERTY_TREE;
        this.integartionContent = IntegrationContentOptions[environmentName];
        this.helpCentreLink = this.integartionContent.helpCentreLink;
        this.integartionContent.helpCentreLink = zendesk.redirectUrl.replace(
          /return_to=(.)*/,
          `return_to=${this.integartionContent.helpCentreLink}`
        );
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
    this.checkPermission();
    this.getAutoSyncCompletedTask();
    this.inboxService.currentMailBox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mailbox) => {
        this.isMailboxFromSendGrid =
          mailbox?.provider === EmailProvider.SENDGRID;
      });
  }

  getAutoSyncCompletedTask() {
    this.agencyService.getSettingTaskActivityLog().subscribe((res) => {
      if (!res) return;
      this.isAutoSyncCompletedTask =
        res.settingTaskActivityLog.isAutoSync || false;
    });
  }

  onClick() {
    if (this.isFirstTime) {
      this.integartionContent.helpCentreLink = this.helpCentreLink;
    } else {
      this.isFirstTime = true;
    }
  }

  checkPermission() {
    this.isPermissionEdit = this.permissionService.hasFunction(
      'COMPANY_DETAIL.PROFILE.EDIT'
    );
  }

  onToggleAutoSyncTaskActivityToPT(event) {
    this.isAutoSyncCompletedTask = event;
    this.handleSaveMailboxActivityLog();
  }

  handleSaveMailboxActivityLog() {
    const isAutoSync = this.isAutoSyncCompletedTask || false;
    const autoSyncCompletedTask: ISettingTaskActivityLogPayload = {
      settingTaskActivityLog: {
        isAutoSync: isAutoSync,
        categoryName: null
      }
    };
    this.agencyService
      .updateSettingTaskActivityLog(autoSyncCompletedTask)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }
}
