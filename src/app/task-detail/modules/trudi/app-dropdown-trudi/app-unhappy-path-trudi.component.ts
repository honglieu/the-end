import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { ListTrudiContact } from '@shared/types/trudi.interface';
import {
  PropertyContact,
  UnhappyStatus
} from '@shared/types/unhappy-path.interface';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { PropertiesService } from '@services/properties.service';
import { ConversationService } from '@services/conversation.service';
import { UserType } from '@services/constants';
import { TaskType } from '@shared/enum/task.enum';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { TaskName } from '@shared/types/task.interface';
import { CreateNewContactUserResponse } from '@shared/types/user.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';

enum EnumCurrentStep {
  Contact = 'contact',
  Property = 'property',
  Task = 'task'
}

@Component({
  selector: 'app-unhappy-path-trudi',
  templateUrl: './app-unhappy-path-trudi.component.html',
  styleUrls: ['./app-unhappy-path-trudi.component.scss']
})
export class AppUnhappyPathTrudiComponent implements OnInit {
  @Input() taskId: string;
  @Input() title: string;
  @Input() placeholder: string;
  @Input() show: boolean;
  @Input() isUnHappyPath: boolean;
  @Input() isUnidentifiedEmail: boolean;
  @Input() isUnindentifiedPhoneNumber: boolean;
  @Input() isUnindentifiedProperty: boolean;
  @Input() unhappyStatus: UnhappyStatus;
  @Input() items: ListTrudiContact[];
  @Input() propertyList: PropertyContact[];
  @Input() taskNameList: TaskName[];
  @Input() overlayDropdown = true;
  @Input() loading: boolean = false;
  @Output() onClose = new EventEmitter<boolean>();
  @Output() onChange = new EventEmitter<ListTrudiContact>();
  @Output() onConfirm = new EventEmitter<{
    id: string;
    type: string;
    enquiries?: boolean;
    streetline?: string;
  }>();
  @Output() onSearch = new EventEmitter<string>();

  readonly EnumCurrentStep = EnumCurrentStep;
  isWarningProperty: boolean = false;
  isFocus = false;
  isFocusInput = false;
  isHasResultFilter = true;
  subscriber = new Subject<void>();
  searchText$ = new FormControl(null);
  selectedUserPropertyId: string;
  selectedUserType: string;
  selectedPropertyId: string;
  contactType = EConfirmContactType;
  isSendSimilarEnquiries = false;
  targetConvId = '';
  moveConversationState = false;
  propertyId;
  notEmitSearch = false;
  currentStep: EnumCurrentStep;
  private LAZY_LOAD_TASK = 50;
  public userType = UserType;
  public selectedUserStreetLine: string;

  private currentMailboxId: string;
  showCreateNewContact = false;
  ModalPopupPosition = ModalPopupPosition;
  constructor(
    public taskService: TaskService,
    private propertyService: PropertiesService,
    private inboxService: InboxService,
    private conversationService: ConversationService,
    public readonly sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.subscriber))
      .subscribe((currentMailboxId) => {
        this.currentMailboxId = currentMailboxId;
      });
    this.searchText$.valueChanges
      .pipe(
        // filter(el => !this.notEmitSearch && !!el && isString(el)),
        takeUntil(this.subscriber),
        distinctUntilChanged(),
        debounceTime(500)
      )
      .subscribe((searchValue: string) => {
        if (this.notEmitSearch) return;
        this.onSearch.emit(searchValue);
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
      this.isHasResultFilter = this.items.length > 0;
    }
    if (changes['propertyList']?.currentValue) {
      this.isHasResultFilter = this.propertyList.length > 0;
    }
    if (changes['taskNameList']?.currentValue) {
      this.isHasResultFilter = this.taskNameList.length > 0;
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
    this.isFocusInput = true;
    this.isWarningProperty = !this.isFocusInput;
    this.notEmitSearch = false;
    if (this.selectedUserPropertyId) this.onClearSearch();
    else if (this.searchText$.value) {
      this.onSearch.emit(this.searchText$.value);
      this.isFocus = true;
    } else if (
      this.currentStep == EnumCurrentStep.Contact ||
      (this.currentStep == EnumCurrentStep.Property &&
        !this.isUnindentifiedProperty) ||
      this.currentStep == EnumCurrentStep.Task
    ) {
      this.onSearch.emit('');
      this.isFocus = true;
    }
  }

  onFocusOutSearch() {
    this.notEmitSearch = true;
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
  }

  onCheckboxChange(event: boolean) {
    this.isSendSimilarEnquiries = event;
  }

  onAddNewContact() {
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
    const taskProperty = this.taskService.currentTask$.getValue();

    if (
      this.currentStep === EnumCurrentStep.Contact &&
      taskProperty.taskType === TaskType.TASK &&
      [EConfirmContactType.TENANT, EConfirmContactType.LANDLORD].includes(
        this.selectedUserType as EConfirmContactType
      ) &&
      this.selectedPropertyId !== taskProperty?.property?.id
    ) {
      this.isWarningProperty = true;
      return;
    }
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
}
