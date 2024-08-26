import { Injectable } from '@angular/core';
import dayjs from 'dayjs';
import { BehaviorSubject, Observable, distinctUntilChanged, of } from 'rxjs';
import { ApiService } from '@services/api.service';
import { IRentManagerInspection } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/interfaces/rent-manager-inspection.interface';
import { ESyncStatus, IWidgetLease } from '@/app/task-detail/utils/functions';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { conversations } from 'src/environments/environment';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { IRentManagerIssue } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import {
  EPTWidgetStatus,
  ERentManagerOption,
  RMWidgetData
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { IRentManagerNote } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/interfaces/rent-manager-notes.interface';
import { ITenantDataRes } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/types';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';

@Injectable({
  providedIn: 'root'
})
export class WidgetRMService {
  public popupWidgetState$: BehaviorSubject<
    ERentManagerType | ERentManagerOption
  > = new BehaviorSubject<ERentManagerType | ERentManagerOption>(null);
  public widgetRMStateBS = new BehaviorSubject(null);
  public widgetRMState$ = this.widgetRMStateBS.asObservable();
  public isEmptyWidgetState: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public triggerOpenWidget: BehaviorSubject<void> = new BehaviorSubject<void>(
    null
  );
  public leaseRenewals: BehaviorSubject<IWidgetLease[]> = new BehaviorSubject(
    []
  );
  public rmIssues: BehaviorSubject<IRentManagerIssue[]> = new BehaviorSubject(
    []
  );
  public rmInspections: BehaviorSubject<IRentManagerInspection[]> =
    new BehaviorSubject([]);
  public notes: BehaviorSubject<IRentManagerNote[]> = new BehaviorSubject([]);

  public tenantVacates: BehaviorSubject<any> = new BehaviorSubject([]);
  public leasing: BehaviorSubject<any> = new BehaviorSubject([]);

  public ptWidgetField = RMWidgetDataField;

  public setOpenModal$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private _totalWidgetData: BehaviorSubject<number> = new BehaviorSubject(0);
  public totalWidgetData$ = this._totalWidgetData
    .asObservable()
    .pipe(distinctUntilChanged());

  constructor(
    private stepService: StepService,
    private apiService: ApiService,
    private trudiDynamicParamater: TrudiDynamicParameterService
  ) {}

  getPopupWidgetState(): Observable<ERentManagerType | ERentManagerOption> {
    return this.popupWidgetState$.asObservable();
  }

  setPopupWidgetState(value: ERentManagerType | ERentManagerOption) {
    this.popupWidgetState$.next(value);
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

  setRMWidgetState(data: RMWidgetData) {
    if (data) {
      const newData = { ...data };
      delete newData.noPTWidgetData;
      Object.keys(newData).forEach((item) => {
        this[item]?.next(data[item]);
        if (item === 'leaseRenewals') {
          data[item].length && this.leaseRenewals.next([data[item][0]]);
        }
        const dataWidget = [...data[item]]
          .reverse()
          .find(
            (item) =>
              ![ESyncStatus.INPROGRESS, ESyncStatus.FAILED].includes(
                item?.syncStatus || item?.status
              )
          );
        if (item === RMWidgetDataField.LINKED_ACTIONS) {
          const summaryContent = {
            summaryNote:
              this.trudiDynamicParamater.getRequestSummaryFromActionItem(
                data[item]?.[0]
              ),
            summaryPhotos: data[item]?.[0]?.ticketFiles
          };
          this.stepService.setSummaryContent(summaryContent);
        }
        this.trudiDynamicParamater.setDynamicParamaterRMWidget(
          item,
          dataWidget
        );
      });
      this.getTotalWidgetData();
    }
  }

  getTotalWidgetData() {
    const total = Object.values(this.ptWidgetField).reduce(
      (total, item) => total + this[item].getValue().length,
      0
    );
    this._totalWidgetData.next(total);
  }

  setRMWidgetStateByType(
    type: RMWidgetDataField,
    action: 'UPDATE' | 'REMOVE',
    data
  ) {
    this[type]?.next(data);
    this.setOpenWidget();
    this.updateIsEmptyPTWidget(action);
    this.getTotalWidgetData();
    const completedItem = data.find(
      (item) =>
        item?.syncStatus === ESyncStatus.COMPLETED ||
        item?.status === EPTWidgetStatus.COMPLETED ||
        item?.status === ESyncStatus.COMPLETED ||
        item?.status === EPTWidgetStatus.OPEN
    );

    if (!completedItem) return;
    this.trudiDynamicParamater.setDynamicParamaterRMWidget(type, completedItem);
  }

  getRMWidgetStateByType<
    T extends
      | IWidgetLease[]
      | IRentManagerIssue[]
      | IRentManagerNote[]
      | IRentManagerInspection[]
      | ITenantDataRes[]
  >(type: RMWidgetDataField): Observable<T> {
    if (!type) return of();
    return this[type].asObservable() as Observable<T>;
  }

  getOpenWidget() {
    return this.triggerOpenWidget.asObservable();
  }

  setOpenWidget() {
    return this.triggerOpenWidget.next();
  }

  getFullDataRMWidget(taskId: string): Observable<RMWidgetData> {
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

  public transformDate(date) {
    if (!date) return null;
    return dayjs(date).format('YYYY-MM-DD') + 'T00:00:00';
  }
}
