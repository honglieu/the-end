import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { UserService } from '@services/user.service';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import {
  EActionUserType,
  ERentPropertyStatus
} from '@/app/user/utils/user.enum';
import { eventData } from '@/app/user/utils/user.type';
import {
  EContactPageType,
  ETypeContactItem,
  IAgentUserProperties,
  IContactItemFormatted,
  ISourceProperty,
  IUserProperties,
  IUserPropertyGroup,
  USER_PROPERTY_TYPE
} from '@/app/user/list-property-contact-view/model/main';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'contact-property-row',
  templateUrl: './contact-property-row.component.html',
  styleUrls: ['./contact-property-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactPropertyRowComponent implements OnInit {
  @Output() handleEventRow = new EventEmitter<eventData>();
  @Input() item: IContactItemFormatted<
    | IAgentUserProperties
    | ISourceProperty
    | IUserPropertyGroup
    | IUserProperties
  >;
  @Input() contactPageType: EContactPageType;
  @Input() disabled: boolean = false;
  @Input() searchValue: string = '';
  @Output() changeValueCheckbox = new EventEmitter();
  public userPropertyType = USER_PROPERTY_TYPE;
  public dataContactRow: IUserProperties[];
  public readonly ACTION_TYPE = EActionUserType;
  public ERentPropertyStatus = ERentPropertyStatus;
  readonly ETypeContactItem = ETypeContactItem;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  private unsubscribe = new Subject<void>();
  public isRmEnvironment: boolean = false;
  public isPTEnvironment: boolean = false;
  constructor(
    public phoneNumberFormatPipe: PhoneNumberFormatPipe,
    public userService: UserService,
    private agencyService: AgencyService,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService
  ) {}
  ngOnInit(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        this.isPTEnvironment = this.companyService.isPropertyTreeCRM(company);
      });
  }

  handleActionBasedOnType(type: EActionUserType, data) {
    switch (type) {
      case EActionUserType.PROPERTY:
      case EActionUserType.APP_INVITE:
      case EActionUserType.SEND_MSG:
      case EActionUserType.PEOPLE:
      case EActionUserType.ROLE:
      case EActionUserType.CRM_STATUS:
      case EActionUserType.EMAIL:
      case EActionUserType.TRUDI_APP:
      case EActionUserType.PHONE_NUMBER:
      case EActionUserType.DELETE_PERSON:
      case EActionUserType.ADD_MAIL:
        this.handleEventRow.emit({
          type,
          ...data,
          contactPageType: this.contactPageType
        });
        break;
      case EActionUserType.DELETE_SECONDARY_EMAIL:
      case EActionUserType.DELETE_SECONDARY_PHONE:
        this.handleEventRow.emit({
          type,
          data,
          contactPageType: this.contactPageType
        });
        break;
      default:
        break;
    }
  }
  handleCheckbox(item): void {
    this.changeValueCheckbox.emit({
      ...item.data,
      dataType: item.dataType,
      isChecked: item.isChecked
    });
  }
  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
  @HostListener('keydown.enter', ['$event'])
  handleEnterKey(event: KeyboardEvent) {
    if (
      !event.target ||
      !(event.target instanceof Element) ||
      event.target.closest('button')
    ) {
      event.stopPropagation();
    } else {
      this.handleActionBasedOnType(this.ACTION_TYPE.PEOPLE, this.item);
    }
  }
}
