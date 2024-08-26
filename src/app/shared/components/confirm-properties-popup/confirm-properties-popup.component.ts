import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  CurrentPeopleInConversation,
  UserPropertyInPeople
} from '@shared/types/user-property.interface';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, map, switchMap, takeUntil } from 'rxjs';
import { PropertiesService } from '@/app/services/properties.service';
import { TaskService } from '@/app/services/task.service';
import { ERecognitionStatus, EUserPropertyType } from '@shared/enum/user.enum';
import {
  IListConversationConfirmProperties,
  IListConvertMultipleTask,
  IParticipant,
  UserConversation
} from '@shared/types/conversation.interface';
import { PluralizePipe } from '@shared/pipes/pluralize';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  ECreatedFrom,
  EMessageComeFromType
} from '@shared/enum/messageType.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { getSummaryMessage } from '@shared/feature/function.feature';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { CompanyService } from '@services/company.service';
import { ActivatedRoute } from '@angular/router';
import { EConversationType, EInboxQueryParams } from '@shared/enum';
import { EAiAssistantAction } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { SmsMessageListService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message.services';

interface ISelectedProperty {
  propertyId: string;
  indexItem: number;
}

@Component({
  selector: 'confirm-properties-popup',
  templateUrl: './confirm-properties-popup.component.html',
  styleUrls: ['./confirm-properties-popup.component.scss']
})
export class ConfirmPropertiesPopupComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  public listOfPeopleInSelectBox: UserPropertyInPeople[] = [];
  public currentPeopleInConversation: CurrentPeopleInConversation;
  public searchInputEmpty = false;
  public hideDropdownPanel: boolean = false;
  private subscribers = new Subject<void>();
  public crtUser: UserPropertyInPeople;
  public userForm: FormGroup;
  public isDisabledProperty: boolean[] = [];
  public dropdownPosition = {};
  public listPropertiesItem = [];
  public itemGroup: FormGroup;
  public calcHeight: number;
  public userPropertyType = EUserPropertyType;
  public submitted: boolean;
  public selectedProperty: ISelectedProperty[] = [];
  public titleWarning: string = '';
  public title: string = '';
  public subTitleWarning: string = '';
  public attachmentTooltipText: string[] = [];
  public scheduleMessageTooltipText: string[] = [];
  public showRequired: boolean = false;
  public isConversationOfMsg: boolean = true;
  public unidentifiedEmail = 'Unidentified email';
  public unrecognisedContact = 'Unrecognised contact';
  public listConversationNotMoveChecked = [];
  readonly EMessageComeFromType = EMessageComeFromType;
  readonly ECreatedFrom = ECreatedFrom;
  readonly EConversationType = EConversationType;
  public isRmEnvironment: boolean = false;
  @ViewChild('selectTaskAndProperty') selectTaskAndProperty: ElementRef;
  @Input() showModal: boolean = false;
  @Input() isActionSyncConversationToRM: boolean = false;
  @Output() quitModal = new EventEmitter<boolean>();
  @Output() onConfirm = new EventEmitter();
  @Input() listConversation: IListConvertMultipleTask;
  @Input() isInTaskOrMessageDetail: boolean = false;
  @Output() selectedPropertyInDetail = new EventEmitter();
  public actionButton: string;
  public hideIconMessage: boolean = false;
  readonly contactTitleVariable = {
    isNoPropertyConversation: false,
    isMatchingPropertyWithConversation: true,
    showPrimaryText: true
  };
  public userRaiseMsg: IParticipant;
  public ERecognitionStatus = ERecognitionStatus;
  public smsPhoneNumber: string = '';

  constructor(
    private readonly elr: ElementRef,
    private propertyService: PropertiesService,
    private fb: FormBuilder,
    private taskService: TaskService,
    private cdref: ChangeDetectorRef,
    private inboxService: InboxService,
    private agencyService: AgencyService,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService,
    private smsMessageListService: SmsMessageListService,
    private activatedRoute: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['listConversation']?.currentValue) {
      if (this.listConversation) {
        if (!this.inboxService.isBackToModalConvertToTask?.getValue()) {
          this.listConversation?.listConversationNotMove.forEach(
            (item, index) => {
              this.itemsFormArray?.push(this.createItemFormGroup(item));
              this.getToolTip(item, index);
              if (
                !item.isTemporaryProperty &&
                item?.propertyId &&
                (window.location.href.includes('detail') ||
                  window.location.href.includes('tasks'))
              ) {
                this.itemsFormArray.controls[index]
                  .get('propertyId')
                  .setValue(item.propertyId);
              }
              item.textContent = getSummaryMessage(
                item,
                this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
              );
              if (
                [EConversationType.SMS, EConversationType.WHATSAPP].includes(
                  item.conversationType
                )
              ) {
                this.userRaiseMsg =
                  this.smsMessageListService.getUserRaiseMsgFromParticipants(
                    item as UserConversation
                  );
                this.smsPhoneNumber =
                  item?.channelUser?.externalId ||
                  item?.externalId ||
                  item?.participants[0]?.externalId ||
                  item?.phoneNumber + '';
              }
            }
          );
        }
      }
    }
  }

  ngOnInit(): void {
    this.propertyService.newCurrentProperty
      .pipe(
        takeUntil(this.subscribers),
        switchMap((currentUser) => {
          this.currentPeopleInConversation = currentUser;
          return this.propertyService.getPropertyBySaveToPt(true);
        })
      )
      .subscribe((listOfPeople) => {
        this.listOfPeopleInSelectBox = listOfPeople;
        this.listOfPeopleInSelectBox?.forEach((el, index) => {
          if (el.id === this.currentPeopleInConversation?.id) {
            this.crtUser = this.listOfPeopleInSelectBox[index];
          }
        });
      });
    this.subcribesCurrentValue();
    this.checkSelectedListConversationNotMove();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.subscribers))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        if (this.isRmEnvironment) {
          this.getTitle(
            this.listConversation.listConversationNotMove,
            this.isActionSyncConversationToRM
          );
        } else {
          this.getTitleInPT();
        }
      });
    const url = this.activatedRoute.snapshot['_routerState']?.url;
    const hideIconMessageKeywords = [
      EInboxQueryParams.VOICEMAIL_MESSAGES,
      EAiAssistantAction.VOICE_MAIL,
      EInboxQueryParams.SMS_MESSAGES,
      EInboxQueryParams.MESSENGER,
      EInboxQueryParams.WHATSAPP
    ];
    this.hideIconMessage = hideIconMessageKeywords.some((keyword) =>
      url.includes(keyword)
    );
  }

  checkSelectedListConversationNotMove() {
    const checkedItems$ = this.itemsFormArray.valueChanges.pipe(
      map((items) => items.filter((item) => item.isChecked))
    );

    checkedItems$
      .pipe(takeUntil(this.subscribers))
      .subscribe((checkedItems) => {
        this.listConversationNotMoveChecked = checkedItems;
      });
  }

  ngAfterViewInit() {
    this.calcHeight = this.selectTaskAndProperty?.nativeElement?.offsetHeight;
    this.cdref.markForCheck();
  }

  getToolTip(item, index) {
    const pluralizeClass = new PluralizePipe();
    this.scheduleMessageTooltipText[index] = item.scheduleMessageCount
      ? `${pluralizeClass.transform(
          item.scheduleMessageCount,
          'message'
        )} scheduled`
      : '';
    this.attachmentTooltipText[index] = item.attachmentCount
      ? `${pluralizeClass.transform(item.attachmentCount, 'attachment')}`
      : '';
  }

  subcribesCurrentValue() {
    const isShowCurrentValue =
      this.inboxService.isBackToModalConvertToTask?.getValue();
    if (isShowCurrentValue) {
      this.taskService
        .getListConfirmProperties()
        .pipe(takeUntil(this.subscribers))
        .subscribe((res) => {
          res?.listConversationNotMove.forEach((item, index) => {
            this.itemsFormArray?.push(
              this.createItemFormGroup({
                ...item,
                isChecked: item.isChecked,
                propertyId: item.propertyId
              })
            );
            this.getControlPropertyOfIndex(index).setValue(item.propertyId);
            this.getControlCheckBoxOfIndex(index).setValue(item.isChecked);
            this.getToolTip(item, index);
            this.isDisabledProperty[index] = !item.isChecked;
          });
        });
    }
  }

  initForm(): void {
    this.userForm = this.fb.group({
      listConversationNotMove: this.fb.array([])
    });
  }

  createItemFormGroup(item: IListConversationConfirmProperties): FormGroup {
    return this.fb.group({
      ...item,
      propertyId: null,
      isChecked: true
    });
  }

  getTitle(
    list: IListConversationConfirmProperties[],
    isActionSyncConversationToRM: boolean
  ) {
    const isSingleProperty = list.length === 1;
    this.title = isSingleProperty ? 'Confirm property' : 'Confirm properties';
    this.titleWarning = isSingleProperty
      ? 'An unidentified property'
      : 'Multiple unidentified properties';
    this.subTitleWarning = isSingleProperty
      ? `Please identify the property or unselect conversation to continue ${
          isActionSyncConversationToRM ? 'syncing messages' : 'creating task'
        }`
      : `Please identify the properties or unselect conversations to continue ${
          isActionSyncConversationToRM ? 'syncing messages' : 'creating tasks'
        }`;
    this.actionButton = 'Next';
  }

  getTitleInPT() {
    this.title = 'Save conversation to Property Tree';
    this.subTitleWarning = 'Please select a property to continue.';
    this.actionButton = 'Confirm';
  }

  checkForUncheckedItems(): void {
    this.itemsFormArray.controls.forEach(
      (itemGroup: FormGroup, index: number) => {
        const isCheckedControl = itemGroup.get('isChecked');
        const propertyControl = itemGroup.get('propertyId');
        if (isCheckedControl && propertyControl) {
          if (isCheckedControl.value && !propertyControl.value) {
            propertyControl.setValidators([Validators.required]);
            itemGroup['isRequired'] = true;
          } else {
            propertyControl.clearValidators();
            itemGroup['isRequired'] = false;
          }
          propertyControl.updateValueAndValidity();
        }
      }
    );
  }

  isRequired(index: number): boolean {
    const itemGroup = this.itemsFormArray.at(index) as FormGroup;
    return itemGroup ? itemGroup['isRequired'] : false;
  }

  onPeopleSelectChanged(e: UserPropertyInPeople, index) {
    if (this.submitted) {
      this.checkForUncheckedItems();
    }
    this.userForm.value?.listConversationNotMove?.map((item, i) => {
      if (i === index) {
        this.listPropertiesItem[i] = {
          regionName: e.region?.name,
          regionId: e.region?.id,
          streetline: e.streetline
        };
      }
    });
    this.hideDropdownPanel = true;

    const searchInput =
      this.selectTaskAndProperty?.nativeElement.querySelectorAll(
        '.search-box#property-select ng-select input'
      );

    searchInput?.forEach((element, i) => {
      searchInput[i]?.blur();
    });
    this.hideLabelSelectProperty();
    this.crtUser = e;
    this.selectedProperty.push({ propertyId: e.id, indexItem: index });
    this.selectedPropertyInDetail.emit(e.id);
    this.propertyService.getPeopleInSelectPeople(e?.id);
  }

  onNext() {
    this.submitted = true;
    this.checkForUncheckedItems();
    const form = this.userForm.value;
    this.showRequired =
      !this.listConversation.listConversationMove?.length &&
      !this.listConversationNotMoveChecked?.length;
    if (this.showRequired || !this.userForm.valid) return;
    form?.listConversationNotMove.forEach((item, index) => {
      item.regionName = this.listPropertiesItem[index]?.regionName;
      item.regionId = this.listPropertiesItem[index]?.regionId;
      item.streetline = this.listPropertiesItem[index]?.streetline;
    });

    const data: IListConversationConfirmProperties[] =
      form?.listConversationNotMove;
    this.taskService.setListConfirmProperties({
      listConversationMove: this.listConversation.listConversationMove,
      listConversationNotMove: data
    });
    this.showModal = false;
    this.quitModal.emit(this.showModal);
    this.onConfirm.emit();
  }

  onQuit() {
    this.showModal = false;
    this.quitModal.emit(this.showModal);
    this.inboxService.isBackToModalConvertToTask.next(false);
  }

  isOpen() {
    document
      .querySelectorAll('.search-box#property-select')
      .forEach((item, index) => {
        this.dropdownPosition[index] = this.getDropdownDirection(item, index);
      });
  }

  getDropdownDirection(element, index) {
    const elementRect = element?.getBoundingClientRect().top;
    const viewportHeight = document
      .querySelector('#form')
      .getBoundingClientRect();
    const parentTop = viewportHeight.top;
    const parentHeight = viewportHeight.height;

    return elementRect < parentTop + parentHeight / 2 ? 'bottom' : 'top';
  }

  hideLabelSelectProperty() {
    const searchLabel = this.elr.nativeElement.querySelector(
      '.search-box#property-select ng-select .ng-value-label'
    );
    searchLabel && (searchLabel.textContent = '');
  }

  handleCheckbox(index: number, event): void {
    if (event.target.checked) {
      this.isDisabledProperty[index] = false;
    } else {
      this.isDisabledProperty[index] = true;
      const itemGroup = this.itemsFormArray.at(index) as FormGroup;
      itemGroup['isRequired'] = false;
    }
  }

  get itemsFormArray(): FormArray {
    return this.userForm?.get('listConversationNotMove') as FormArray;
  }

  getControlPropertyOfIndex(index) {
    return this.itemsFormArray.controls[index].get('propertyId');
  }

  getControlCheckBoxOfIndex(index) {
    return this.itemsFormArray.controls[index].get('isChecked');
  }

  public ngOnDestroy(): void {
    this.subscribers.next();
    this.subscribers.complete();
  }
}
