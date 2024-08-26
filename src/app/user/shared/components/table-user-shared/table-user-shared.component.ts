/* eslint-disable prettier/prettier */
import { ownerProspectPageActions } from '@core/store/contact-page/owner-prospect/actions/owner-prospect-page.actions';
import { tenantProspectPageActions } from '@core/store/contact-page/tenant-prospect/actions/tenant-prospect-page.actions';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ETypeToolbar } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TaskEditorListViewService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/task-editor-list-view.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { UserAgentService } from '@/app/user/services/user-agent.service';
import {
  ESelectAllStatus,
  SelectionModelPaging
} from '@/app/user/utils/collections';
import {
  EActionUserType,
  ECheckBoxIcon,
  ERentPropertyStatus,
  ETypePage
} from '@/app/user/utils/user.enum';
import {
  EPagination,
  IProperty,
  ITableColumns,
  eventData,
  itemPerRowOptions
} from '@/app/user/utils/user.type';
@Component({
  selector: 'table-user-shared',
  templateUrl: './table-user-shared.component.html',
  styleUrls: ['./table-user-shared.component.scss']
})
export class TableUserSharedComponent implements OnInit, OnChanges {
  @ViewChild('table', { static: true }) tableItem: ElementRef<HTMLDivElement>;
  @ViewChild(CdkVirtualScrollViewport, { static: false })
  viewPort: CdkVirtualScrollViewport;
  @Input() isShowProperty: Boolean = false;
  @Input() activeMobileApp: Boolean = false;
  @Input() isLoadingMore: Boolean = false;
  @Input() isLoading: Boolean = true;
  @Input() dataTableColumns: ITableColumns[] = [];
  @Input() totalItems: number = 0;
  @Input() totalPages: number = 0;
  @Input() pageIndex: number = 0;
  @Input() typePage: string = ETypePage.TENANTS_LANLORDS;
  @Input() searchValue: string;
  @Input() dataTableDataSource: IProperty[] = [];
  @Output() handleEventRow = new EventEmitter<eventData>();
  @Output() handlePagination = new EventEmitter<EPagination>();
  @Output() onGetListSelectedItem = new EventEmitter();
  public readonly ACTION_TYPE = EActionUserType;
  readonly TYPE_PAGE = ETypePage;
  public ETypePage = ETypePage;
  public parentCheckboxIcon: ESelectAllStatus = ESelectAllStatus.UNSELECTED;
  readonly checkBoxIcon = ECheckBoxIcon;
  public hasActiveSection: Boolean = false;
  public trudiTableDataSource1 = [];
  public itemPerRowOptions = itemPerRowOptions;
  public selectedRowOption = 3;
  public selectionModel = new SelectionModelPaging(true, []);
  public allUsers = [];
  private unsubscribe = new Subject<void>();
  public disableMessage: boolean;
  public syncMailBoxStatus: EMailBoxStatus;
  public isArchiveAllMail = false;
  public isRmEnvironment: boolean = false;
  public isScrolledToBottom: boolean = false;
  readonly EMailBoxStatus = EMailBoxStatus;
  public isContactDeleted: boolean;
  public ERentPropertyStatus = ERentPropertyStatus;

  public listPropertyChecked = [];
  public toolbarConfig = [
    {
      icon: 'mailThin',
      label: 'Message',
      type: EActionUserType.SEND_MSG,
      disabled: false,
      action: () => {
        this.handleActionBasedOnType(this.ACTION_TYPE.SEND_MSG);
      }
    },
    {
      icon: 'iconCloseV2',
      type: ETypeToolbar.Close,
      disabled: false,
      action: () => {
        this.handleClearSelected();
      }
    }
  ];
  public haveRightBorder: boolean = window.innerWidth < 1400;

  constructor(
    public phoneNumberFormat: PhoneNumberFormatPipe,
    private renderer: Renderer2,
    private userAgentService: UserAgentService,
    private inboxSidebarService: InboxSidebarService,
    public inboxService: InboxService,
    private agencyService: AgencyService,
    private taskEditorListViewService: TaskEditorListViewService,
    private companyService: CompanyService,
    private store: Store
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.haveRightBorder = window.innerWidth < 1400;
  }

  public tempDataTable = [];
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataTableDataSource']?.currentValue) {
      this.formatDataCollectionByTypePage(this.typePage);
      this.selectionModel.setAllItems(this.allUsers);
      this.updateTableElement();
    }
  }
  ngOnInit(): void {
    this.resetCollection();
    this.checkAccountAdded();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
  }

  resetCollection() {
    this.userAgentService.resetCollection$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isReset) => {
        if (isReset) {
          this.handleClearSelected();
          this.selectionModel.resetAll();
          this.handleChecked();
        }
      });
  }

  onScrollDown() {
    if (
      this.dataTableDataSource?.length >= this.totalItems ||
      this.pageIndex + 1 >= this.totalPages
    )
      return;

    if (this.pageIndex < this.totalPages) {
      const actionCreator =
        this.typePage === ETypePage.TENANTS_PROSPECT
          ? tenantProspectPageActions
          : ownerProspectPageActions;
      this.store.dispatch(actionCreator.nextPage());
    }
  }

  public get inverseOfTranslation(): string {
    if (!this.viewPort || !this.viewPort['_renderedContentOffset']) {
      return '-0px';
    }
    let offset = this.viewPort['_renderedContentOffset'];
    return `-${offset}px`;
  }

  updateTableElement() {
    const element = this.tableItem.nativeElement;
    if (element.classList.contains('block-height-table')) {
      this.renderer.removeClass(element, 'block-height-table');
    } else {
      this.renderer.addClass(element, 'block-height-table');
    }
  }

  formatDataCollectionByTypePage(typePage: string) {
    switch (typePage) {
      case ETypePage.TENANTS_PROSPECT:
      case ETypePage.TENANTS_LANLORDS:
        for (const item of this.dataTableDataSource) {
          for (const dependency of item?.dependencies) {
            dependency.id = item['propertyId'] + dependency['userPropertyId'];
          }
        }
        this.allUsers = this.dataTableDataSource
          .map((a) => a.dependencies)
          .flat();

        this.tempDataTable = this.dataTableDataSource
          .reduce((acc, cur) => {
            return [
              ...acc,
              ...cur.dependencies.map((item) => ({
                ...item,
                streetline: cur?.streetline,
                id: cur['propertyId'] + item['userPropertyId']
              }))
            ];
          }, [])
          .map((item) => ({
            ...item,
            isChecked: this.selectionModel.isSelected(item)
          }));
        break;
      case ETypePage.LANLORDS_PROSPECT:
        for (const item of this.dataTableDataSource) {
          for (const dependency of item?.dependencies) {
            dependency.id = dependency['userId'];
          }
        }
        this.allUsers = this.dataTableDataSource
          .map((a) => a.dependencies)
          .flat();

        this.tempDataTable = this.dataTableDataSource
          .reduce((acc, cur) => {
            return [
              ...acc,
              ...cur.dependencies.map((item) => ({
                ...item,
                id: item['userId']
              }))
            ];
          }, [])
          .map((item) => ({
            ...item,
            isChecked: this.selectionModel.isSelected(item)
          }));
        break;
      default:
        break;
    }
  }

  handleClearSelected() {
    this.selectionModel.resetAll();
    this.tempDataTable = this.tempDataTable.map((item) => {
      return { ...item, isChecked: false };
    });
    this.taskEditorListViewService.setListToolbarConfig([]);
  }

  onCheckboxChildChange(data: UserProperty) {
    this.selectionModel.toggle(data);
    this.handleSelectionByStatus();
    data['isChecked'] = !data['isChecked'];
    if (this.selectionModel.selected.length) {
      this.taskEditorListViewService.getListToolbarTaskEditor(
        this.toolbarConfig,
        this.selectionModel.selected,
        true
      );
    } else {
      this.taskEditorListViewService.setListToolbarConfig([]);
    }
  }

  handleChecked() {
    this.tempDataTable = this.tempDataTable.map((item) => ({
      ...item,
      isChecked: this.selectionModel.isSelected(item)
    }));
  }

  handleSelectionByStatus() {
    this.parentCheckboxIcon = this.selectionModel.allSelectedStatus();
    this.onGetListSelectedItem.emit(this.selectionModel.selected);
    this.hasActiveSection = this.selectionModel.selected.length > 0;
  }

  identify(index, item) {
    return item.id;
  }

  handleClickAddEmail(item) {
    this.handleEventRow.emit({ type: EActionUserType.ADD_MAIL, data: item });
  }

  handleActionBasedOnType(type: EActionUserType, data?) {
    if (data?.status === 'DELETED' && type !== EActionUserType.PROPERTY) return;
    switch (type) {
      case EActionUserType.APP_INVITE:
      case EActionUserType.SEND_MSG:
      case EActionUserType.DELETE_PERSON:
        this.handleEventRow.emit({
          type: type,
          data: this.selectionModel.selected
        });
        break;
      case EActionUserType.DELETE_SECONDARY_EMAIL:
      case EActionUserType.DELETE_SECONDARY_PHONE:
      case EActionUserType.ROLE:
      case EActionUserType.CRM_STATUS:
      case EActionUserType.NUM_UNIT:
      case EActionUserType.PEOPLE:
      case EActionUserType.EMAIL:
      case EActionUserType.TRUDI_APP:
      case EActionUserType.PHONE_NUMBER:
        this.handleEventRow.emit({ type: type, data: data });
        break;
      case EActionUserType.PROPERTY:
        if (
          !Object.keys(data.propertyDetail || []).length ||
          !data.propertyDetail?.propertyId
        )
          return;
        this.handleEventRow.emit({ type: type, data: data });
        break;
      default:
        break;
    }
  }

  checkAccountAdded() {
    if (!this.inboxSidebarService.isAccountAdded.value) {
      this.disableMessage = true;
    } else {
      this.disableMessage = false;
    }

    this.inboxService
      .getSyncMailBoxStatus()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((status) => {
        this.syncMailBoxStatus = status;
      });

    this.inboxService.listMailBoxs$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((listMails) => {
        if (!listMails) return;
        this.isArchiveAllMail = listMails.every(
          (rs) => rs.status === EMailBoxStatus.ARCHIVE
        );
      });
  }

  ngOnDestroy() {
    this.taskEditorListViewService.setListToolbarConfig([]);
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
