import { ECrmType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { CompanyService } from '@services/company.service';
import { EPage } from '@shared/enum/trudi';
import { Component, Input, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { EConversationType, EUserPropertyType } from '@/app/shared/enum';
import { UserProperty } from '@/app/shared/types';

@Component({
  selector: 'message-synced-conversation',
  templateUrl: './message-synced-conversation.component.html',
  styleUrls: ['./message-synced-conversation.component.scss']
})
export class MessageSyncedConversationComponent implements OnInit {
  @Input() message: any | null = null;
  @Input() conversationType?: EConversationType;
  private unsubscribe = new Subject<void>();
  public CRMString: ECrmType = ECrmType.PROPERTY_TREE;
  public EPage = EPage;
  public messageForMarker: string;

  constructor(
    private companyService: CompanyService,
    private userProfileDrawerService: UserProfileDrawerService,
    private agencyDashboardService: AgencyDashboardService
  ) {}

  get isClickable() {
    return (
      this.message?.userType === EUserPropertyType.LEAD &&
      [
        EConversationType.MESSENGER,
        EConversationType.SMS,
        EConversationType.WHATSAPP
      ].includes(this.conversationType)
    );
  }

  ngOnInit(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.CRMString = this.agencyDashboardService.isRentManagerCRM(res)
          ? ECrmType.RENT_MANAGER
          : ECrmType.PROPERTY_TREE;
        this.messageForMarker = `Conversation synced to ${this.CRMString} by`;
      });
  }

  handleOpenProfileDrawer(event: MouseEvent) {
    if (!this.isClickable) return;
    event.stopPropagation();

    const { userId, firstName, creator, userType } = this.message;

    let dataUser = {
      ...this.message,
      pmUserId: userId,
      pmName: firstName,
      email: creator.email,
      sendFromUserType: userType,
      pmNameClick: true,
      conversationType: this.conversationType
    };

    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser as unknown as UserProperty
    );
  }
}
