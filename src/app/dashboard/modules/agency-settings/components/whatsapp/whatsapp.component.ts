import { EAddOnType } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { WhatsappAccountService } from '@/app/dashboard/services/whatsapp-account.service';
import {
  PageWhatsAppType,
  WhatsAppConnectStatus
} from '@/app/dashboard/shared/types/whatsapp-account.interface';
import { PermissionService } from '@/app/services/permission.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { WhatsappService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp.service';

@Component({
  selector: 'whatsapp',
  templateUrl: './whatsapp.component.html',
  styleUrl: './whatsapp.component.scss'
})
export class WhatsAppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  public isMailboxFromSendGrid: boolean = false;
  public isPermissionEdit: boolean = false;
  public showModalAddMailboxInfo: boolean = false;
  public isHasCompanyMailbox: boolean = false;
  public showConfirmDisconnectWhatsApp: boolean = false;
  public pageWhatsAppConnected: PageWhatsAppType;
  public WhatsAppConnectStatus = WhatsAppConnectStatus;
  public isHasFeatureWhatsApp: boolean = false;
  public clickedDisconnect: boolean = false;

  constructor(
    private whatsAppAccountService: WhatsappAccountService,
    private whatsAppService: WhatsappService,
    public permissionService: PermissionService,
    public inboxService: InboxService,
    private readonly toastrService: ToastrService,
    private agencyService: AgencyService
  ) {}

  ngOnInit(): void {
    this.checkPermission();
    this.whatsAppAccountService.currentPageWhatsappActive$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.pageWhatsAppConnected = res;
      });
    this.subscribeCurrentPlan();
  }

  checkPermission() {
    this.isPermissionEdit = this.permissionService.hasFunction(
      'COMPANY_DETAIL.PROFILE.EDIT'
    );
  }

  subscribeCurrentPlan() {
    this.agencyService.currentPlan$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isHasFeatureWhatsApp = res?.features[EAddOnType.WHATSAPP].state;
      });
  }

  handleDisconnectWhatsApp() {
    if (this.clickedDisconnect) return;
    this.clickedDisconnect = true;
    this.whatsAppAccountService.logout().subscribe((_) => {
      this.showConfirmDisconnectWhatsApp = false;
      this.whatsAppAccountService.currentPageWhatsappActive$.next(null);
      this.whatsAppService.setWhatsappConnected(false);
      this.toastrService.success('WhatsApp disconnected');
      this.clickedDisconnect = false;
    });
  }

  copyToClipboard(phoneNumber: string) {
    if (!phoneNumber) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(phoneNumber).then(() => {
        this.toastrService.success('Whatsapp number copied');
      });
    } else {
      this.toastrService.error('Browser does not support copy to clipboard');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
