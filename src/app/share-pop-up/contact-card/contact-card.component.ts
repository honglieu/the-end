import { crmStatusType } from '@shared/enum/supplier.enum';
import { TitleCasePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import { PHONE_PREFIXES } from '@services/constants';
import { UserService } from '@services/user.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { EUserInviteStatusType } from '@shared/enum/userType.enum';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

@Component({
  selector: 'contact-card',
  templateUrl: './contact-card.component.html',
  styleUrls: ['./contact-card.component.scss'],
  providers: [TitleCasePipe]
})
export class ContactCardComponent implements OnInit, OnDestroy {
  @Input() contact: ISelectedReceivers;
  @Output() onClose = new EventEmitter<void>();
  @Input() isPolicy: boolean = false;
  @Input() isAddCustomPolicy: boolean = false;
  public allowTruncated: boolean;
  public classBadge: string;
  public areaCode: string;
  public isRmEnvironment: boolean;
  public crmStatusType = crmStatusType;
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private trudiSendMsgService: TrudiSendMsgService,
    private titleCasePipe: TitleCasePipe,
    private agencyService: AgencyService,
    private companyService: CompanyService
  ) {}

  EUserPropertyType = EUserPropertyType;

  ngOnInit(): void {
    this.classBadge = `trudi-badge trudi-badge-${this.getVariant(
      this.contact?.type
    )} trudi-badge-small ${this.allowTruncated ? 'trudi-badge-truncated' : ''}`;
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        this.areaCode = this.isRmEnvironment
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contact']) {
      this.contact = {
        ...this.contact,
        isAppUser:
          this.userService.getStatusInvite(
            this.contact.iviteSent,
            this.contact.lastActivity,
            this.contact.offBoardedDate,
            this.contact.trudiUserId
          ) === EUserInviteStatusType.active
      };
    }
  }

  get popupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  getVariant(type: string) {
    switch (type) {
      case EUserPropertyType.TENANT:
        return 'unassigned';
      case EUserPropertyType.SUPPLIER:
        return 'supplier';
      case EUserPropertyType.LANDLORD_PROSPECT:
      case EUserPropertyType.LANDLORD:
        return 'primary';
      case EUserPropertyType.OTHER:
        return 'error';
      case EUserPropertyType.TENANT_UNIT:
      case EUserPropertyType.TENANT_PROPERTY:
      case EUserPropertyType.TENANT_PROSPECT:
        return 'rm-tenant';
      case EUserPropertyType.LEAD:
        return 'inProgress';
      default:
        return 'role';
    }
  }

  setPopupState(state: Partial<typeof this.popupState>) {
    this.trudiSendMsgService.setPopupState(state);
  }

  getTileByType(contact: ISelectedReceivers) {
    switch (contact.type) {
      case EUserPropertyType.OTHER:
        return 'Other contact';
      case EUserPropertyType.LEAD:
        return contact.userTitle;
      default:
        return this.titleCasePipe.transform(contact.type);
    }
  }

  handleClick(url: string) {
    const regex = /^https:\/\//i;
    let linkUrl = '';
    if (regex.test(url)) {
      linkUrl = url;
    } else {
      linkUrl = `https://${url}`;
    }
    window.open(linkUrl, '_blank');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
