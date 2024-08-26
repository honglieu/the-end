import { AgencyService as AgencyServiceDashboard } from '@/app/dashboard/services/agency.service';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import {
  ListTrudiContact,
  OnSearchValueEmitter
} from '@shared/types/trudi.interface';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import {
  CreateNewContactUserResponse,
  IUserParticipant
} from '@shared/types/user.interface';
import {
  PropertyContact,
  UnhappyStatus
} from '@shared/types/unhappy-path.interface';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { TaskName } from '@shared/types/task.interface';
import { PropertiesService } from '@services/properties.service';
import { ConversationService } from '@services/conversation.service';
import { UserType } from '@services/constants';
import { EPropertyStatus, EUserPropertyType } from '@shared/enum/user.enum';
import { userType } from '@trudi-ui';
import { LandlordToOwnerPipe } from '@shared/pipes/landlord-to-owner.pipe';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { CompanyService } from '@services/company.service';

enum EnumCurrentStep {
  Contact = 'contact',
  Property = 'property',
  Task = 'task'
}

@Component({
  selector: 'app-unhappy-path-trudi',
  templateUrl: './app-unhappy-path-trudi.component.html',
  styleUrls: ['./app-unhappy-path-trudi.component.scss'],
  providers: [LandlordToOwnerPipe]
})
export class AppUnhappyPathTrudiComponent implements OnInit, OnChanges {
  @ViewChild('contactList') contactList: ElementRef;
  @Input() taskId: string;
  @Input() title: string;
  @Input() placeholder: string;
  @Input() show: boolean;
  @Input() isUnHappyPath: boolean;
  @Input() isUnidentifiedEmail: boolean;
  @Input() isUnindentifiedPhoneNumber: boolean;
  @Input() isUnindentifiedProperty: boolean;
  @Input() unhappyStatus: UnhappyStatus;
  @Input() items: ListTrudiContact[] | [];
  @Input() propertyList: PropertyContact[];
  @Input() taskNameList: TaskName[];
  @Input() overlayDropdown = true;
  @Input() loading: boolean = false;
  @Input() isReassign: boolean;
  @Input() participant: IUserParticipant;
  @Output() onClose = new EventEmitter<boolean>();
  @Output() onChange = new EventEmitter<ListTrudiContact>();
  @Output() onConfirm = new EventEmitter<{
    id: string;
    type: string;
    enquiries?: boolean;
    streetline?: string;
  }>();
  @Output() onSearch = new EventEmitter<OnSearchValueEmitter>();
  @Output() onSetEmptyContactList = new EventEmitter();

  public propertyId;
  public currentPage = 1;
  public DEFAULT_LIMIT = 20;
  public DEFAULT_PAGE = 1;
  public userPropertyType = EUserPropertyType;

  private isPendingContactList = false;
  public isOpenContactList = false;

  readonly EnumCurrentStep = EnumCurrentStep;
  readonly EPropertyStatus = EPropertyStatus;
  isWarningProperty: boolean = false;
  isFocus = false;
  isFocusInput = false;
  isHasResultFilter = true;
  subscriber = new Subject<void>();
  searchText$ = new FormControl(null);
  selectedUserPropertyId: string;
  selectedUserStreetLine: string;
  validateSelectContact: boolean = false;
  selectedUserType: string;
  selectedPropertyId: string;
  contactType = EConfirmContactType;
  isSendSimilarEnquiries = false;
  targetConvId = '';
  moveConversationState = false;
  notEmitSearch = false;
  currentStep: EnumCurrentStep;
  isRmEnvironment: boolean = false;
  pipeType: string = userType.DEFAULT;
  private LAZY_LOAD_TASK = 50;
  public userType = UserType;

  showCreateNewContact = false;
  ModalPopupPosition = ModalPopupPosition;
  public isConsole: boolean;
  public isSelected: boolean = false;
  constructor(
    public taskService: TaskService,
    public inboxService: InboxService,
    public readonly sharedService: SharedService,
    private propertyService: PropertiesService,
    private conversationService: ConversationService,
    private agencyService: AgencyServiceDashboard,
    private landlordToOwner: LandlordToOwnerPipe,
    private cdr: ChangeDetectorRef,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.searchText$.valueChanges
      .pipe(
        // filter(el => !this.notEmitSearch && !!el && isString(el)),
        takeUntil(this.subscriber),
        distinctUntilChanged(),
        debounceTime(500)
      )
      .subscribe((searchValue: string) => {
        if (this.notEmitSearch) return;
        this.onSetEmptyContactList.emit();
        this.onSearch.emit({
          search: searchValue.trim(),
          page: this.DEFAULT_PAGE,
          limit: this.DEFAULT_LIMIT
        });
        this.currentPage = this.DEFAULT_PAGE;
        this.isFocus = true;
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      !this.unhappyStatus?.confirmContactType &&
      !this.unhappyStatus?.isConfirmContactUser
    ) {
      this.currentStep = EnumCurrentStep.Contact;
    } else if (
      [EConfirmContactType.SUPPLIER, EConfirmContactType.OTHER].includes(
        this.unhappyStatus?.confirmContactType as EConfirmContactType
      ) &&
      !this.unhappyStatus?.isConfirmProperty
    ) {
      this.currentStep = EnumCurrentStep.Property;
    } else if (!this.unhappyStatus?.isAssignNewTask) {
      this.currentStep = EnumCurrentStep.Task;
    }

    if (changes['taskId']?.currentValue) {
      this.resetField();
    }
    if (this.show) {
      this.resetField();
    }
    if (changes['items']?.currentValue) {
      this.items = this.items?.map((item) => {
        return {
          ...item,
          firstName: this.landlordToOwner.transform(item?.firstName),
          fullName: this.landlordToOwner.transform(item?.fullName),
          propertyTypeOrAddress: this.landlordToOwner.transform(
            item?.propertyTypeOrAddress
          ),
          userPropertyType: this.landlordToOwner.transform(
            item?.userPropertyType
          )
        };
      });

      this.isHasResultFilter = this.items.length > 0;
      this.companyService
        .getCurrentCompany()
        .pipe(takeUntil(this.subscriber))
        .subscribe((company) => {
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        });
    }
    if (changes['propertyList']?.currentValue) {
      this.isHasResultFilter = this.propertyList.length > 0;
    }
    if (changes['taskNameList']?.currentValue) {
      this.isHasResultFilter = this.taskNameList.length > 0;
    }

    if (changes['loading']?.currentValue === false) {
      if (!this.isPendingContactList) return;
      if (this.isFocusInput) {
        this.isOpenContactList = true;
        this.isPendingContactList = false;
        this.cdr.markForCheck();
      }
    }
  }

  handleOnCloseCreateContact(contact?: CreateNewContactUserResponse) {
    this.showCreateNewContact = false;
    //contact exists meaning create new contact
    if (contact) {
      this.searchText$.setValue(contact.lastName);
      this.selectedUserPropertyId = contact.id;
      this.selectedUserType = contact.type;
      this.onConfirmSelectContact();
    }
  }

  onFocusOnSearch() {
    this.isPendingContactList = true;
    this.onSetEmptyContactList.emit();
    this.isFocusInput = true;
    this.isWarningProperty = !this.isFocusInput;
    this.notEmitSearch = false;
    if (this.selectedUserPropertyId) this.onClearSearch();
    else if (this.searchText$.value) {
      this.onSearch.emit({
        search: this.searchText$.value,
        page: this.DEFAULT_PAGE,
        limit: this.DEFAULT_LIMIT
      });
      this.currentPage = this.DEFAULT_PAGE;
      this.isFocus = true;
    } else if (
      this.currentStep == EnumCurrentStep.Contact ||
      (this.currentStep == EnumCurrentStep.Property &&
        !this.isUnindentifiedProperty) ||
      this.currentStep == EnumCurrentStep.Task
    ) {
      this.onSearch.emit({
        search: '',
        page: this.DEFAULT_PAGE,
        limit: this.DEFAULT_LIMIT
      });
      this.currentPage = this.DEFAULT_PAGE;
      this.isFocus = true;
    }
  }

  onFocusOutSearch() {
    this.notEmitSearch = true;
    this.isFocusInput = false;
    this.isSelected = false;
  }

  onClearSearch() {
    this.searchText$.setValue('');
    this.selectedUserPropertyId = null;
  }

  onClearItems() {
    this.propertyList = [];
    this.items = [];
    this.isFocus = false;
  }

  displayInputValue(fullName: string, address: string, symbol: string) {
    if (!fullName && !address) {
      return '';
    } else if (fullName && !address) {
      return fullName;
    } else if (!fullName && address) {
      return address;
    } else {
      return fullName + symbol + address;
    }
  }

  onItemClick(event) {
    this.notEmitSearch = true;
    switch (this.currentStep) {
      case EnumCurrentStep.Property:
        this.searchText$.setValue(
          this.displayInputValue(event?.streetline, event?.fullName, ' | ')
        );
        this.selectedUserPropertyId = event.propertyId;
        this.selectedUserType = null;
        break;
      case EnumCurrentStep.Contact:
        if (event.userType !== this.userType.SUPPLIER) {
          this.searchText$.setValue(
            this.displayInputValue(
              event?.fullName,
              event?.propertyTypeOrAddress,
              ' • '
            )
          );
          this.selectedUserPropertyId = [
            EConfirmContactType.SUPPLIER,
            EConfirmContactType.OTHER
          ].includes(event.userType as EConfirmContactType)
            ? event.id
            : event.userPropertyId;
          this.selectedUserType =
            event?.userPropertyType || (event?.userType as EConfirmContactType);
          this.selectedPropertyId = event?.property?.id;
        } else {
          this.searchText$.setValue(
            this.displayInputValue(
              event?.lastName,
              event?.propertyTypeOrAddress,
              ' • '
            )
          );
          this.selectedUserPropertyId = [
            EConfirmContactType.SUPPLIER,
            EConfirmContactType.OTHER
          ].includes(event.userType as EConfirmContactType)
            ? event.id
            : event.userPropertyId;
          this.selectedUserType =
            event?.userPropertyType || (event?.userType as EConfirmContactType);
        }
        break;
      case EnumCurrentStep.Task:
        this.searchText$.setValue(event.name);
        this.selectedUserPropertyId = event.id;
        this.selectedUserType = null;
        break;
    }
    this.selectedUserStreetLine = event?.property?.streetline;
    this.onChange.emit(event);
    this.isFocus = false;
    this.isOpenContactList = false;
  }

  onCheckboxChange(event: boolean) {
    this.isSendSimilarEnquiries = event;
  }

  onAddNewContact() {
    this.isOpenContactList = false;
    this.showCreateNewContact = true;
  }

  onMoveExistingTask() {
    if (!this.conversationService.currentConversation.value.id) {
      return;
    }
    this.targetConvId = this.conversationService.currentConversation.value.id;
    this.propertyId =
      this.unhappyStatus.isConfirmProperty || !this.isUnHappyPath
        ? this.propertyService.currentPropertyId.getValue()
        : '';
    const excludeUnHappyPath = true;

    this.moveConversationState = true;
  }

  stopMoveToTask() {
    this.moveConversationState = false;
  }

  onConfirmSelectContact() {
    if (!this.selectedUserPropertyId) {
      this.validateSelectContact = true;
      return;
    }
    this.isSelected = true;
    this.searchText$.disable();
    const taskProperty = this.taskService.currentTask$.getValue();

    // if (
    //   this.currentStep === EnumCurrentStep.Contact &&
    //   taskProperty?.taskType === TaskType.TASK &&
    //   [
    //     EConfirmContactType.TENANT,
    //     EConfirmContactType.LANDLORD,
    //     EUserPropertyType.OWNER
    //   ].includes(this.selectedUserType as EConfirmContactType) &&
    //   this.selectedPropertyId !== taskProperty?.property?.id
    // ) {
    //   this.isWarningProperty = true;
    //   return;
    // }
    if (this.selectedPropertyId)
      this.propertyService
        .getPropertyById(this.selectedPropertyId)
        .subscribe((result) => {
          if (!result) return;
          this.propertyService.currentTaskRegion.next({
            id: result?.regionId,
            name: result?.state
          });
        });
    this.validateSelectContact = false;
    this.onConfirm.emit({
      id: this.selectedUserPropertyId,
      type: this.selectedUserType,
      enquiries: this.isSendSimilarEnquiries,
      streetline: this.selectedUserStreetLine
    });
    this.resetField();
    this.isWarningProperty = false;
  }

  onCollapse(event) {
    if (this.isFocus) {
      this.isFocus = false;
      this.isFocusInput = false;
      this.onFocusOutSearch();
      event.stopPropagation();
    } else this.onFocusOnSearch();
  }

  resetField() {
    this.selectedUserPropertyId = null;
    this.selectedUserType = null;
    this.searchText$.setValue(null);
  }

  onScroll() {
    this.currentPage += 1;
    this.onSearch.emit({
      page: this.currentPage,
      search: this.searchText$.value || '',
      limit: this.DEFAULT_LIMIT
    });
  }

  overlayOutsideClick(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    if (!this.contactList?.nativeElement?.contains(targetElement)) {
      this.isOpenContactList = false;
    }
  }
}
