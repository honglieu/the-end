import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { EAddOnType } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { EActionShowMessageTooltip } from '@shared/enum/share.enum';

@Component({
  selector: 'unhappy-path',
  templateUrl: './unhappy-path.component.html',
  styleUrls: ['./unhappy-path.component.scss']
})
export class UnhappyPathComponent implements OnInit {
  @ViewChild('upgradeMsg', { static: true })
  upgradeMsg: TemplateRef<HTMLElement>;
  ACTION_UPGRADE = EActionShowMessageTooltip;
  public upgradeMsgOutlet: TemplateRef<HTMLElement>;
  private unsubscribe = new Subject<void>();
  constructor(
    private agencyService: AgencyService,
    private inboxService: InboxService
  ) {}

  ngOnInit(): void {
    this.agencyService.currentPlan$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((configPlan) => {
        if (!configPlan) return;
        if (
          configPlan?.features &&
          !configPlan?.features[EAddOnType.SUGGESTED_REPLIES]?.state
        ) {
          this.upgradeMsgOutlet = this.upgradeMsg;
        }
      });
  }
}
