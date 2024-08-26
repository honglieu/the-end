import { BehaviorSubject, Observable, distinctUntilChanged, of } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  EPropertyTreeOption,
  EPropertyTreeType,
  ESyncStatus,
  IWidgetLease,
  IWidgetVacate
} from '@/app/task-detail/utils/functions';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import {
  EPTWidgetStatus,
  PTWidgetData,
  PTWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { InspectionSyncData } from '@shared/types/routine-inspection.interface';
import { PtNote } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/note/sync-note-popup/note-sync.interface';
import { LeasingWidgetRequestTrudiResponse } from '@shared/types/trudi.interface';
import { Compliance } from '@shared/types/compliance.interface';
import {
  EInvoiceTypeBS,
  InvoiceDataReq
} from '@shared/types/tenancy-invoicing.interface';
import { IMaintenanceRequest } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-request.interface';
import { IMaintenanceInvoice } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-invoice.interface';
import { EntryNoticeData } from '@shared/types/entry-notice.interface';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';

@Injectable({
  providedIn: 'root'
})
export class WidgetPTService {
  public popupWidgetState$: BehaviorSubject<
    EPropertyTreeType | EPropertyTreeOption
  > = new BehaviorSubject<EPropertyTreeType | EPropertyTreeOption>(null);
  public idTenancies$: BehaviorSubject<string> = new BehaviorSubject<string>(
    null
  );
  public openPopupFrom: BehaviorSubject<string> = new BehaviorSubject(null);
  public widgetPTStateBS = new BehaviorSubject(null);
  public widgetPTState$ = this.widgetPTStateBS.asObservable();
  public isEmptyWidgetState: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public routineInspections: BehaviorSubject<InspectionSyncData[]> =
    new BehaviorSubject([]);
  public outgoingInspections: BehaviorSubject<InspectionSyncData[]> =
    new BehaviorSubject([]);
  public entryNotices: BehaviorSubject<EntryNoticeData[]> = new BehaviorSubject(
    []
  );
  public ingoingInspections: BehaviorSubject<InspectionSyncData[]> =
    new BehaviorSubject([]);
  public notes: BehaviorSubject<PtNote[]> = new BehaviorSubject([]);
  public leasing: BehaviorSubject<LeasingWidgetRequestTrudiResponse[]> =
    new BehaviorSubject([]);
  public leaseRenewals: BehaviorSubject<IWidgetLease[]> = new BehaviorSubject(
    []
  );
  public tenantVacates: BehaviorSubject<IWidgetVacate[]> = new BehaviorSubject(
    []
  );
  public tenancyInvoices: BehaviorSubject<InvoiceDataReq[]> =
    new BehaviorSubject([]);
  public creditorInvoices: BehaviorSubject<InvoiceDataReq[]> =
    new BehaviorSubject([]);
  public triggerOpenWidget: BehaviorSubject<void> = new BehaviorSubject<void>(
    null
  );
  public compliances: BehaviorSubject<Compliance[]> = new BehaviorSubject([]);
  // Maintenance
  public maintenanceRequest: BehaviorSubject<IMaintenanceRequest[]> =
    new BehaviorSubject<IMaintenanceRequest[]>([]);
  public maintenanceInvoice: BehaviorSubject<IMaintenanceInvoice[]> =
    new BehaviorSubject<IMaintenanceInvoice[]>([]);
  public setOpenModal$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public updatePTWidget$ = new BehaviorSubject(null);

  public ptWidgetField = PTWidgetDataField;

  private _totalWidgetData: BehaviorSubject<number> = new BehaviorSubject(0);
  public totalWidgetData$ = this._totalWidgetData
    .asObservable()
    .pipe(distinctUntilChanged());

  constructor(
    public stepService: StepService,
    private apiService: ApiService,
    private trudiDynamicParamater: TrudiDynamicParameterService
  ) {}

  getPopupWidgetState(): Observable<EPropertyTreeType | EPropertyTreeOption> {
    return this.popupWidgetState$.asObservable();
  }

  setPopupWidgetState(value: EPropertyTreeType | EPropertyTreeOption) {
    this.popupWidgetState$.next(value);
  }

  getTenanciesID(): Observable<string> {
    return this.idTenancies$.asObservable();
  }

  setTenanciesID(value: string) {
    this.idTenancies$.next(value);
  }

  ptWidgetFields$() {
    return Object.values(this.ptWidgetField)
      .filter((field) => this[field])
      .map((field) => {
        return this.getPTWidgetStateByType(field);
      });
  }

  refreshWidgetFields() {
    Object.values(this.ptWidgetField)
      .filter((field) => this[field])
      .forEach((field) => {
        this[field].next([]);
      });
    this._totalWidgetData.next(0);
  }

  updateIsEmptyPTWidget(action: 'UPDATE' | 'REMOVE') {
    let isEmptyCurrent = this.isEmptyWidgetState.getValue();
    switch (action) {
      case 'REMOVE': {
        if (!isEmptyCurrent) {
          this.changeIsEmptyPTWidget();
        }
        break;
      }
      default: {
        if (isEmptyCurrent) {
          this.isEmptyWidgetState.next(false);
        }
      }
    }
  }

  changeIsEmptyPTWidget() {
    this.isEmptyWidgetState.next(
      Object.values(this.ptWidgetField).every(
        (item) => this[item].getValue().length === 0
      )
    );
  }

  setEmptyPTWidgetState(isEmpty: boolean) {
    this.isEmptyWidgetState.next(isEmpty);
  }

  getEmptyPTWidgetState() {
    return this.isEmptyWidgetState.asObservable();
  }

  setPTWidgetState(data: PTWidgetData) {
    if (data) {
      const newData = { ...data };
      delete newData.noPTWidgetData;
      Object.keys(newData).forEach((item) => {
        if (item === 'invoices') {
          this.tenancyInvoices.next(
            data[item].filter(
              (item) => item.invoiceWidgetType === EInvoiceTypeBS.TENANCY
            )
          );
          this.creditorInvoices.next(
            data[item].filter(
              (item) => item.invoiceWidgetType === EInvoiceTypeBS.CREDITOR
            )
          );
          return;
        }
        this[item] && this[item].next(data[item]);
        if (item === 'leaseRenewals') {
          data[item].length && this.leaseRenewals.next([data[item][0]]);
        }
        if (item === 'tenantVacates') {
          data[item].length && this.tenantVacates.next([data[item][0]]);
        }
        const dataWidget = [...data[item]].find(
          (item) =>
            item?.syncStatus !== ESyncStatus.INPROGRESS &&
            (item?.syncStatus === ESyncStatus.COMPLETED ||
              item?.status === EPTWidgetStatus.COMPLETED ||
              item?.status === ESyncStatus.COMPLETED ||
              item?.status === EPTWidgetStatus.OPEN)
        );
        if (item === PTWidgetDataField.LINKED_ACTIONS) {
          const summaryContent = {
            summaryNote:
              this.trudiDynamicParamater.getRequestSummaryFromActionItem(
                data[item]?.[0]
              ),
            summaryPhotos: data[item]?.[0]?.ticketFiles
          };
          this.stepService.setSummaryContent(summaryContent);
        }
        this.trudiDynamicParamater.setDynamicParamaterPTWidget(
          item,
          dataWidget
        );
      });
      this.getTotalWidgetData();
    }
  }

  setPTWidgetStateByType(
    type: PTWidgetDataField,
    action: 'UPDATE' | 'REMOVE',
    data
  ) {
    this[type].next(data);
    this.setOpenWidget();
    this.updateIsEmptyPTWidget(action);
    this.getTotalWidgetData();
    const completedItem = data
      .filter((item) => {
        if (
          type === PTWidgetDataField.CREDITOR_INVOICES ||
          type === PTWidgetDataField.TENANCY_INVOICES
        ) {
          return false;
        } else {
          return true;
        }
      })
      .find(
        (item) =>
          item?.syncStatus !== ESyncStatus.INPROGRESS &&
          (item?.syncStatus === ESyncStatus.COMPLETED ||
            item?.status === EPTWidgetStatus.COMPLETED ||
            item?.status === ESyncStatus.COMPLETED ||
            item?.status === EPTWidgetStatus.OPEN)
      );
    if (!completedItem) return;
    this.trudiDynamicParamater.setDynamicParamaterPTWidget(type, completedItem);
  }

  getTotalWidgetData() {
    const total = Object.values(this.ptWidgetField).reduce((total, item) => {
      if (!this[item]) return total;
      return total + this[item].getValue().length;
    }, 0);
    this._totalWidgetData.next(total);
  }

  getPTWidgetStateByType<
    T extends
      | IMaintenanceRequest[]
      | IMaintenanceInvoice[]
      | InspectionSyncData[]
      | Compliance[]
      | LeasingWidgetRequestTrudiResponse[]
      | InvoiceDataReq[]
      | PtNote[]
      | IWidgetLease[]
      | IWidgetVacate[]
      | EntryNoticeData[]
  >(type: PTWidgetDataField): Observable<T> {
    if (!type) return of();
    return this[type].asObservable() as Observable<T>;
  }

  getOpenWidget() {
    return this.triggerOpenWidget.asObservable();
  }

  setOpenWidget() {
    return this.triggerOpenWidget.next();
  }

  getFullDataPTWidget(taskId: string): Observable<PTWidgetData> {
    if (!taskId) return of(null);
    return this.apiService.getAPI(
      conversations,
      `widget/get-list-widget?taskId=${taskId}`
    );
  }

  getModalUpdate() {
    return this.setOpenModal$.asObservable();
  }

  setModalUpdate(data: boolean) {
    this.setOpenModal$.next(data);
  }

  getUpdatePTWidget() {
    return this.updatePTWidget$.asObservable();
  }

  setUpdatePTWidget(data) {
    this.updatePTWidget$.next(data);
  }
}
