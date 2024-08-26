import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { UserService } from '@services/user.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { EUserInviteStatusType } from '@shared/enum/userType.enum';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { Subject, takeUntil } from 'rxjs';
import { PHONE_PREFIXES } from '@services/constants';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'trudi-contact-card',
  templateUrl: './trudi-contact-card.component.html',
  styleUrls: ['./trudi-contact-card.component.scss'],
  providers: [TitleCasePipe]
})
export class TrudiContactCardComponent implements OnInit, OnDestroy {
  @Input() contact: ISelectedReceivers;
  @Output() onClose = new EventEmitter<void>();
  public areaCode: string;
  public isRmEnvironment: boolean;
  public isPTEnvironment: boolean = false;
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
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        this.isPTEnvironment = this.companyService.isPropertyTreeCRM(company);
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
          ) === EUserInviteStatusType.active,
        displayContactType: this.getTileByType(this.contact)
      };
    }
  }

  get popupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  getVariant(type: EUserPropertyType) {
    switch (type) {
      case EUserPropertyType.TENANT:
        return 'unassigned';
      case EUserPropertyType.SUPPLIER:
        return 'supplier';
      case EUserPropertyType.LANDLORD_PROSPECT:
      case EUserPropertyType.LANDLORD:
        return 'primary';
      case EUserPropertyType.TENANT_UNIT:
      case EUserPropertyType.TENANT_PROPERTY:
      case EUserPropertyType.TENANT_PROSPECT:
        return 'rm-tenant';
      case EUserPropertyType.LEAD:
        return 'inProgress';
      case EUserPropertyType.OTHER:
        return 'error';
      default:
        return 'role';
    }
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

  setPopupState(state: Partial<typeof this.popupState>) {
    this.trudiSendMsgService.setPopupState(state);
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
