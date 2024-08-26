import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { Subject, takeUntil } from 'rxjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { TaskService } from '@services/task.service';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { ISendMsgConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  ETabType,
  IEntityType,
  IFileFromCRM
} from '@shared/components/upload-from-crm/upload-from-crm.interface';
import { UploadFromCRMService } from '@shared/components/upload-from-crm/upload-from-crm.service';
import { CompanyService } from '@/app/services/company.service';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'attach-file-from-crm',
  templateUrl: './attach-file-from-crm.component.html',
  styleUrls: ['./attach-file-from-crm.component.scss']
})
export class AttachFileFromCRMPopupComponent implements OnInit, OnDestroy {
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;

  @Input() visible: boolean = false;
  @Input() isShowBackBtn: boolean = false;
  @Input() backFromCheckList: boolean = false;
  @Input() configs: ISendMsgConfigs = cloneDeep(defaultConfigs);
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() outSelectedFiles = new EventEmitter<IFileFromCRM[]>();
  public searchText: string = '';
  private destroy$ = new Subject<void>();
  queryParam;
  selectedFiles: IFileFromCRM[] = [];
  defaultConfigs: ISendMsgConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      title: 'Attach file'
    }
  };
  dataTabs: IEntityType[] = [];
  labelSkeleton: boolean;
  isLastPage: boolean = false;
  totalPages: number;
  SCROLL_THRESHOLD = 400;
  containerHeight = 283;
  isSubmitted: boolean = false;
  validatePropertyMsg = 'Select at least an option to continue';
  public currentEntityType: IEntityType = { label: ETabType.PROPERTY };
  public listFiles = [];
  public pageIndex = 0;
  public pageSize: number = 20;
  public currentPage: number;
  public totalItems: number;
  private isFilterListOfFiles = false;
  public CRMSystemName = ECRMSystem;
  public currentCompanyCRMSystemName$ =
    this.companyService.currentCompanyCRMSystemName;
  public isLoading = true;
  public isLoadingMore = false;
  private scrolledToBottom = false;
  public currentProperty = this.uploadFromCRMService.getSelectedProperty();

  get popupState() {
    return this.uploadFromCRMService.getPopupState();
  }

  get selectedFilesFromCMS() {
    return this.uploadFromCRMService.getSelectedFiles();
  }

  constructor(
    private agencyService: AgencyService,
    private uploadFromCRMService: UploadFromCRMService,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private companyService: CompanyService
  ) {}

  ngOnInit() {
    this.queryParam = {
      pageIndex: Number(this.pageIndex),
      pageSize: Number(this.pageSize),
      search: this.searchText,
      entityType: this.currentEntityType.label,
      propertyId: this.currentProperty.id
    };
    this.selectedFiles = this.selectedFilesFromCMS;
    this._getDataTabs();
    this.uploadFromCRMService.refreshFilesOption(this.queryParam);
    this._getListOfFiles();
  }

  onCloseSendMsg() {
    this.onClose.emit();
  }

  _getDataTabs() {
    this.currentCompanyCRMSystemName$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          switch (res) {
            case ECRMSystem.PROPERTY_TREE:
              this.dataTabs = [
                {
                  label: ETabType.PROPERTY
                },
                {
                  label: ETabType.TENANCY
                },
                { label: ETabType.OWNERSHIP }
              ];
              break;
            case ECRMSystem.RENT_MANAGER:
              this.dataTabs = [
                {
                  label: ETabType.PROPERTY
                }
              ];
              break;
            default:
              break;
          }
        }
      });
  }

  _getListOfFiles() {
    this.uploadFromCRMService
      .getFilesFromCrmAPI()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            const { list, totalItems, totalPages, currentPage } = res;
            this.currentPage = res.currentPage;
            this.totalItems = totalItems;
            this.totalPages = totalPages;
            if (this.isFilterListOfFiles) {
              const listFiltered = list.map((item) => {
                const isSelected = this.selectedFiles.some(
                  (selectedItem) => selectedItem.id === item.id
                );
                return {
                  ...item,
                  isSelected
                };
              });
              this.listFiles = listFiltered;
              this.isFilterListOfFiles = false;
              this.isLoading = false;
              this.cdr.markForCheck();
            } else {
              this.listFiles = [...this.listFiles, ...list];
              this.isLoadingMore = false;
              this.cdr.markForCheck();
            }
            this.isLastPage =
              currentPage + 1 === totalPages &&
              totalItems === this.listFiles.length;
          }
        },
        error: () => {
          this.isLoading = false;
          this.isLoadingMore = false;
          this.listFiles = [];
        }
      });
  }

  onTriggerClick(isCheck: boolean, event: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (isCheck) {
      this.isSubmitted = true;
      if (this.selectedFiles.length === 0) return;
      if (
        this.popupState.uploadFileFromCRMOutside ||
        this.popupState.uploadFileFromCRM
      ) {
        this.uploadFromCRMService.setPopupState({
          visibleSelect: false,
          visibleAttachFile: false
        });
      }
    } else {
      this.selectedFiles = [];
      if (this.isShowBackBtn) {
        this.uploadFromCRMService.setPopupState({
          visibleSelect: true,
          visibleAttachFile: false
        });
        return;
      }
      this.uploadFromCRMService.setPopupState({
        visibleSelect: false,
        visibleAttachFile: false
      });
    }
    this.selectedFiles = this.selectedFiles?.map((item) => {
      return { ...item, uploaded: true };
    });
    this.outSelectedFiles.emit(this.selectedFiles);
  }

  onScroll() {
    const element = this.viewport?.elementRef.nativeElement;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (
      distanceFromBottom <= this.SCROLL_THRESHOLD &&
      !this.scrolledToBottom &&
      !this.isLoadingMore &&
      !this.isLastPage
    ) {
      this.onLoadMoreEvent();
      this.scrolledToBottom = true;
    } else if (
      distanceFromBottom >= this.SCROLL_THRESHOLD &&
      this.scrolledToBottom
    ) {
      this.scrolledToBottom = false;
    }
  }

  onLoadMoreEvent() {
    this.isLoadingMore = true;
    this.currentPage++;
    this.uploadFromCRMService.refreshFilesOption({
      pageIndex: this.currentPage
    });
  }

  handleSearch(value: string) {
    if (!this.searchText || this.searchText.trim() !== value.trim()) {
      this.searchText = value;
      this.isLoading = true;
      this.uploadFromCRMService.refreshFilesOption({
        search: value,
        pageIndex: 0
      });
      this.isFilterListOfFiles = true;
    }
  }

  setCurrentTab(tabIndex) {
    if (this.currentEntityType.label !== this.dataTabs[tabIndex].label) {
      this.isLoading = true;
      this.currentEntityType = this.dataTabs[tabIndex];
      this.uploadFromCRMService.refreshFilesOption({
        entityType: this.currentEntityType.label,
        pageIndex: 0
      });
      this.isFilterListOfFiles = true;
    }
  }

  handleOptionChange(event: IFileFromCRM) {
    if (event.isSelected) {
      this.selectedFiles.push(event);
    } else {
      this.selectedFiles = this.selectedFiles.filter(
        (item) => item.id !== event.id
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
