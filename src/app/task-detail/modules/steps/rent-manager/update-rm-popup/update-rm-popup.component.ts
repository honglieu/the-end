import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subject, BehaviorSubject, takeUntil } from 'rxjs';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { mapComponentToTitle } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { WidgetNoteService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-note.service';
import { IRentManagerIssue } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { mapComponentToPTState } from '@/app/task-detail/modules/steps/constants/constants';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { EPropertyTreeButtonComponent } from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { ERentManagerIssuePopup } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/popup-management.service';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
import {
  RMWidgetDataField,
  ERentManagerType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import dayjs from 'dayjs';
import { RentManagerInspectionFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/services/rent-manager-inspection-form.service';
import { IRentManagerInspection } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/interfaces/rent-manager-inspection.interface';
import { RentManagerNotesFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-notes-form.service';
import { IRentManagerNote } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/interfaces/rent-manager-notes.interface';
import { ENoteSaveToType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/enums/rent-manager-notes.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SharedService } from '@services/shared.service';
import { TenantStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-state.service';
import { ITenantDataRes } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/types';

@Component({
  selector: 'update-rm-popup',
  templateUrl: './update-rm-popup.component.html',
  styleUrls: ['./update-rm-popup.component.scss']
})
export class UpdateRmPopupComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() type = 'default';
  @Output() onClose = new EventEmitter();
  public listSelect = [];
  private unsubscribe = new Subject<void>();
  public selectLabel: string;
  public searchValue: BehaviorSubject<string> = new BehaviorSubject(null);
  public notFoundItemText = 'No results found';
  public selectRMRequest: FormGroup;
  public loadingText = 'Loading...';
  public rmId: string;
  public loadingState = {
    listExistTask: false
  };
  public titleRM: string = '';
  public dataFieldWidget: RMWidgetDataField;
  public componentType:
    | ERentManagerType
    | EPropertyTreeType
    | EPropertyTreeButtonComponent;
  public ENTITY_NAME_MAP = {
    [ENoteSaveToType.TENANT]: 'Tenant',
    [ENoteSaveToType.OWNERSHIP]: 'Owner',
    [ENoteSaveToType.PROPERTY]: 'Property'
  };
  constructor(
    public stepService: StepService,
    public widgetNoteService: WidgetNoteService,
    private popupManagementService: PopupManagementService,
    private widgetRMService: WidgetRMService,
    private rentManagerIssueFormService: RentManagerIssueFormService,
    private rentManagerInspectionFormService: RentManagerInspectionFormService,
    private rentManagerNotesFormService: RentManagerNotesFormService,
    private agencyDateFormatService: AgencyDateFormatService,
    private sharedService: SharedService,
    private tenantState: TenantStateService
  ) {
    this.selectRMRequest = new FormGroup({
      selectExistUpdateRM: new FormControl(null, [Validators.required])
    });
  }

  ngOnInit(): void {
    this.stepService
      .getModalDataPT()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.titleRM = mapComponentToTitle[res.componentType];
        this.dataFieldWidget = mapComponentToPTState[res.componentType];
        this.componentType = res.componentType;
      });

    this.widgetRMService
      .getPopupWidgetState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.visible = res === ERentManagerType.UPDATE_RM_POPUP;
      });

    this.getListWidgetByType();
  }
  getListWidgetByType() {
    this.widgetRMService
      .getRMWidgetStateByType(this.dataFieldWidget)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          switch (this.componentType) {
            case ERentManagerType.ISSUE: {
              this.listSelect = (res as IRentManagerIssue[])
                ?.filter(
                  (issue) =>
                    issue?.syncStatus === ESyncStatus.COMPLETED ||
                    !!issue?.details?.externalId
                )
                ?.map((item) => ({
                  ...item,
                  label: item?.title || ''
                }));
              break;
            }
            case ERentManagerType.INSPECTION: {
              this.listSelect = (res as IRentManagerInspection[])
                ?.filter(
                  (item) =>
                    item?.syncStatus === ESyncStatus.COMPLETED ||
                    !!item?.externalInspectionId
                )
                ?.map((item) => ({
                  ...item,
                  label:
                    [
                      item?.inspectionType.name + ' inspection',
                      item?.userPropertyGroup.name,
                      item.inspectionDate
                        ? dayjs
                            .utc(item.inspectionDate)
                            .format(
                              this.agencyDateFormatService.dateFormat$.getValue()
                                .DATE_FORMAT_DAYJS
                            )
                        : ''
                    ]
                      .filter(Boolean)
                      .join(' - ') || ''
                }));
              break;
            }
            case ERentManagerType.NOTES: {
              this.listSelect = (res as IRentManagerNote[])
                ?.filter((issue) => issue?.syncStatus === ESyncStatus.COMPLETED)
                ?.map((issue) => ({
                  ...issue,
                  label:
                    this.ENTITY_NAME_MAP[issue?.entityType] +
                      ' - ' +
                      issue?.categoryName +
                      ': ' +
                      issue?.description || ''
                }));
              break;
            }
            case ERentManagerType.NEW_TENANT: {
              this.listSelect = (res as ITenantDataRes[])
                ?.filter((item) => item?.syncStatus === ESyncStatus.COMPLETED)
                ?.map((item) => ({
                  ...item,
                  label: this.sharedService.displayName(
                    item.data?.firstName,
                    item?.data?.lastName
                  )
                }));
              break;
            }
            default:
          }
          if (this.listSelect?.length === 1) {
            this.selectRMRequest
              .get('selectExistUpdateRM')
              .setValue(this.listSelect[0].id);
          }
        }
      });
  }

  getDisplayedData(item, componentType) {
    switch (componentType) {
      case ERentManagerType.ISSUE:
        return {
          label: item?.title || '',
          description: ''
        };
      default:
        return { label: '', description: '' };
    }
  }

  handleCloseModal() {
    this.widgetRMService.setModalUpdate(false);
    this.stepService.setCurrentRMStep(null);
    this.visible = false;
    this.resetForm();
    this.onClose.emit();
  }

  handleNext() {
    const selectedId = this.selectRMRequest?.get('selectExistUpdateRM').value;
    const nextData = this.listSelect.find(
      (item) => item.rmId === selectedId || item.id === selectedId
    );
    if (selectedId) {
      switch (this.componentType) {
        case ERentManagerType.ISSUE:
          this.widgetRMService.setModalUpdate(true);
          this.rentManagerIssueFormService.initData(nextData).buildForm();
          this.popupManagementService.setCurrentPopup(
            ERentManagerIssuePopup.RM_ISSUE_POPUP
          );
          this.widgetRMService.setPopupWidgetState(ERentManagerType.ISSUE);
          this.visible = false;
          break;
        case ERentManagerType.INSPECTION:
          this.widgetRMService.setModalUpdate(true);
          this.rentManagerInspectionFormService.initData(nextData).buildForm();
          this.widgetRMService.setPopupWidgetState(ERentManagerType.INSPECTION);
          this.visible = false;
          break;
        case ERentManagerType.NOTES:
          this.widgetRMService.setModalUpdate(true);
          this.rentManagerNotesFormService.initData(nextData).buildForm();
          this.widgetRMService.setPopupWidgetState(ERentManagerType.NOTES);
          break;
        case ERentManagerType.NEW_TENANT:
          this.widgetRMService.setModalUpdate(true);
          this.tenantState.setTenant(nextData);
          this.widgetRMService.setPopupWidgetState(ERentManagerType.NEW_TENANT);
          break;
        default:
          break;
      }
    }

    if (this.listSelect?.length !== 1 && this.selectRMRequest?.invalid) {
      this.selectRMRequest.markAllAsTouched();
      return;
    }
  }

  get selectExistControl() {
    return this.selectRMRequest.get('selectExistUpdateRM');
  }

  resetForm() {
    this.selectRMRequest?.reset();
  }

  ngBlur() {
    if (this.searchValue.value) this.searchValue.next('');
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
