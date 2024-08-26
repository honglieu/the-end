import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { isEqual } from 'lodash-es';
import {
  Observable,
  Subject,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  lastValueFrom,
  map,
  of,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { LoadingService } from '@services/loading.service';
import { PropertiesService } from '@services/properties.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { TaskService } from '@services/task.service';
import { MenuItem } from '@/app/task-detail/utils/functions';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  ERentManagerType,
  RMWidgetDataField
} from './enums/widget-rent-manager.enum';
import { ERentManagerIssuePopup } from './modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { PopupManagementService } from './modules/rent-manager-issue/services/popup-management.service';
import { RentManagerIssueFormService } from './modules/rent-manager-issue/services/rent-manager-issue-form.service';
import {
  ERentManagerOption,
  RMWidgetData
} from './modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { WidgetRMService } from './services/widget-rent-manager.service';
import { WIDGET_DESCRIPTION } from '@/app/task-detail/modules/steps/constants/widget.constants';
import { EWidgetSectionType } from '@shared/enum/widget.enum';
import { WidgetLinkedService } from '@/app/task-detail/modules/sidebar-right/services/widget-linked.service';

@Component({
  selector: 'widget-rent-manager',
  templateUrl: './widget-rent-manager.component.html',
  styleUrls: ['./widget-rent-manager.component.scss'],
  providers: [LoadingService]
})
export class WidgetRentManagerComponent implements OnInit, OnDestroy {
  @Input() isNoPropertyTask: boolean;
  public isExpandAttachments: boolean = true;
  public noData: boolean = false;
  public typePopup: ERentManagerType | ERentManagerOption = null;
  public typeRentManager = ERentManagerType;
  public itemsCounts: number = 0;
  public currentPropertyId: string;
  private unsubscribe = new Subject<void>();
  menuItems: MenuItem[] = [
    {
      label: 'Issue',
      type: ERentManagerType.ISSUE
    },
    {
      label: 'Inspection',
      type: ERentManagerType.INSPECTION
    },
    {
      label: 'Notes',
      type: ERentManagerType.NOTES
    },
    {
      label: 'Lease renewal',
      type: ERentManagerType.LEASE_RENEWAL
    },
    {
      label: 'Vacate details',
      type: ERentManagerType.VACATE_DETAIL
    },
    {
      label: 'New tenant',
      type: ERentManagerType.NEW_TENANT
    }
  ];
  public readonly WIDGET_DESCRIPTION = WIDGET_DESCRIPTION;
  public readonly EWidgetSectionType = EWidgetSectionType;

  constructor(
    public loadingService: LoadingService,
    private taskService: TaskService,
    private widgetRMService: WidgetRMService,
    private popupManagementService: PopupManagementService,
    private rentManagerIssueFormService: RentManagerIssueFormService,
    private stepService: StepService,
    private propertyService: PropertiesService,
    private widgetLinkedService: WidgetLinkedService,
    private rxWebsocketService: RxWebsocketService
  ) {}

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngOnInit(): void {
    this.loadingService.onLoading();
    this.subscribeGetPopupWidgetState();
    this.subscribeCurrentTask();
    this.subscribeEmptyWidgetState();
    this.getAllListEntities();
    this.subscribeSocketRmTenant();
    this._reloadData();
    this.getTotalWidgetData();
  }

  private _setWidgetState(data: RMWidgetData) {
    if (data) {
      this.widgetRMService.setRMWidgetState(data);
      if (data.noPTWidgetData) {
        this.widgetRMService.setEmptyPTWidgetState(true);
      } else {
        this.widgetRMService.setEmptyPTWidgetState(false);
      }
      //TODO: set dynamic paramater PT
      this.loadingService.stopLoading();
    }
  }

  subscribeGetPopupWidgetState() {
    this.widgetRMService
      .getPopupWidgetState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((state) => {
        if (state && typeof state === 'object' && 'type' in state) {
          this.typePopup = state.type;
        } else {
          this.typePopup = state;
        }
      });
  }

  subscribeEmptyWidgetState() {
    this.widgetRMService
      .getEmptyPTWidgetState()
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((isEmpty) => {
        this.noData = isEmpty;
      });
  }

  subscribeCurrentTask() {
    this.taskService.currentTask$
      .pipe(
        takeUntil(this.unsubscribe),
        filter(
          (task) =>
            !this.currentPropertyId ||
            this.currentPropertyId !== task?.property?.id
        ),
        switchMap((task) => {
          this.currentPropertyId = task?.id;
          return task?.id
            ? this.widgetRMService.getFullDataRMWidget(task?.id)
            : of(null);
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this._setWidgetState(data);
          }
        },
        error: () => {
          this.loadingService.stopLoading();
        }
      });
  }

  getTotalWidgetData() {
    this.widgetRMService.totalWidgetData$.subscribe((res) => {
      this.itemsCounts = res;
    });
  }

  isMenuDisable(type: ERentManagerType): boolean {
    let isDisable = true;
    switch (type) {
      case ERentManagerType.LEASE_RENEWAL: {
        if (!this.widgetRMService.leaseRenewals?.value?.length) {
          isDisable = false;
        }
        break;
      }
      case ERentManagerType.VACATE_DETAIL: {
        if (!this.widgetRMService.tenantVacates?.value?.length) {
          isDisable = false;
        }
        break;
      }
      default:
        isDisable = false;
    }
    return isDisable;
  }

  trigerRentManager(type: ERentManagerType) {
    let isBreakFunction = false;
    switch (type) {
      case ERentManagerType.ISSUE: {
        this.rentManagerIssueFormService.buildForm();
        this.popupManagementService.setCurrentPopup(
          ERentManagerIssuePopup.RM_ISSUE_POPUP
        );
        break;
      }
      case ERentManagerType.LEASE_RENEWAL: {
        if (this.widgetRMService.leaseRenewals?.value?.length > 0) {
          isBreakFunction = true;
        }
        break;
      }
      case ERentManagerType.VACATE_DETAIL: {
        if (this.widgetRMService.tenantVacates?.value?.length > 0) {
          isBreakFunction = true;
        }
        break;
      }
      default:
        break;
    }
    if (isBreakFunction) {
      return;
    }
    this.stepService.setCurrentRMStep(null);
    this.widgetRMService.setPopupWidgetState(type);
  }

  getTooltipText(type: ERentManagerType): string {
    var tooltipText = '';
    switch (type) {
      case ERentManagerType.LEASE_RENEWAL: {
        if (this.widgetRMService.leaseRenewals?.value?.length > 0) {
          tooltipText = 'Lease renewal is already linked to this task';
        }
        break;
      }
      case ERentManagerType.VACATE_DETAIL: {
        if (this.widgetRMService.tenantVacates?.value?.length > 0) {
          tooltipText = 'A vacate details is already existed in this task';
        }
        break;
      }
    }
    return tooltipText;
  }

  getMenuClass(type: ERentManagerType): string {
    var className = 'disabled-widget-text';
    switch (type) {
      case ERentManagerType.ISSUE: {
        className = '';
        break;
      }
      case ERentManagerType.LEASE_RENEWAL: {
        if (!this.widgetRMService.leaseRenewals?.value?.length) {
          className = '';
        }
        break;
      }
      case ERentManagerType.VACATE_DETAIL: {
        if (!this.widgetRMService.tenantVacates?.value?.length) {
          className = '';
        }
        break;
      }
      default: {
        className = '';
        break;
      }
    }
    return className;
  }

  handleCreateNew(e: MouseEvent) {
    e.stopPropagation();
  }
  getAllListEntities() {
    this.propertyService.currentPropertyId
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.propertyService.getPeopleInSelectPeople(res);
      });
  }

  subscribeSocketRmTenant() {
    this.rxWebsocketService.onSocketSyncRmWidget
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged((previous, current) => isEqual(previous, current))
      )
      .subscribe((res) => {
        if (res.taskId === this.taskService.currentTaskId$.getValue()) {
          this._getListWidget();
        }
      });
  }

  // TODO: hotfix, will be improve
  private _reloadData() {
    const vacate$ = this.widgetRMService.getRMWidgetStateByType<any>(
      RMWidgetDataField.VACATE_DETAIL
    );

    const lease$ = this.widgetRMService.getRMWidgetStateByType<any>(
      RMWidgetDataField.LEASE_RENEWAL
    );

    const tenant$ = this.widgetRMService.getRMWidgetStateByType<any>(
      RMWidgetDataField.NEW_TENANT
    );

    const watchToReload = <T>(ob: Observable<T>) => {
      ob.pipe(
        takeUntil(this.unsubscribe),
        map((arr) => arr?.[0]?.firstTimeSyncSuccess),
        distinctUntilChanged(),
        tap((value) => value && this._getListWidget())
      ).subscribe();
    };

    watchToReload(vacate$);
    watchToReload(lease$);
    watchToReload(tenant$);
  }

  private async _getListWidget() {
    const taskId = await firstValueFrom(this.taskService.currentTaskId$);
    if (!taskId) return;
    const data = await lastValueFrom(
      this.widgetRMService.getFullDataRMWidget(taskId)
    );
    this._setWidgetState(data);
  }
}
