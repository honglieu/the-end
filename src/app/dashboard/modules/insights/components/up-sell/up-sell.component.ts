import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { PermissionService } from '@services/permission.service';
import { ConfigPlan } from '@/app/console-setting/agencies/utils/console.type';
import {
  EAddOn,
  EAgencyPlan
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { SharedService } from '@services/shared.service';
import { ConversationService } from '@services/conversation.service';
import { ToastrService } from 'ngx-toastr';
import { UPGRADE_REQUEST_SENT } from '@services/messages.constants';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';

enum EPopupState {
  SUMMARY_PLAN_POPUP = 'summaryPlanPopup',
  CONFIRM_PLAN_POPUP = 'confirmPlanPopup',
  UP_SALE_POPUP = 'upSalePopup'
}

enum EUpSellTextButton {
  UPGRADE_YOUR_PLAN = 'Upgrade your plan',
  REQUEST_PLAN_UPGRADE = 'Request plan upgrade'
}

@Component({
  selector: 'up-sell-modal',
  templateUrl: './up-sell.component.html',
  styleUrls: ['./up-sell.component.scss']
})
export class UpSellComponent implements OnInit {
  private unsubscribe = new Subject<void>();
  public configPlans: ConfigPlan;
  public popupState: EPopupState = EPopupState.UP_SALE_POPUP;
  @Output() upgradePlan = new EventEmitter();
  public readonly BENEFIT_LIST = [
    'Team efficiency scores',
    'Performance ranking',
    'Time savings',
    'Enquiry & task resolution rates'
  ];
  public upSellButtonText = '';
  public readonly EPopupState = EPopupState;
  public planModifyingText = '';
  public disabledUpSellBtn = false;
  public currentMailboxId: string;
  constructor(
    private permissionService: PermissionService,
    private agencyDashboardService: AgencyService,
    private sharedService: SharedService,
    private conversationService: ConversationService,
    private toastService: ToastrService,
    private inboxService: InboxService
  ) {}

  ngOnInit(): void {
    this.agencyDashboardService.currentPlan$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((configPlan) => {
        if (!configPlan) return;
        this.configPlans = configPlan;
      });
    this.changeSubmitBtnByPermission();
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentMailboxId) => {
        if (!currentMailboxId) return;
        this.currentMailboxId = currentMailboxId;
      });
  }

  public onClosePlansSummary() {
    this.popupState = EPopupState.UP_SALE_POPUP;
  }

  public handleUpgradePlan() {
    if (this.upSellButtonText === EUpSellTextButton.UPGRADE_YOUR_PLAN) {
      this.popupState = EPopupState.SUMMARY_PLAN_POPUP;
    } else {
      this.popupState = EPopupState.UP_SALE_POPUP;
      this.disabledUpSellBtn = true;
      this.conversationService
        .sendMailRequestFeature(EAddOn.INSIGHTS, this.currentMailboxId)
        .subscribe({
          next: (res) => {
            this.toastService.success(UPGRADE_REQUEST_SENT);
            this.disabledUpSellBtn = false;
          }
        });
    }
  }

  public handleChangePlan(requestedPlan: ConfigPlan) {
    const planIndex = Object.values(EAgencyPlan);
    this.planModifyingText =
      this.configPlans.plan === EAgencyPlan.CUSTOM ||
      planIndex.indexOf(requestedPlan.requestPlan) >
        planIndex.indexOf(this.configPlans.plan)
        ? 'upgrade'
        : 'downgrade';
    this.popupState = EPopupState.CONFIRM_PLAN_POPUP;
  }

  public resetPopupState() {
    this.popupState = null;
  }

  private changeSubmitBtnByPermission() {
    if (this.sharedService.isConsoleUsers()) {
      if (this.permissionService.isOwner) {
        this.upSellButtonText = EUpSellTextButton.UPGRADE_YOUR_PLAN;
      } else {
        this.upSellButtonText = EUpSellTextButton.REQUEST_PLAN_UPGRADE;
        this.disabledUpSellBtn = true;
      }
    } else {
      if (
        this.permissionService.isAdministrator ||
        this.permissionService.isOwner
      ) {
        this.upSellButtonText = EUpSellTextButton.UPGRADE_YOUR_PLAN;
      } else {
        this.upSellButtonText = EUpSellTextButton.REQUEST_PLAN_UPGRADE;
      }
    }
  }
}
