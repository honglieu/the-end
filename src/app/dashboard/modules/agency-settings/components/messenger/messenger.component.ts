import { EAddOnType } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { FacebookAccountService } from '@/app/dashboard/services/facebook-account.service';
import {
  EPageMessengerConnectStatus,
  FacebookOpenFrom,
  PageFacebookMessengerType
} from '@/app/dashboard/shared/types/facebook-account.interface';
import {
  EMailBoxStatus,
  EMailBoxType,
  EmailProvider,
  GroupType,
  TaskStatusType
} from '@/app/shared/enum';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { of, Subject, switchMap, takeUntil } from 'rxjs';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { FacebookService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook.service';
import { ToastrService } from 'ngx-toastr';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { PermissionService } from '@/app/services/permission.service';

@Component({
  selector: 'messenger',
  templateUrl: './messenger.component.html',
  styleUrl: './messenger.component.scss'
})
export class MessengerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isMailboxFromSendGrid: boolean = false;
  public isPermissionEdit: boolean = false;
  public showModalAddMailboxInfo: boolean = false;
  public isHasCompanyMailbox: boolean = false;
  public showConfirmDisconnectMessenger: boolean = false;
  public pageMessengerConnected: PageFacebookMessengerType;
  public EPageMessengerConnectStatus = EPageMessengerConnectStatus;
  public isHasFeatureMessenger: boolean = false;
  constructor(
    private facebookAccountService: FacebookAccountService,
    private router: Router,
    private inboxFilterService: InboxFilterService,
    public permissionService: PermissionService,
    public inboxService: InboxService,
    public readonly facebookService: FacebookService,
    private readonly toastrService: ToastrService,
    private agencyService: AgencyService
  ) {}

  get facebookTooltipContent() {
    return `Your Messenger feature is turned OFF. ${
      this.permissionService.isOwner || this.permissionService.isAdministrator
        ? ''
        : 'Please contact your administrator.'
    }`;
  }

  ngOnInit(): void {
    this.checkPermission();

    this.inboxService.currentMailBox$
      .pipe(
        switchMap((mailbox) => {
          if (mailbox) {
            this.isMailboxFromSendGrid =
              mailbox?.provider === EmailProvider.SENDGRID;
            return this.inboxService.listMailBoxs$;
          }
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((listMailBoxs) => {
        if (listMailBoxs?.length) {
          this.isHasCompanyMailbox = listMailBoxs.some(
            (mailbox) =>
              mailbox.type === EMailBoxType.COMPANY &&
              mailbox.status !== EMailBoxStatus.ARCHIVE
          );
        }
      });

    this.facebookAccountService.currentPageMessengerActive$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.pageMessengerConnected = res;
      });
    this.subscribeCurrentPlan();
  }

  subscribeCurrentPlan() {
    this.agencyService.currentPlan$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isHasFeatureMessenger = res?.features[EAddOnType.MESSENGER].state;
      });
  }

  loginMessenger() {
    if (!this.isHasCompanyMailbox) {
      this.showModalAddMailboxInfo = true;
      return;
    }

    if (!this.isPermissionEdit || !this.isHasFeatureMessenger) return;

    this.facebookAccountService.login(FacebookOpenFrom.integration).subscribe();
  }

  checkPermission() {
    this.isPermissionEdit = this.permissionService.hasFunction(
      'COMPANY_DETAIL.PROFILE.EDIT'
    );
  }

  navigateToInboxPage() {
    this.router.navigate(['/dashboard', 'inbox', 'messages'], {
      queryParams: {
        inboxType:
          this.inboxFilterService.getSelectedInboxType() || GroupType.TEAM_TASK,
        status: TaskStatusType.inprogress
      }
    });
  }

  handleCancel() {
    this.showModalAddMailboxInfo = false;
  }

  handleDisconnectMessenger() {
    this.facebookAccountService.disconnectFacebookChannel().subscribe((res) => {
      this.showConfirmDisconnectMessenger = false;
      this.facebookAccountService.currentPageMessengerActive$.next(null);
      this.facebookService.setFacebookConnected(false);
      this.toastrService.success('Messenger disconnected');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }
}
