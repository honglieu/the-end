import { supplierPageActions } from './../../core/store/contact-page/suppliers/actions/supplier-page.actions';
import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject, combineLatest, firstValueFrom } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  takeUntil,
  tap
} from 'rxjs/operators';
import { ETypeToolbar } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TaskEditorListViewService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/task-editor-list-view.service';
import { PopupService } from '@services/popup.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { QuitConfirmOpenFrom } from '@shared/components/quit-confirm/quit-confirm.component';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { crmStatusType } from '@shared/enum/supplier.enum';
import { combineNames, setPrefixUrl } from '@shared/feature/function.feature';
import {
  SecondaryEmail,
  SecondaryPhone,
  UserProperty
} from '@shared/types/users-by-property.interface';
import {
  SupplierProperty,
  UsersSupplierProperty
} from '@shared/types/users-supplier.interface';
import { EActionUserType, ETypePage } from '@/app/user/utils/user.enum';
import { crmStatus } from './components/supplier-contact-search/supplier-contact-search.component';
import { SupplierContactSearchService } from './services/supplier-contact-search.service';
import { SharedService } from '@services/shared.service';
import { ParamsSuppliers } from '@/app/user/utils/user.type';
import { UserInfoDrawerService } from '@/app/user/shared/components/drawer-user-info/services/user-info-drawer.service';
import { Store } from '@ngrx/store';
import {
  selectAllSupplier,
  selectCurrentPageSupplier,
  selectFetchingMoreSupplier,
  selectFetchingSupplier,
  selectFirstInitialSupplier,
  selectIsCompletedScroll,
  selectTotalItemsSupplier,
  selectTotalPagesSupplier
} from '@core/store/contact-page/suppliers/selectors/supplier.selectors';

@DestroyDecorator
@Component({
  selector: 'supplier',
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.scss']
})
export class SupplierComponent implements OnInit {
  @ViewChild('filterWrapper') filterWrapper: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput') public searchElement: ElementRef;
  @ViewChild('table', { static: false })
  viewPort: ElementRef;
  public totalItems: number = 0;
  public totalPages: number = 0;
  public isLoadingMore: boolean = false;
  public pageIndex: number = 0;
  public searchValue: string = '';
  public searchText: string = '';
  public filterForm: FormGroup;
  public crmStatusType = crmStatusType;
  public crmStatus = crmStatus;
  public crmStatusLabels: object = {};
  public currentCRMPicked: string =
    JSON.parse(localStorage.getItem('SUPPLIER'))?.status ||
    crmStatusType.pending;
  public isCompletedScroll: boolean = false;
  public toolbarConfig = [
    {
      icon: 'deleted',
      label: 'Delete',
      type: EActionUserType.DELETE_PERSON,
      disabled: false,
      action: () => {
        this.onDeleteItem();
      }
    },
    {
      icon: 'iconCloseV2',
      type: ETypeToolbar.Close,
      action: () => {
        this.handleClearSelected();
      }
    }
  ];
  public pageSize: number = 20;
  public dataTable: UsersSupplierProperty;
  public listSupplierProperty: SupplierProperty[];
  public selectedRowOption = 4;
  public emailOnOption: SecondaryEmail;
  public phoneOnOption: SecondaryPhone;
  public isShowQuitConfirm = false;
  public popupModalPosition = ModalPopupPosition;
  public showDeleteEmailError = false;
  public isConsole: boolean = false;
  public deleteEmailErrorText = {
    title: 'Unable to delete email',
    subText:
      'This email address is in an open conversation. Please resolve the conversation before deleting.',
    btnText: 'OK'
  };
  public isShowModal: boolean;
  private subscribers = new Subject<void>();
  public emailInput = '';
  public isEmail = true;
  public isEmailEmpty = false;
  public addEmailTitle = 'Add email';
  public popupState = {
    showAddEmail: false,
    showPopupDelete: false
  };
  public addEmailErr: string = '';
  public checked: boolean = false;
  public isSelectedAll: boolean = false;
  public hasItemChecked: boolean = false;
  public userSelectedObject = {};
  public targetOpenForm: QuitConfirmOpenFrom;
  public isLoading: boolean = true;
  public scrollThresholdTable = 100;
  public haveRightBorder: boolean = window.innerWidth < 1400;
  public selectedAgencyIds: string[];
  public paramsGetList: ParamsSuppliers = {} as ParamsSuppliers;
  public visible: boolean = false;
  public ETypePage = ETypePage;
  public currentDataUser: UserProperty;
  public supplierSelected: string;
  public disableDeleteModal: boolean = false;

  constructor(
    private userService: UserService,
    private popupService: PopupService,
    private supplierContactSearchService: SupplierContactSearchService,
    private taskEditorListViewService: TaskEditorListViewService,
    private sharedService: SharedService,
    private userInfoDrawerService: UserInfoDrawerService,
    private store: Store
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.haveRightBorder = window.innerWidth < 1400;
  }

  itemPerRowChanged(event) {
    if (event) {
      this.pageSize = event.text;
      this.pageIndex = 0;
      this.dispatchPayloadChange(this.paramsGetList);
    }
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.sharedService
      .isGlobalSearching$()
      .pipe(takeUntil(this.subscribers))
      .subscribe((_) => {
        this.visible = false;
      });
    this.updateToolbarConfig();
    this.onStoreChange();
    this.subscribeSupplierFilterChanges();
    this.mapCrmStatusLabel();
    this.subscribeDeleteUser();
    this.subscribeDeletePhoneNumber();
    this.userInfoDrawerService.sendMsg$
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res.state) {
          this.visible = false;
        }
      });
    this.subscribeDeleteEmail();
    this.subscribeAddEmailSecondary();
  }

  subscribeDeleteEmail() {
    this.userService.isDeletedEmail$
      .pipe(takeUntil(this.subscribers), filter(Boolean))
      .subscribe((emailDeletedId) => {
        this.handleMapDataDeleteEmail(emailDeletedId);
      });
  }

  subscribeAddEmailSecondary() {
    this.userService.isAddEmail$
      .pipe(takeUntil(this.subscribers))
      .subscribe((email) => {
        if (!email) return;
        this.handleMapDataAddEmail(email);
      });
  }
  subscribeDeleteUser() {
    this.userService
      .isDeleteUser()
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (!res) return;
        this.dispatchPayloadChange(this.paramsGetList);
        this.handleClearSelected();
        this.visible = false;
      });
  }

  subscribeDeletePhoneNumber() {
    this.userService
      .isDeletePhoneNumber()
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (!res) return;
        this.dispatchPayloadChange(this.paramsGetList);
      });
  }

  subscribeSupplierFilterChanges() {
    combineLatest([
      this.userService
        .getSearchText()
        .pipe(takeUntil(this.subscribers), distinctUntilChanged()),
      this.supplierContactSearchService
        .getSelectedCRMStatus()
        .pipe(takeUntil(this.subscribers), distinctUntilChanged()),
      this.supplierContactSearchService
        .getSelectedAgencyIds()
        .pipe(
          takeUntil(this.subscribers),
          debounceTime(300),
          distinctUntilChanged()
        )
    ])
      .pipe(
        tap(([searchText, selectedCRMStatus, selectedAgencyIds]) => {
          this.paramsGetList.page = 0;
          this.searchValue = searchText?.trim();
          this.paramsGetList.search = searchText?.trim();
          if (selectedCRMStatus) {
            this.currentCRMPicked = selectedCRMStatus;
            this.paramsGetList.crmStatus = selectedCRMStatus;
          }
          if (selectedAgencyIds) {
            this.selectedAgencyIds = selectedAgencyIds;
            this.paramsGetList.agencyIds = selectedAgencyIds;
          }
        })
      )
      .subscribe(() => {
        this.dispatchPayloadChange(this.paramsGetList);
      });
  }

  private dispatchPayloadChange(payload) {
    this.store.dispatch(
      supplierPageActions.payloadChange({
        payload
      })
    );
  }

  private onStoreChange() {
    const totalItems$ = this.store.select(selectTotalItemsSupplier);
    const currentPage$ = this.store.select(selectCurrentPageSupplier);
    const totalPages$ = this.store.select(selectTotalPagesSupplier);
    const firstInitial$ = this.store.select(selectFirstInitialSupplier);
    const fetching$ = this.store.select(selectFetchingSupplier);
    const fetchingMore$ = this.store.select(selectFetchingMoreSupplier).pipe(
      tap((fetching) => {
        this.isLoadingMore = fetching;
      })
    );
    const isCompletedScroll$ = this.store.select(selectIsCompletedScroll);
    const listSupplier$ = this.store.select(selectAllSupplier).pipe(
      tap(async (suppliers) => {
        const currentPage = await firstValueFrom(currentPage$);
        const isFirstPage = +currentPage === 0;
        this.listSupplierProperty = [...suppliers];
        this.listSupplierProperty?.forEach((supplier) => {
          supplier.fullName = combineNames(
            supplier?.firstName,
            supplier?.lastName
          );
        });
        this.isCheckingAll(this.listSupplierProperty);
        if (isFirstPage) {
          this.viewPort?.nativeElement.scrollTo(0, 0);
        }
      })
    );

    combineLatest([firstInitial$, fetching$])
      .pipe(takeUntil(this.subscribers))
      .subscribe(([firstInit, fetching]) => {
        if (firstInit) {
          this.isLoading = true;
        } else {
          this.isLoading !== fetching && (this.isLoading = fetching);
        }
      });

    combineLatest([
      totalItems$,
      currentPage$,
      totalPages$,
      isCompletedScroll$,
      listSupplier$,
      fetchingMore$
    ])
      .pipe(takeUntil(this.subscribers))
      .subscribe(
        ([total, currentPage, totalPages, isCompletedScroll, listSupplier]) => {
          const response = {
            totalItems: total,
            currentPage,
            totalPages,
            isCompletedScroll,
            list: listSupplier
          };
          this.getDataTableV2(response);
        }
      );
  }

  mapCrmStatusLabel() {
    this.crmStatus.forEach(
      (status) => (this.crmStatusLabels[status.status] = status.text)
    );
  }

  updateToolbarConfig() {
    this.toolbarConfig = this.toolbarConfig.map((item) => {
      if (item.type === EActionUserType.DELETE_PERSON) {
        return { ...item, disabled: this.isConsole };
      }
      return item;
    });
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  getDataTableV2(response) {
    const { totalItems, currentPage, totalPages, isCompletedScroll } = response;
    this.isCompletedScroll = isCompletedScroll;
    this.totalItems = +totalItems;
    this.pageIndex = +currentPage;
    this.totalPages = +totalPages;
    this.dataTable = response;
  }

  isCheckingAll(data: SupplierProperty[]) {
    this.isSelectedAll = !data?.every(
      (item) => !item.isSystemCreate || this.userSelectedObject[item.id]
    );
    this.checked = data?.some((item) => this.userSelectedObject[item.id]);
  }

  setCheckBoxValue(id) {
    if (!id) return;
    this.userSelectedObject[id] = !this.userSelectedObject[id];
    this.handleChangeSelected();
  }

  handleChangeSelected() {
    const data = this.listSupplierProperty;
    const items = data.filter((item) => this.userSelectedObject[item.id]);
    const otherContactDeleteIds = items.map((item) => item.id);
    if (otherContactDeleteIds.length) {
      this.taskEditorListViewService.getListToolbarTaskEditor(
        this.toolbarConfig,
        otherContactDeleteIds,
        true
      );
    } else {
      this.taskEditorListViewService.setListToolbarConfig([]);
    }
    this.isCheckingAll(data);
    this.checkHasItemChecked(data);
  }

  onDeleteItem() {
    this.handlePopupState({ showPopupDelete: true });
  }

  async handleDeleteItems() {
    this.disableDeleteModal = true;
    const currentUserId = this.userService.userInfo$.value.id;
    //Return an object key only if value is true
    const filtered = Object.keys(this.userSelectedObject).filter(
      (k) => this.userSelectedObject[k]
    );
    this.deleteItems(filtered, currentUserId);
  }

  deleteItems(supplierDeleteIds: string[], userId: string) {
    this.userService
      .deleteSupplier({ supplierDeleteIds, userId })
      .pipe(
        finalize(() => {
          this.handlePopupState({ showPopupDelete: false });
          this.userSelectedObject = {};
          this.hasItemChecked = false;
          this.disableDeleteModal = false;
        }),
        takeUntil(this.subscribers)
      )
      .subscribe({
        next: () => {
          this.dispatchPayloadChange(this.paramsGetList);
          this.handleClearSelected();
        },
        error: () => {
          this.disableDeleteModal = false;
        }
      });
  }

  checkHasItemChecked(data: SupplierProperty[]) {
    this.hasItemChecked = data.some((item) => this.userSelectedObject[item.id]);
  }

  handleCloseModalDelete() {
    this.handlePopupState({ showPopupDelete: false });
  }

  getUrl(url) {
    return setPrefixUrl(url);
  }

  showQuitConfirm(status: boolean) {
    this.isShowQuitConfirm = status;
  }

  mapDataTable(
    field: keyof Pick<UserProperty, 'secondaryEmails' | 'secondaryPhones'>,
    option: SecondaryPhone & SecondaryEmail
  ) {
    this.listSupplierProperty.every((supplier) => {
      if (supplier?.[field].length && supplier?.[field].includes(option)) {
        supplier[field] = supplier?.[field].filter((val) => val !== option);
        supplier.userIndexRowspan -= supplier.userIndexRowspan > 1 ? 1 : 0;
        //Break loop after delete email
        return false;
      }
      //Continue loop if not found email
      return true;
    });
    option = null;
  }

  onTargetOpenForm(event) {
    this.targetOpenForm = event;
  }

  onDeleteConfirm(event: boolean) {
    if (!event) return;

    switch (this.targetOpenForm) {
      case QuitConfirmOpenFrom.deletePhone:
        this.userService
          .deleteSecondaryPhone(this.phoneOnOption.id)
          .pipe(takeUntil(this.subscribers))
          .subscribe((res) => {
            if (!res) return;
            this.subscribeSupplierFilterChanges();
          });
        break;
      case QuitConfirmOpenFrom.deleteEmail:
        this.userService
          .deleteSecondaryEmail(this.emailOnOption.id)
          .pipe(takeUntil(this.subscribers))
          .subscribe((res) => {
            if (!res) return;
            this.handleMapDataDeleteEmail(this.emailOnOption.id);
          });
        break;
    }
  }

  handleClickAddEmail(data) {
    this.dataTable.list[0] = data;
    this.supplierSelected = data?.id;
    this.emailInput = '';
    this.isEmailEmpty = false;
    this.handlePopupState({ showAddEmail: true });
  }

  handleAddNewEmail($event) {
    this.addEmailErr = '';
    this.userService
      .addSecondaryEmailToContact(this.dataTable.list[0].id, $event, null)
      .pipe(takeUntil(this.subscribers))
      .subscribe({
        next: (res) => {
          this.handleMapDataAddEmail(res);
          this.handlePopupState({ showAddEmail: false });
        },
        error: (err) => {
          this.addEmailErr = err?.error?.message;
        }
      });
  }

  handleMapDataDeleteEmail(emailDeletedId) {
    this.listSupplierProperty = this.listSupplierProperty.map((user) => {
      user.secondaryEmails = user.secondaryEmails.filter(
        (mail) => mail.id !== emailDeletedId
      );
      return user;
    });
  }

  handleMapDataAddEmail(newEmail) {
    const currentSupplier = this.listSupplierProperty.find(
      (supplier) => supplier.id === newEmail.userId
    );

    const newSupplier = {
      ...currentSupplier,
      secondaryEmails: [...currentSupplier.secondaryEmails, newEmail]
    };
    this.listSupplierProperty = this.listSupplierProperty.map((item) => {
      if (item.id === currentSupplier.id) {
        return newSupplier;
      }
      return item;
    });
  }

  handleCloseModal() {
    this.handlePopupState({ showAddEmail: false });
  }

  onDeleteEmail(emailOnOption: SecondaryEmail) {
    this.emailOnOption = emailOnOption;
    this.popupService.fromDeleteEmail.next(this.emailOnOption.email);
    this.showQuitConfirm(true);
  }

  onDeletePhoneNumber(phoneOnOption: SecondaryPhone) {
    this.phoneOnOption = phoneOnOption;
    this.popupService.fromDeletePhone.next(this.phoneOnOption.phoneNumber);
    this.showQuitConfirm(true);
  }

  handleUpdateFavourite(isFavourite: boolean, idUserSupplier: string) {
    event.stopPropagation();
    this.userService
      .updateFavouriteSupplier(idUserSupplier, isFavourite)
      .pipe(takeUntil(this.subscribers))
      .subscribe({
        next: () => {
          this.listSupplierProperty = this.listSupplierProperty.map((item) =>
            item.id === idUserSupplier
              ? { ...item, isFavourite: isFavourite }
              : item
          );
        }
      });
  }

  isActiveCrmStatus(status: string) {
    return status === crmStatusType.pending;
  }

  onScrollDown() {
    const { totalItems, totalPages } = this.dataTable;
    if (
      this.listSupplierProperty.length >= totalItems ||
      (this.pageIndex as number) + 1 >= totalPages
    )
      return;
    const element = this.viewPort?.nativeElement;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (
      distanceFromBottom <= this.scrollThresholdTable &&
      this.pageIndex < totalPages &&
      this.isCompletedScroll &&
      !this.isLoadingMore
    ) {
      this.store.dispatch(supplierPageActions.nextPage());
    }
  }

  handleClearSelected() {
    const data = this.listSupplierProperty;
    if (data.some((item) => this.userSelectedObject[item.id])) {
      data.forEach((item) => (this.userSelectedObject[item.id] = false));
    }
    this.taskEditorListViewService.setListToolbarConfig([]);
  }

  handleClickSupplier(user) {
    event.preventDefault();
    if (user?.status === 'DELETED') return;
    this.currentDataUser = user;
    this.visible = true;
  }

  ngOnDestroy() {
    this.taskEditorListViewService.setListToolbarConfig([]);
    this.store.dispatch(supplierPageActions.exitPage());
    this.subscribers.next();
    this.subscribers.complete();
  }
}
