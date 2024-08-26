import { OtherContactService } from './../../../services/orther-contact.service';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FilesService } from '@services/files.service';
import { PopupService, PopupState } from '@services/popup.service';
import { PropertiesService } from '@services/properties.service';
import { UserService } from '@services/user.service';
import {
  IPersonalInTab,
  UserInSelectPeople
} from '@shared/types/user.interface';
import {
  CurrentPeopleInConversation,
  UserPropertyInPeople
} from '@shared/types/user-property.interface';
import {
  EMAIL_PATTERN,
  SELECT_PEOPLE_POPUP_OPEN_FROM,
  TENANCY_STATUS
} from '@services/constants';
import { TaskItemDropdown } from '@shared/types/task.interface';
import { TaskService } from '@services/task.service';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import {
  BindingValueSupplierItemDropdown,
  SupplierItemDropdown,
  Suppliers
} from '@shared/types/agency.interface';
import { ControlPanelService } from '@/app/control-panel/control-panel.service';
import { ConversationService } from '@services/conversation.service';
import { HeaderService } from '@services/header.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ECategoryType } from '@shared/enum/category.enum';
import { LoadingService } from '@services/loading.service';
import { dataTable } from '@shared/types/dataTable.interface';
import {
  OtherContact,
  OtherContactDropdown,
  OtherContactDropdownValue
} from '@shared/types/other-contact.interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import uuid4 from 'uuid4';

enum SelectPeopleTab {
  own_ten = 'Tenant / Landlord',
  supp = 'Supplier',
  external = 'External Email Address'
}

export enum EHeaderTitle {
  SelectPeople = 'Select People',
  SendRequest = 'Who would you like to send this request to?',
  StartConversation = 'Who would you like to start a conversation with?',
  CreateNewTask = 'Create New Task'
}

@Component({
  selector: 'app-select-people-popup',
  templateUrl: './select-people-popup.component.html',
  styleUrls: ['./select-people-popup.component.scss']
})
export class SelectPeoplePopupComponent
  implements OnInit, OnDestroy, OnChanges
{
  @ViewChild('firstTrElement') firstTrElement: ElementRef;
  @ViewChildren('selectEmail') exteralSelect: QueryList<NgSelectComponent>;
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() isOpenSendMessageModal = new EventEmitter<PopupState>();
  @Output() isOpenLikeToSay = new EventEmitter<boolean>();
  @Output() listSelectedUser = new EventEmitter<any>();
  @Output() onBack = new EventEmitter();
  @Input() headerName = EHeaderTitle.SelectPeople;
  @Input() appearanceState = false;
  @Input() isOpenFrom: string;
  @Input() fileSelected: any;
  @Input() taskNameList: TaskItemDropdown[];
  @Input() show: boolean;
  @Input() isForwardTicket?: boolean = false;
  @Input() mode?: string;
  @Input() enableSelectTab? = true;
  @Input() onlyOwnerTenant = false;
  @Input() onlySupplier = false;
  @Input() isKeepSelected = false;
  @Input() backButton: string = '';
  @Input() multiple = true;
  private subscribers = new Subject<void>();
  private propertyId: any;
  private unsubscribe = new Subject<void>();
  public dataTable: BehaviorSubject<dataTable<OtherContact>> =
    new BehaviorSubject({
      items: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 0
    });
  public countCheckBox: number;
  public checkedList = [];
  public selectedUser: UserInSelectPeople[] = [];
  public countCheckNewTask: number;
  public selectedTab = SelectPeopleTab.own_ten;
  public selectPeopleTab = SelectPeopleTab;
  public listSupplierSelect = [];
  public listSuppliers: Suppliers[] = [];
  public selectedSupplier: Suppliers[] = [];
  public selectedContacts: OtherContact[] = [];
  public agencyId = '';
  public listofUser: IPersonalInTab;
  public currentProperty: any;
  public propertyName = '';
  public propertyAddress = '';
  public isExistPendingOrUninvitedStatus = false;
  public listSelectedOwnTen = [];
  public listSelectedSupplier = [];
  public inputEmail$ = new BehaviorSubject<string>('');
  public selectedExternalEmail = [];
  public emailList = [];
  public isNextButton: boolean = false;
  listOfPeopleInSelectBox: UserPropertyInPeople[] = [];
  currentSelectedUser = '';
  inputFocused = false;
  crtUser: UserPropertyInPeople;
  searchInputEmpty = false;
  focusTime = 0;
  currentPeopleInConversation: CurrentPeopleInConversation;
  forwardButtonAction = ForwardButtonAction;
  public selectPeoplePopupOpenFrom = SELECT_PEOPLE_POPUP_OPEN_FROM;
  assignSearchText = '';
  selectedTask: TaskItemDropdown;
  ASSIGN_TO = [
    { label: 'Personal 1', value: 'T' },
    { label: 'Personal 2', value: 'T' },
    { label: 'Personal 3', value: 'T' },
    { label: 'Personal 4', value: 'T' },
    { label: 'Personal 5', value: 'T' }
  ];
  selectedAssignTo = '';
  waitToSetValue1: NodeJS.Timeout;
  waitToSetValue2: NodeJS.Timeout;
  waitToSetValue3: NodeJS.Timeout;
  waitToSetValue4: NodeJS.Timeout;
  userTextWidth = 476;
  emailInvalid: boolean;
  confirmed: boolean;
  public isPropertyEmpty = false;
  isSelectPeopleInvalid: boolean = false;
  public showSelectPropertyForMessage: boolean = false;
  public isNoOwnTenSelected: boolean = false;
  public isNoSupplierSelected: boolean;
  public isNoContactSelected: boolean;
  public isNoEmailSelected: boolean;
  public tenancyId: string;
  public selectPropertyId: string;

  private readonly categoryTenancy = [
    ECategoryType.leaseRenewal,
    ECategoryType.routineInspection
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertiesService,
    private popupService: PopupService,
    public filesService: FilesService,
    public userService: UserService,
    private readonly elr: ElementRef,
    private taskService: TaskService,
    private agencyService: AgencyService,

    private controlPanelService: ControlPanelService,
    private conversationService: ConversationService,
    private headerService: HeaderService,
    private loadingService: LoadingService,
    private mainService: OtherContactService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.onlyOwnerTenant || this.onlySupplier) {
      this.enableSelectTab = false;
    }
    const detectView = changes['appearanceState'];
    this.userTextWidth =
      this.headerName === EHeaderTitle.CreateNewTask ? 516 : 476;
    if (detectView) {
      if (!detectView.currentValue) {
        this.clearAllOfTimer();
      }
    }

    if (changes && this.isOpenFrom && this.show) {
      // check if not task, assign currentSelectedUser
      if (this.isOpenFrom !== 'task') {
        this.currentSelectedUser =
          this.propertyService.newCurrentProperty?.getValue()?.id || '';
      }
    }

    if (this.show && (this.onlySupplier || this.enableSelectTab)) {
      const onlyDataSyncPT = [
        this.forwardButtonAction.askSupplierQuote,
        this.forwardButtonAction.supToTenant
      ].includes(this.mode as ForwardButtonAction);
      this.getListSuppliers('', onlyDataSyncPT)
        .pipe(takeUntil(this.subscribers))
        .subscribe((res) => {
          if (res && res.list) {
            this.listSuppliers = res.list;
            this.listSupplierSelect = this.userService.createSupplierList(
              res.list
            );
          }
        });
    }

    if (
      (this.isOpenFrom &&
        this.isOpenFrom == this.selectPeoplePopupOpenFrom.index) ||
      this.isOpenFrom == this.selectPeoplePopupOpenFrom.file
    ) {
      this.showSelectPropertyForMessage = true;
      this.currentSelectedUser = null;
    }

    this.checkIsNextButton();
  }

  ngOnInit() {
    this.countCheckNewTask = 0;
    const toGetCurrentPeople = combineLatest([
      this.propertyService.listofActiveProp,
      this.propertyService.newCurrentProperty
    ]);
    toGetCurrentPeople.pipe(takeUntil(this.subscribers)).subscribe((e) => {
      const [listOfPeople, currentUser] = e;
      this.listOfPeopleInSelectBox = listOfPeople;
      const searchInput = this.elr.nativeElement.querySelector(
        '.search-box#property-select ng-select input'
      );
      this.currentPeopleInConversation = currentUser;
      this.listOfPeopleInSelectBox.forEach((el, index) => {
        if (el.id === this.currentPeopleInConversation?.id) {
          this.crtUser = this.listOfPeopleInSelectBox[index];
        }
      });
      this.waitToSetValue1 = setTimeout(() => {
        this.hideLabelSelectProperty();
        searchInput &&
          (searchInput.value =
            this.currentPeopleInConversation?.streetline || '');
      }, 30);
    });
    combineLatest(
      this.propertyService.peopleListInSelectPeople$,
      this.userService.tenancyId$
    )
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res) {
          if (res && res.length) {
            this.listofUser = res[0];
            this.tenancyId = res[1];
            this.generateCheckList();
          }
        }
      }); // this.service.get(e.id)

    combineLatest(this.propertyService.peopleList$, this.userService.tenancyId$)
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res && res.length) {
          this.listofUser = { ...res[0] };
          this.tenancyId = res[1];
          this.generateCheckList();
        }
      });
    this.propertyService.currentProperty
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res) {
          this.currentProperty = res;
          this.propertyAddress =
            this.getPropertyName(res) +
            ' ' +
            this.getPropertySuburb(res) +
            this.getPropertyAddress(res);
        }
      });
    this.expandPopupWhenOpenDropdown('property-select');
    this.expandPopupWhenOpenDropdown('task-select');
    this.inputEmail$.pipe(takeUntil(this.subscribers)).subscribe();
    this.getListOtherContacts();
  }

  expandPopupWhenOpenDropdown(id: string) {
    const searchInput = this.elr.nativeElement.querySelector(
      `.search-box#${id} ng-select input`
    );
    if (!searchInput) return;
    searchInput.addEventListener('input', () => {
      this.searchInputEmpty = searchInput.value === '' || !searchInput.value;
    });
    searchInput.addEventListener('click', () => {
      this.focusTime += 1;
      this.focusTime === 1 &&
        searchInput.setSelectionRange(
          searchInput.value.length,
          searchInput.value.length
        );
    });
    searchInput.addEventListener('focus', () => {
      this.onOpenSelect(id, 'focus');
    });
    searchInput.addEventListener('focusout', () => {
      const opened = this.elr.nativeElement.querySelector(
        `.search-box#${id} ng-select.ng-select-opened input`
      );
      if (opened) return;
      this.onOpenSelect(id, 'focusout');
    });
  }

  onOpenSelect(id: string, action = 'focus' || 'focusout') {
    const body = this.elr.nativeElement.querySelector('.body');
    if (body.classList && !body.classList.value.includes('ng-selected')) {
      body.classList.add('ng-selected');
    }
    const searchInput = this.elr.nativeElement.querySelector(
      `.search-box#${id} ng-select input`
    );
    if (!searchInput) {
      return;
    }
    searchInput.setSelectionRange(
      searchInput.value.length,
      searchInput.value.length
    );
    this.inputFocused = action === 'focus';
    this.searchInputEmpty = searchInput.value === '' || !searchInput.value;
  }

  onSearch({ term }: { term: string; items: any[] }) {
    this.assignSearchText = term;
  }

  onSearchTask({ term }: { term: string; items: any[] }) {
    const searchInput = this.elr.nativeElement.querySelector(
      '.search-box#task-select ng-select input'
    );
    if (searchInput.value === '' || !searchInput.value) {
      this.hideLabelSelectTask();
    }
  }

  onSearchProperty({ term }: { term: string; items: any[] }) {
    const searchInput = this.elr.nativeElement.querySelector(
      '.search-box#property-select ng-select input'
    );
    if (searchInput.value === '' || !searchInput.value) {
      this.hideLabelSelectProperty();
    }
  }

  generateCheckList() {
    this.route.paramMap
      .pipe(takeUntil(this.subscribers))
      .subscribe((paramMap) => {
        if (paramMap) {
          this.propertyId = paramMap.get('propertyId');
        }
      });
    this.checkedList = [];
    this.selectedUser = [];
    this.countCheckBox = 0;
    this.isExistPendingOrUninvitedStatus = false;
    if (this.listofUser) {
      this.listofUser.ownerships?.forEach((ownership) => {
        this.checkedList.push({
          id: 'cb-' + ownership.id + '-' + this.isOpenFrom,
          checked: false
        });
        ownership.userProperties.forEach((userProperty) => {
          this.selectedUser.push({
            id: userProperty.user.id,
            type: userProperty.type,
            firstName: userProperty.user.firstName,
            lastName: userProperty.user.lastName,
            status: ownership.status,
            inviteSent: userProperty.user.iviteSent,
            lastActivity: userProperty.user.lastActivity,
            offBoarded: userProperty.user.offBoardedDate,
            propertyId: userProperty.propertyId,
            userPropertyId: userProperty.id,
            groupId: ownership.id,
            checked: false,
            isPrimary: userProperty.isPrimary,
            email: userProperty.user?.email
          });
        });
      });

      if (
        this.isOpenFrom !== this.selectPeoplePopupOpenFrom.index &&
        this.categoryTenancy.includes(
          this.taskService.currentTask$.getValue()?.trudiResponse?.setting
            ?.categoryId as ECategoryType
        )
      ) {
        this.listofUser.tenancies = this.listofUser.tenancies?.filter(
          (el) =>
            el.status !== TENANCY_STATUS.prospect &&
            el.status !== TENANCY_STATUS.vacated
        );
        if (this.tenancyId) {
          this.listofUser.tenancies = this.listofUser.tenancies.filter(
            (el) => el.id === this.tenancyId
          );
        }
      }

      this.listofUser.tenancies?.forEach((tenancy) => {
        this.checkedList.push({
          id: 'cb-' + tenancy.id + '-' + this.isOpenFrom,
          checked: false
        });
        tenancy.userProperties.forEach((userProperty) => {
          this.selectedUser.push({
            id: userProperty.user.id,
            type: userProperty.type,
            firstName: userProperty.user.firstName,
            lastName: userProperty.user.lastName,
            status: tenancy.status,
            inviteSent: userProperty.user.iviteSent,
            lastActivity: userProperty.user.lastActivity,
            offBoarded: userProperty.user.offBoardedDate,
            propertyId: userProperty.propertyId,
            userPropertyId: userProperty.id,
            groupId: tenancy.id,
            checked: false,
            isPrimary: userProperty.isPrimary,
            email: userProperty.user?.email
          });
        });
      });
      this.listofUser.propertyManagers?.forEach((propertyManager) => {
        this.checkedList.push({
          id: 'cb-' + propertyManager.id + '-' + this.isOpenFrom,
          checked: false
        });
        this.selectedUser.push({
          id: propertyManager.user.id,
          firstName: propertyManager.user.firstName,
          lastName: propertyManager.user.lastName,
          inviteSent: propertyManager.user.iviteSent,
          lastActivity: propertyManager.user.lastActivity,
          offBoarded: propertyManager.user.offBoardedDate,
          propertyId: propertyManager.propertyId,
          type: 'AGENT',
          userPropertyId: propertyManager.id,
          groupId: propertyManager.id,
          checked: false,
          email: propertyManager.user?.email
        });
      });
      // if (this.listofUser.propertyManager) {
      //   this.checkedList.push({
      //     id: 'cb-' + this.listofUser.propertyManager.id + '-' + this.isOpenFrom,
      //     checked: false,
      //   });
      //   this.selectedUser.push({
      //     id: this.listofUser.propertyManager.user.id,
      //     firstName: this.listofUser.propertyManager.user.firstName,
      //     lastName: this.listofUser.propertyManager.user.lastName,
      //     inviteSent: this.listofUser.propertyManager.user.iviteSent,
      //     lastActivity: this.listofUser.propertyManager.user.lastActivity,
      //     offBoarded: this.listofUser.propertyManager.user.offBoardedDate,
      //     propertyId: this.listofUser.propertyManager.propertyId,
      //     type: 'AGENT',
      //     userPropertyId: this.listofUser.propertyManager.id,
      //     groupId: this.listofUser.propertyManager.id,
      //     checked: false,
      //   });
      // }
    }
  }

  ngSelectBlur() {
    this.focusTime = 0;
    this.inputFocused = false;
    const searchInput = this.elr.nativeElement.querySelector(
      '.search-box#property-select ng-select input'
    );
    if (!searchInput) {
      return;
    }
    if (searchInput.value === '' || !searchInput.value) {
      this.listOfPeopleInSelectBox.forEach((el, index) => {
        // check currentSelectedUser already has value
        if (
          el.id === this.currentPeopleInConversation?.id &&
          this.currentSelectedUser?.length
        ) {
          this.crtUser = this.listOfPeopleInSelectBox[index];
          this.currentSelectedUser = this.listOfPeopleInSelectBox[index].id;
          this.propertyService.getPeopleInSelectPeople(
            this.currentPeopleInConversation.id
          );
        }
      });
    }

    this.waitToSetValue2 = setTimeout(() => {
      if (this.currentSelectedUser?.length) {
        searchInput.value = this.crtUser.streetline || '';
        this.hideLabelSelectProperty();
      }
    }, 20);

    // check currentSelectedUser already has value
    if (
      JSON.stringify(searchInput.value) !==
        JSON.stringify(this.crtUser?.streetline) &&
      this.currentSelectedUser?.length
    ) {
      this.currentSelectedUser =
        this.propertyService.newCurrentProperty?.getValue()?.id || '';
      this.waitToSetValue3 = setTimeout(() => {
        searchInput.value = this.currentPeopleInConversation?.streetline || '';
        this.hideLabelSelectProperty();
      }, 30);
      this.propertyService.getPeopleInSelectPeople(
        this.currentPeopleInConversation.id
      );
    }
  }

  onTaskSelectChanged(): void {
    this.countCheckNewTask++;
    const searchInput = this.elr.nativeElement.querySelector(
      '.search-box#task-select ng-select input'
    );
    searchInput?.blur();
  }

  onPeopleSelectChanged(e: UserPropertyInPeople): void {
    const searchInput = this.elr.nativeElement.querySelector(
      '.search-box#property-select ng-select input'
    );
    searchInput && (searchInput.value = e?.streetline || '');
    this.hideLabelSelectProperty();
    searchInput.blur();
    this.crtUser = e;
    this.isSelectPeopleInvalid = false;
    this.propertyService.getPeopleInSelectPeople(e?.id);
    this.selectPropertyId = e.id;
  }

  searchPeople(searchText: string, thisItem: UserPropertyInPeople) {
    return thisItem.streetline.toLowerCase().includes(searchText.toLowerCase());
  }

  onCheckboxChange(idRow) {
    const id: string = 'cb-' + idRow + '-' + this.isOpenFrom;
    this.selectedUser.forEach((item) => {
      if (item.userPropertyId === idRow) {
        item.checked = !item.checked;
        if (item.checked) {
          this.countCheckBox++;
        } else {
          this.countCheckBox--;
        }
      }
    });
    const checkListStatus = this.selectedUser.some(
      (sUser) =>
        sUser.checked &&
        (this.userService.getStatusInvite(
          sUser.inviteSent,
          sUser.lastActivity
        ) === 'uninvited' ||
          this.userService.getStatusInvite(
            sUser.inviteSent,
            sUser.lastActivity
          ) === 'pending' ||
          this.userService.getStatusInvite(
            sUser.inviteSent,
            sUser.lastActivity,
            sUser.offBoarded
          ) === 'offboarded')
    );
    this.isExistPendingOrUninvitedStatus = checkListStatus;
    const checkedItems: UserInSelectPeople[] = this.selectedUser.filter(
      (el) => el.status && el.checked
    );
    this.listSelectedOwnTen = checkedItems;
    if (
      this.listSelectedOwnTen.length ||
      this.selectedExternalEmail.length ||
      this.listSelectedSupplier.length
    )
      this.isNoOwnTenSelected = false;
    else this.isNoOwnTenSelected = true;
  }

  getPropertyName(prop) {
    const splitAddress = prop.streetline.split(',');
    let name = `${splitAddress[0]}`;
    if (splitAddress.length > 1) {
      name += ',';
    }
    return name;
  }

  getPropertyAddress(prop) {
    const splitAddress = prop.streetline.split(',');
    if (splitAddress.length < 2) {
      return '';
    }
    splitAddress.shift();
    return splitAddress.join(' ');
  }

  getPropertySuburb(prop) {
    return prop.suburb ? prop.suburb : '';
  }

  // getAvatarOfPrimary(listUser: Personal): string {
  //   if (listUser.type === 'AGENT') {
  //     return listUser.user.firstName ?
  //       (listUser.user.firstName.charAt(0).toUpperCase() + listUser.user.lastName?.charAt(0)?.toUpperCase()) :
  //       listUser.user.lastName.charAt(0).toUpperCase();
  //   }
  //   if (!listUser.userProperties) {
  //     return '';
  //   }
  //   const userProp = listUser.userProperties.find(user => user.isPrimary);
  //   if (userProp && (userProp?.user?.firstName || userProp?.user?.lastName)) {
  //     return userProp.user.firstName ?
  //       (userProp.user.firstName.charAt(0).toUpperCase() + userProp.user.lastName?.charAt(0)?.toUpperCase()) :
  //       userProp.user.lastName.charAt(0).toUpperCase();
  //   }
  //   return '';
  // }

  public isOpenModal(status) {
    this.currentSelectedUser =
      this.propertyService.newCurrentProperty?.getValue()?.id || '';
    status &&
      this.currentPeopleInConversation?.id &&
      this.propertyService.getPeopleInSelectPeople(
        this.currentPeopleInConversation?.id
      );
    const searchInput = this.elr.nativeElement.querySelector(
      '.search-box#property-select ng-select input'
    );
    this.waitToSetValue4 = setTimeout(() => {
      searchInput &&
        (searchInput.value =
          this.currentPeopleInConversation?.streetline || '');
    }, 20);
    if (!status) {
      this.selectedSupplier = [];
      this.listSelectedSupplier = [];
      this.listSelectedOwnTen = [];
      this.selectedContacts = [];
      this.selectedTab = this.selectPeopleTab.own_ten;
      this.isCloseModal.next(status);
      this.generateCheckList();
    }
    this.scrollToTopList();
  }

  public openSendMessageModal() {
    this.confirmed = true;
    const enableNextStep = this.checkSelectPeopleForCreateNewMessage();
    if (!enableNextStep) return;
    if (
      this.isNoSupplierSelected &&
      this.isOpenFrom == this.selectPeoplePopupOpenFrom.index &&
      this.selectedTab == this.selectPeopleTab.supp
    )
      return;
    if (this.isNextButton) {
      // Note: case this.headerName === EHeaderTitle.SendRequest has next button but still want to run this.onConfirm();
      if (this.headerName === EHeaderTitle.SendRequest) {
        this.onConfirm();
      } else {
        this.onNext();
      }
    } else {
      this.onConfirm();
    }
  }

  onConfirm() {
    if (this.taskService.currentTask$.getValue()?.id) {
      this.selectedExternalEmail = this.selectedExternalEmail.map(
        (externalUser) => ({
          ...externalUser,
          propertyId: this.taskService.currentTask$.getValue()?.property?.id
        })
      );
    } else {
      this.selectedExternalEmail = this.selectedExternalEmail.map(
        (externalUser) => ({ ...externalUser, propertyId: '' })
      );
    }
    const checkedItems = [
      ...this.listSelectedOwnTen,
      ...this.listSelectedSupplier,
      ...this.selectedExternalEmail,
      ...this.selectedContacts
    ];
    this.listSelectedUser.next(checkedItems);
    this.selectedTab = this.selectPeopleTab.own_ten;
    this.isOpenSendMessageModal.next({
      display: true,
      resetField: true,
      fileTabNotReset: true
    });
    this.popupService.selectPeople$.next(true);
    this.scrollToTopList();
    if (!this.isKeepSelected) {
      this.selectedSupplier = [];
      this.listSelectedOwnTen = [];
      this.listSelectedSupplier = [];
      this.selectedContacts = [];
      this.generateCheckList();
    }
  }

  onNext() {
    this.listSelectedOwnTen.forEach((ownerSelected) =>
      this.controlPanelService.forwardLandlordData?.owner.push({
        id: ownerSelected.id,
        firstName: ownerSelected.firstName,
        lastName: ownerSelected.lastName
      })
    );
    this.listSelectedUser.next(this.listSelectedOwnTen);
    this.selectedUser = this.selectedUser.map((user) => {
      return { ...user, checked: false };
    });
    if (this.mode === ForwardButtonAction.tkLandlord) {
      this.isOpenLikeToSay.emit(true);
    } else {
      this.isOpenLikeToSay.emit(false);
    }
    this.countCheckBox = 0;
    this.listSelectedOwnTen = [];
  }

  compareFn(item: TaskItemDropdown, selected: TaskItemDropdown) {
    return item === selected;
  }

  scrollToTopList() {
    if (this.firstTrElement) {
      this.firstTrElement.nativeElement.scrollIntoView();
    }
  }

  hideLabelSelectProperty() {
    const searchLabel = this.elr.nativeElement.querySelector(
      '.search-box#property-select ng-select .ng-value-label'
    );
    searchLabel && (searchLabel.textContent = '');
  }

  hideLabelSelectTask() {
    const searchLabel = this.elr.nativeElement.querySelector(
      '.search-box#task-select ng-select .ng-value-label'
    );
    searchLabel && (searchLabel.textContent = '');
  }

  clearAllOfTimer() {
    clearTimeout(this.waitToSetValue1);
    clearTimeout(this.waitToSetValue2);
    clearTimeout(this.waitToSetValue3);
    clearTimeout(this.waitToSetValue4);
  }

  checkIsNextButton() {
    this.isNextButton =
      (this.isOpenFrom === this.selectPeoplePopupOpenFrom.trudi &&
        (this.mode === this.forwardButtonAction.tkLandlord ||
          this.mode === this.forwardButtonAction.sendQuoteLandlord)) ||
      this.mode === this.forwardButtonAction.sendQuoteLandlord ||
      this.headerName === EHeaderTitle.SendRequest;
  }

  checkListChecked() {
    if (this.isOpenFrom == this.selectPeoplePopupOpenFrom.conv) {
      if (this.selectedTab == this.selectPeopleTab.own_ten)
        return this.selectedUser.some((user) => user.checked);
      return true;
    }
    return (
      this.selectedUser.some((user) => user.checked) ||
      this.listSelectedSupplier.some((supplier) => supplier.checked) ||
      !!this.selectedContacts.length ||
      !!this.selectedExternalEmail.length
    );
  }

  public ngOnDestroy(): void {
    this.subscribers.next();
    this.subscribers.complete();
    this.clearAllOfTimer();
  }

  changeConversationTab(selected) {
    this.selectedTab = selected;
  }

  getListSuppliers(searchKey = '', onlyDataSyncPT: boolean) {
    return this.userService.getListSupplier(searchKey, '', '', onlyDataSyncPT);
  }

  onFocusSearchBar() {
    const dropDown = this.elr.nativeElement.querySelector(
      '.supplier-tab .search-box .supplier-select .ng-dropdown-panel'
    );
    dropDown?.setAttribute('data-e2e', 'supplier-list');
  }

  changeSelectedSupplier(e) {
    if (Array.isArray(e) && e?.length) {
      const listSelected = e.map((el) =>
        this.listSuppliers.find((item) => item.id === el.value.topicId)
      );
      this.listSelectedSupplier = [];
      listSelected.forEach((item) => {
        this.listSelectedSupplier.push({
          ...item,
          checked: true,
          propertyId:
            this.selectPropertyId ||
            this.propertyService.currentPropertyId.value
        });
      });
      this.countCheckBox = listSelected.length;
    } else {
      this.listSelectedSupplier.push({
        ...e,
        checked: true,
        propertyId:
          this.selectPropertyId || this.propertyService.currentPropertyId.value
      });
      this.countCheckBox = 1;
    }
    setTimeout(() => {
      const item = this.elr.nativeElement.querySelector(
        '#ask-suppliers-to-quote .ng-select-container .ng-value-container .ng-value'
      );
      item?.setAttribute('data-e2e', 'chosen-supplier-label');
    }, 0);
  }

  searchSupplier(searchText: string, thisItem: SupplierItemDropdown) {
    return (
      thisItem.label.toLowerCase().includes(searchText.toLowerCase()) ||
      thisItem.value.email.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  compareFnSupplier(
    item: SupplierItemDropdown,
    selected: BindingValueSupplierItemDropdown
  ) {
    return item.value.topicId === selected.topicId;
  }

  changeSelectedContact(selectedList) {
    this.selectedContacts = this.selectedContacts.map((item) => ({
      ...item,
      checked: true
    }));
  }

  searchContact(searchText: string, thisItem: OtherContactDropdown) {
    return (
      thisItem.label.toLowerCase().includes(searchText.toLowerCase()) ||
      thisItem.value.email.toLowerCase().includes(searchText.toLowerCase()) ||
      thisItem.value.contactType
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );
  }

  compareFnContact(
    item: OtherContactDropdown,
    selected: OtherContactDropdownValue
  ) {
    return item.value.id === selected.id;
  }

  testEmail(emailAddress) {
    const regExp = EMAIL_PATTERN;
    return regExp.test(emailAddress);
  }

  addEmail(emailAddress: string) {
    const regExp = EMAIL_PATTERN;
    const isValid = regExp.test(emailAddress);
    const uuid = uuid4();
    return {
      checked: true,
      personUserEmail: emailAddress,
      tag: true,
      isValid,
      id: uuid,
      personUserType: EUserPropertyType.EXTERNAL,
      type: EUserPropertyType.EXTERNAL
    };
  }

  removeEmail(id) {
    this.selectedExternalEmail = this.selectedExternalEmail.filter((value) => {
      return value.id !== id;
    });
    this.emailInvalid = this.selectedExternalEmail.some(
      (email) => !email.isValid
    );
  }

  onSelectProperyChange($event) {
    this.isSelectPeopleInvalid = false;
    if (this.currentSelectedUser) {
      this.isPropertyEmpty = false;
    }
    this.isNoOwnTenSelected = true;
  }

  onSelectedExternalEmailChange(event) {
    this.isSelectPeopleInvalid = false;
    const isAllEmailValid = this.selectedExternalEmail.every((email) =>
      this.testEmail(email)
    );
    if (isAllEmailValid || !this.selectedExternalEmail.length) {
      this.emailInvalid = false;
    }
    if (this.selectedExternalEmail.length) this.isNoOwnTenSelected = false;
  }

  onSelectedSupplierChange(event) {
    if (
      event.length &&
      this.isOpenFrom == this.selectPeoplePopupOpenFrom.index
    ) {
      this.isNoOwnTenSelected = false;
      this.isNoSupplierSelected = false;
    }
    if (
      !event.length &&
      !this.selectedExternalEmail.length &&
      !this.listSelectedOwnTen.length
    ) {
      this.isNoOwnTenSelected = true;
    }
  }

  onSelectedContactChange(event) {
    if (
      event.length &&
      this.isOpenFrom == this.selectPeoplePopupOpenFrom.index
    ) {
      this.isNoOwnTenSelected = false;
      this.isNoContactSelected = false;
    }
    if (
      !event.length &&
      !this.selectedExternalEmail.length &&
      !this.listSelectedOwnTen.length
    ) {
      this.isNoOwnTenSelected = true;
    }
  }

  checkSelectPeopleForCreateNewMessage() {
    if (this.isOpenFrom == this.selectPeoplePopupOpenFrom.index) {
      if (
        this.selectedTab == this.selectPeopleTab.own_ten &&
        !this.currentSelectedUser
      ) {
        this.isPropertyEmpty = true;
        return false;
      }
      if (
        this.selectedTab == this.selectPeopleTab.supp &&
        !this.listSelectedSupplier.length
      ) {
        this.isNoSupplierSelected = true;
        return false;
      }
      if (
        this.selectedTab == this.selectPeopleTab.external &&
        !this.selectedExternalEmail.length
      ) {
        this.isNoEmailSelected = true;
        return false;
      }
      this.emailInvalid = this.checkListInputEmailInvalid();
      return !this.emailInvalid;
    }
    if (this.isOpenFrom == this.selectPeoplePopupOpenFrom.conv) {
      if (
        this.selectedTab == this.selectPeopleTab.supp &&
        !this.listSelectedSupplier.length
      ) {
        this.isNoSupplierSelected = true;
        return false;
      }
      if (
        this.selectedTab == this.selectPeopleTab.external &&
        !this.selectedExternalEmail.length
      ) {
        this.isNoEmailSelected = true;
        return false;
      }
      this.emailInvalid = this.checkListInputEmailInvalid();
      return !this.emailInvalid;
    }
    return true;
  }

  checkListInputEmailInvalid() {
    return this.selectedExternalEmail.some((value) => {
      return !value.isValid;
    });
  }

  validateEmail(event: KeyboardEvent | FocusEvent) {
    event.preventDefault();
    if (this.inputEmail$.getValue()) {
      const emailAddress = this.inputEmail$.getValue();
      const uuid = uuid4();
      const regExp = EMAIL_PATTERN;
      const isValid = regExp.test(emailAddress);
      this.selectedExternalEmail = [
        ...this.selectedExternalEmail,
        {
          personUserEmail: emailAddress,
          id: uuid,
          checked: true,
          isValid,
          tag: true,
          personUserType: EUserPropertyType.EXTERNAL,
          type: EUserPropertyType.EXTERNAL
        }
      ];
      const input = this.exteralSelect['first'].element.querySelector(
        '.ng-input input'
      ) as HTMLInputElement;
      input.value = '';
      this.inputEmail$.next('');
    }
    return;
  }

  addChoice(event: KeyboardEvent | FocusEvent) {
    if (event instanceof KeyboardEvent) {
      if (event.key == ',') {
        this.validateEmail(event);
      }
    } else if (event instanceof FocusEvent) {
      this.validateEmail(event);
    }
  }

  handleChangeCheckbox(subId: string) {
    this.onCheckboxChange(subId);
  }

  getListOtherContacts() {
    this.mainService.getList({}).subscribe({
      next: (data: dataTable<OtherContact>) => {
        if (data.items) {
          const result = {
            ...data,
            options: this.userService.formatOtherContactsConversation(
              data.items
            )
          };
          this.dataTable.next(result);
        }
      },
      error: null,
      complete: () => {
        this.loadingService.stopLoading();
      }
    });
  }

  handleBack() {
    this.onBack.emit();
  }
}
