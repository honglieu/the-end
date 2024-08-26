import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { ContactMethod, IContact } from '@/app/leasing/utils/leasingType';
import { LeasingSyncStatus } from '@shared/enum/leasing-request.enum';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { PHONE_PREFIXES } from '@services/constants';
import { CompanyService } from '@services/company.service';
interface ToggleEvent {
  contactEdit?: IContact;
  pos?: number;
  isPrimaryTenant?: boolean;
}
@Component({
  selector: 'tenancy-contact-card',
  templateUrl: './tenancy-contact-card.component.html',
  styleUrls: ['./tenancy-contact-card.component.scss']
})
export class TenancyContactCardComponent implements OnInit, OnDestroy {
  @Input() contact: IContact;
  @Input() contactIndex: number;
  @Input() tenancyName: string;
  @Input() isPrimaryTenant: boolean;
  @Input() disable: boolean;
  @Input() isVariable: boolean;
  @Input() syncStatus: string;
  @Output() onToggleAddTenantContact = new EventEmitter<ToggleEvent>();
  @Output() onToggleRemoveTenantContact = new EventEmitter<ToggleEvent>();
  @Output() onClose = new EventEmitter<void>();
  public allowTruncated: boolean;
  public classBadge: string;
  public areaCode: string;
  public isRmEnvironment: boolean;
  private destroy$ = new Subject<void>();

  constructor(
    private trudiSendMsgService: TrudiSendMsgService,
    private titleCasePipe: TrudiTitleCasePipe,
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
        this.areaCode = this.isRmEnvironment
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
      });
  }

  get popupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  get email() {
    return this.contact?.contactInfos.find(
      (x) => x.contactMethod === ContactMethod.Email
    )?.details;
  }

  get phoneNumber() {
    return this.contact?.contactInfos.find(
      (x) => x.contactMethod === ContactMethod.HomePhone
    )?.details;
  }

  get tenantName() {
    return `${this.contact.givenName || ''} ${
      this.contact.familyName || ''
    }`.trim();
  }

  get isSyncCompleted() {
    return this.syncStatus === LeasingSyncStatus.COMPLETED;
  }

  get address() {
    if (this.isVariable) return this.contact.address?.addressLine1;

    const unit = this.contact.address?.unit
      ? `${this.contact?.address?.unit}/`
      : '';
    const streetNumber = this.contact.address?.streetNumber
      ? `${this.contact.address?.streetNumber}`
      : '';
    const addressLine1 = this.contact.address?.addressLine1
      ? ` ${this.contact.address?.addressLine1}`
      : '';
    const state = this.contact.address?.state || '';
    const postcode = this.contact.address?.postcode
      ? ` ${this.contact.address?.postcode}`
      : '';

    const address = `${unit}${streetNumber}${addressLine1}`;
    const suburb = this.contact.address?.suburb || '';
    const stateAddress = `${state}${postcode}`;

    return `
      ${!!address?.replace('/', '').trim() ? address : ''}${
      !!suburb?.trim() ? ', ' + suburb : ''
    }${!!stateAddress?.trim() ? ', ' + stateAddress : ''}
    `;
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
      default:
        return 'role';
    }
  }

  setPopupState(state: Partial<typeof this.popupState>) {
    this.trudiSendMsgService.setPopupState(state);
  }

  getTileByType(type: EUserPropertyType) {
    switch (type) {
      case EUserPropertyType.OTHER:
        return 'Other contact';
      default:
        return this.titleCasePipe.transform(type);
    }
  }

  toggleTenantContactPopup(contactEdit?: IContact, index?: number) {
    this.onToggleAddTenantContact.emit({ contactEdit, pos: index });
  }

  toggleTenantContactRemove(index?: number) {
    this.onToggleRemoveTenantContact.emit({
      pos: index,
      isPrimaryTenant: this.isPrimaryTenant
    });
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
