import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  lastValueFrom,
  Subject
} from 'rxjs';
import { filter, finalize, takeUntil, tap } from 'rxjs/operators';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { dataTable } from '@shared/types/dataTable.interface';
import { OtherContact } from '@shared/types/other-contact.interface';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { OtherContactService } from '@services/orther-contact.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { LoadingService } from '@services/loading.service';
import {
  SecondaryEmail,
  SecondaryPhone,
  UserProperty
} from '@shared/types/users-by-property.interface';
import { UserService } from '@services/user.service';
import { PopupService } from '@services/popup.service';
import { HeaderService } from '@services/header.service';
import { CheckBoxImgPath } from '@shared/enum/share.enum';
import { QuitConfirmOpenFrom } from '@shared/components/quit-confirm/quit-confirm.component';
import { EActionUserType, ETypePage } from '@/app/user/utils/user.enum';
import { ETypeToolbar } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TaskEditorListViewService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/task-editor-list-view.service';
import { IOtherContactFilter } from '@/app/user/utils/user.type';
import { SharedService } from '@services/shared.service';
import { CompanyService } from '@services/company.service';
import { UserInfoDrawerService } from '@/app/user/shared/components/drawer-user-info/services/user-info-drawer.service';
import { Store } from '@ngrx/store';
import {
  selectAllOtherContact,
  selectCurrentPageOtherContact,
  selectFetchingMoreOtherContact,
  selectFetchingOtherContact,
  selectIsCompletedScrollOtherContact,
  selectTotalItemsOtherContact,
  selectTotalPagesOtherContact
} from '@core/store/contact-page/other-contact/selectors/other-contact.selectors';
import { otherContactPageActions } from '@core/store/contact-page/other-contact/actions/other-contact-page.actions';

@Component({
  selector: 'other-contact',
  templateUrl: './other-contact.component.html',
  styleUrls: ['./other-contact.component.scss']
})
export class OtherContactComponent implements OnInit, OnDestroy {
  @ViewChild('table', { static: false })
  viewPort: ElementRef;
  private unsubscribe = new Subject<void>();
  public popupModalPosition = ModalPopupPosition;
  public dataTable: BehaviorSubject<dataTable<OtherContact>> =
    new BehaviorSubject({
      items: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 0
    });

  public isCheckAll = false;
  public checkAllIcon = 'checkboxOff';
  public hasItemChecked = false;

  public emailOnOption: SecondaryEmail;
  public phoneOnOption: SecondaryPhone;
  public filter: IOtherContactFilter = {
    page: 0,
    size: 20
  };
  public emailInput = '';
  public isEmail = true;
  public isEmailEmpty = false;
  public isShowModal: boolean;
  public otherContactProperty: OtherContact;
  public addEmailTitle = 'Add email';
  public popupState = {
    showAddEmail: false
  };
  public isShowQuitConfirm = false;
  public isConsole: boolean = false;
  public addEmailErr: string = '';
  public deleteEmailErrorText = {
    title: 'Unable to delete email',
    subText:
      'This email address is in an open conversation. Please resolve the conversation before deleting.',
    btnText: 'OK'
  };
  public showPopupDelete = false;
  public showDeleteEmailError = false;
  public currentAgencyId: string = null;
  public CheckBoxImgPath = CheckBoxImgPath;
  public targetOpenForm: QuitConfirmOpenFrom;
  public isRmEnvironment: boolean = false;
  public isLoadingMore: boolean = false;
  public otherContactData = [];
  public isCompletedScroll: boolean = false;
  public scrollThresholdTable = 100;
  public visible: boolean = false;
  public ETypePage = ETypePage;
  public currentDataUser: UserProperty;
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
  public isLoading: boolean = true;
  public disableDeleteModal: boolean = false;

  constructor(
    private sharedService: SharedService,
    private headerService: HeaderService,
    private mainService: OtherContactService,
    public loadingService: LoadingService,
    private userService: UserService,
    private popupService: PopupService,
    private agencyService: AgencyService,
    private taskEditorListViewService: TaskEditorListViewService,
    private companyService: CompanyService,
    private userInfoDrawerService: UserInfoDrawerService,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.sharedService
      .isGlobalSearching$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((_) => {
        this.visible = false;
      });
    this.updateToolbarConfig();
    this.subscribeDataTable();
    this.onStoreChange();
    this.subscribeCompanyId();
    this.headerService.headerState$.next({
      ...this.headerService.headerState$.value,
      title: 'Other contacts'
    });
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
    this.subscribeAddEmailSecondary();
    this.subscribeDeleteEmailSecondary();
    this.subscribeDeleteUser();
    this.subscribeDeletePhoneNumber();
    this.userInfoDrawerService.sendMsg$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res.state) {
          this.visible = false;
        }
      });
  }

  private subscribeCompanyId() {
    this.companyService
      .getCurrentCompanyId()
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe(() => {
        this.dispatchPayloadChange(this.filter);
      });
  }

  subscribeDeleteEmailSecondary() {
    this.userService.isDeletedEmail$
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe((emailDeletedId) => {
        this.handleMapDataAfterDeleteEmail(emailDeletedId);
      });
  }

  subscribeAddEmailSecondary() {
    this.userService.isAddEmail$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((newEmail) => {
        if (!newEmail) return;
        this.handleMapDataAfterAddEmail(newEmail);
        this.emailOnOption = null;
      });
  }

  handleMapDataAfterDeleteEmail(emailDeletedId) {
    const others = this.dataTable.getValue().items?.map((user) => {
      user.secondaryEmails = user.secondaryEmails.filter(
        (mail) => mail.id !== emailDeletedId
      );
      return user;
    });
    this.dataTable.next({
      ...this.dataTable.getValue(),
      items: others
    });
  }

  handleMapDataAfterAddEmail(newEmail) {
    const others = this.dataTable.getValue()?.items?.map((user) => {
      if (user.id === newEmail.userId) {
        return {
          ...user,
          secondaryEmails: [...user.secondaryEmails, newEmail]
        };
      }
      return user;
    });
    this.dataTable.next({
      ...this.dataTable.getValue(),
      items: others
    });
  }

  subscribeDeleteUser() {
    this.userService
      .isDeleteUser()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.handleClearSelected();
        this.dispatchPayloadChange({ page: 0 });
        this.visible = false;
      });
  }

  subscribeDeletePhoneNumber() {
    this.userService
      .isDeletePhoneNumber()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.dispatchPayloadChange({ page: 0 });
        this.phoneOnOption = null;
      });
  }

  private onStoreChange() {
    const totalItems$ = this.store.select(selectTotalItemsOtherContact);
    const currentPage$ = this.store.select(selectCurrentPageOtherContact);
    const totalPages$ = this.store.select(selectTotalPagesOtherContact);
    const fetching$ = this.store.select(selectFetchingOtherContact).pipe(
      tap((fetching) => {
        this.isLoading !== fetching && (this.isLoading = fetching);
      })
    );
    const fetchingMore$ = this.store
      .select(selectFetchingMoreOtherContact)
      .pipe(
        tap((fetching) => {
          this.isLoadingMore = fetching;
        })
      );
    const isCompletedScroll$ = this.store.select(
      selectIsCompletedScrollOtherContact
    );
    const listOtherContact$ = this.store.select(selectAllOtherContact).pipe(
      tap(async (otherContacts) => {
        const currentPage = await firstValueFrom(currentPage$);
        const isFirstPage = +currentPage === 0;
        this.otherContactData = [...otherContacts];
        if (isFirstPage) {
          this.viewPort?.nativeElement.scrollTo(0, 0);
        }
      })
    );
    combineLatest([
      totalItems$,
      currentPage$,
      totalPages$,
      isCompletedScroll$,
      listOtherContact$,
      fetching$,
      fetchingMore$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        ([
          total,
          currentPage,
          totalPages,
          isCompletedScroll,
          listOtherContact
        ]) => {
          const response = {
            totalItems: total,
            currentPage,
            totalPages,
            isCompletedScroll,
            listOtherContact
          };
          this.applyFilterV2(response);
        }
      );
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  subscribeDataTable() {
    this.loadingService.onLoading();
    this.dataTable.pipe(takeUntil(this.unsubscribe)).subscribe((data) => {
      this.checkHasItemChecked(data);
      this.isCheckingAll(data);
    });
  }

  updateToolbarConfig() {
    this.toolbarConfig = this.toolbarConfig.map((item) => {
      if (item.type === EActionUserType.DELETE_PERSON) {
        return { ...item, disabled: this.isConsole };
      }
      return item;
    });
  }

  /* CHECKLIST */

  checkAllItem() {
    const data = this.dataTable.getValue();
    if (data.items.some((item) => item.checked)) {
      data.items.forEach((item) => (item.checked = false));
    } else {
      data.items.forEach((item) => (item.checked = true));
    }
    this.dataTable.next({ ...data });
  }

  checkHasItemChecked(data: dataTable<OtherContact>) {
    if (data.items.some((item) => item.checked)) {
      this.hasItemChecked = true;
    } else {
      this.hasItemChecked = false;
    }
  }

  isCheckingAll(data: dataTable<OtherContact>) {
    if (data.items.length === 0) return;
    if (data.items.every((item) => item.checked)) {
      this.isCheckAll = true;
      this.checkAllIcon = 'checkboxOn';
    } else if (data.items.some((item) => item.checked)) {
      this.isCheckAll = false;
      this.checkAllIcon = 'checkboxIndeterminate';
    } else {
      this.isCheckAll = false;
      this.checkAllIcon = 'checkboxOff';
    }
  }

  onCheckboxItem(id: string) {
    this.visible = false;
    const data = this.dataTable.getValue();
    const item = data.items.find((item) => item.id === id);
    if (!item) return;
    item.checked = !item.checked;
    this.dataTable.next({ ...data });
    const items = data.items.filter((item) => item.checked);
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
  }

  /* ADD EMAIL */
  handleClickAddEmail(data) {
    this.otherContactProperty = data;
    this.emailInput = '';
    this.isEmailEmpty = false;
    this.handlePopupState({ showAddEmail: true });
  }

  handleAddNewEmail($event) {
    this.addEmailErr = '';
    this.userService
      .addSecondaryEmailToContact(this.otherContactProperty.id, $event, null)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          this.handlePopupState({ showAddEmail: false });
          this.handleMapDataAfterAddEmail(res);
          this.showPopupDelete = false;
        },
        error: (err) => {
          this.addEmailErr = err?.error?.message;
        }
      });
  }

  handleCloseModal() {
    this.handlePopupState({ showAddEmail: false });
  }

  showQuitConfirm(status: boolean) {
    this.isShowQuitConfirm = status;
  }

  onDeleteEmail(emailOnOption: SecondaryEmail) {
    this.emailOnOption = emailOnOption;
    this.popupService.fromDeleteEmail.next(this.emailOnOption.email);
    this.showQuitConfirm(true);
  }

  onDeletePhoneNumber(phoneOnOption: SecondaryPhone) {
    if (this.isConsole) return;
    this.phoneOnOption = phoneOnOption;
    this.popupService.fromDeletePhone.next(this.phoneOnOption.phoneNumber);
    this.showQuitConfirm(true);
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
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            if (!res) return;
            this.dispatchPayloadChange({ page: 0 });
            this.emailOnOption = null;
          });
        break;
      case QuitConfirmOpenFrom.deleteEmail:
        this.userService
          .deleteSecondaryEmail(this.emailOnOption.id)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            this.handleMapDataAfterDeleteEmail(this.emailOnOption.id);
            this.emailOnOption = null;
          });
        break;
    }
  }

  applyFilterV2(response) {
    const { isCompletedScroll, currentPage, listOtherContact } = response;
    this.isCompletedScroll = isCompletedScroll;
    this.dataTable.next({ ...response, items: listOtherContact });
    this.setFilter({ page: currentPage });
  }

  /**
   * FILTER
   * @deprecated
   */
  applyFilter(filter?: IOtherContactFilter, isLoading: boolean = false) {
    if (isLoading) {
      this.loadingService.onLoading();
    }
    this.setFilter(filter);
    this.mainService.getList(this.filter).subscribe({
      next: (data: dataTable<OtherContact>) => {
        const { currentPage, items } = data;
        this.isCompletedScroll = true;
        if (items) {
          const isFirstPage = Number(currentPage) === 0;
          this.otherContactData = [
            ...(isFirstPage ? [] : this.otherContactData),
            ...items
          ];
          this.dataTable.next({ ...data, items: this.otherContactData });
          if (isFirstPage) {
            this.viewPort?.nativeElement.scrollTo(0, 0);
          }
        }
      },
      error: null,
      complete: () => {
        this.isLoadingMore = false;
        this.loadingService.stopLoading();
      }
    });
  }

  setFilter(filter: IOtherContactFilter) {
    if (!filter) return;
    filter = { ...this.filter, ...filter };
    this.filter = filter;
  }

  private dispatchPayloadChange(payload) {
    this.store.dispatch(
      otherContactPageActions.payloadChange({
        payload
      })
    );
  }

  /* DELETE  */

  onDeleteItem() {
    this.showPopupDelete = true;
  }

  async handleDeleteItems() {
    this.disableDeleteModal = true;
    const items = this.dataTable
      .getValue()
      .items.filter((item) => item.checked);
    const otherContactDeleteIds = items.map((item) => item.id);
    const userId = this.userService.userInfo$.value.id;
    this.deleteItems(otherContactDeleteIds, userId);
  }

  async checkDelete(userIds: string[]): Promise<boolean> {
    let response = await lastValueFrom(
      this.mainService.getItemsDisableDelete({ userIds })
    );
    if (response?.length == 0) {
      return true;
    }
    this.showPopupDelete = false;
    return false;
  }

  deleteItems(otherContactDeleteIds: string[], userId: string) {
    this.mainService
      .delete({
        otherContactDeleteIds,
        userId
      })
      .pipe(
        finalize(() => {
          this.showPopupDelete = false;
          this.disableDeleteModal = false;
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe({
        next: () => {
          this.handleClearSelected();
          this.dispatchPayloadChange({ page: 0 });
        },
        error: () => {
          this.disableDeleteModal = false;
        }
      });
  }

  resetDetaultCheckbox() {
    this.hasItemChecked = false;
    this.isCheckAll = false;
    this.checkAllIcon = 'checkboxOff';
    this.dataTable.value.items.some((item) => (item.checked = false));
  }
  handleClearSelected() {
    const data = this.dataTable.getValue();
    if (data.items.some((item) => item.checked)) {
      data.items.forEach((item) => (item.checked = false));
    }
    this.dataTable.next({ ...data });
    this.taskEditorListViewService.setListToolbarConfig([]);
  }

  onScrollDown() {
    const { totalItems, totalPages } = this.dataTable.getValue();
    if (
      this.otherContactData?.length >= totalItems ||
      this.filter.page + 1 >= totalPages
    )
      return;
    const element = this.viewPort?.nativeElement;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (
      distanceFromBottom <= this.scrollThresholdTable &&
      this.filter.page < totalPages &&
      this.isCompletedScroll
    ) {
      this.store.dispatch(otherContactPageActions.nextPage());
    }
  }

  showDeletePopup(event: boolean) {
    this.showPopupDelete = event;
  }

  handleClickUser(user) {
    event.preventDefault();
    this.currentDataUser = user;
    this.visible = true;
  }

  /* DESTROY */

  ngOnDestroy(): void {
    this.taskEditorListViewService.setListToolbarConfig([]);
    this.store.dispatch(otherContactPageActions.exitPage());
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
  @HostListener('keydown.enter', ['$event'])
  handleEnterKey(event: KeyboardEvent) {
    const target = event.target as HTMLDivElement;
    if (!target || !(target instanceof Element) || target.closest('button')) {
      event.stopPropagation();
    } else {
      this.handleClickUser(this.dataTable.getValue().items[target.id]);
    }
  }
}
