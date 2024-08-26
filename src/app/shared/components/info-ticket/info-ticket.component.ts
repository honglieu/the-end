import { TitleCasePipe } from '@angular/common';
import { EUserPropertyType } from './../../enum/user.enum';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { PHONE_PREFIXES } from '@services/constants';
import { CompanyService } from '@services/company.service';

type TrudiBadgeSize = 'small' | 'medium' | 'large';
type TrudiBadgeVariant =
  | 'primary'
  | 'warning'
  | 'error'
  | 'role'
  | 'success'
  | 'inProgress'
  | 'unassigned'
  | 'supplier'
  | 'rm-tenant';
@Component({
  selector: 'info-ticket',
  templateUrl: './info-ticket.component.html',
  styleUrls: ['./info-ticket.component.scss'],
  providers: [TitleCasePipe]
})
export class InfoTicketComponent implements OnInit, OnChanges, OnDestroy {
  @Input() contact;
  @Input() size: TrudiBadgeSize = 'small';
  public variant: TrudiBadgeVariant = 'primary';
  public userPropertyType = EUserPropertyType;
  public areaCode: string;
  public isRmEnvironment: boolean;
  public isPTEnvironment: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private titleCasePipe: TitleCasePipe,
    private agencyService: AgencyService,
    private companyService: CompanyService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const { contact } = changes;
    if (contact?.currentValue) {
      this.contact = {
        ...this.contact,
        displayContactType: this.getTileByType(this.contact)
      };
    }
  }

  ngOnInit(): void {
    this.variant = this.getVariant(this.contact?.type);
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((agency) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(agency);
        this.isPTEnvironment = this.companyService.isPropertyTreeCRM(agency);
        this.areaCode = this.isRmEnvironment
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
      });
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

  getTileByType(contact) {
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
