import {
  AfterViewInit,
  Component,
  Directive,
  HostBinding,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { cloneDeep, isEqual } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import {
  Observable,
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  first,
  firstValueFrom,
  fromEvent,
  map,
  skipUntil,
  skipWhile,
  startWith,
  switchMap,
  takeUntil
} from 'rxjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { PropertiesService } from '@services/properties.service';
import { TrudiService } from '@services/trudi.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { EActionType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import uuid4 from 'uuid4';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { TenantApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/api/tenant-api.service';
import { TenantFormMasterService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-master.service';
import { TenantFormPatcher } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-patcher';
import { TenantStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-state.service';
import { TenantTabGroupComponent } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/tenant-tab-group/tenant-tab-group.component';
import { TenantFormName } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/types';
import { PopupVisibleStateService } from './../state/popup-visible-state.service';
import { PopupSyncTenantService } from './popup-sync-tenant.service';
import { SharedService } from '@services/shared.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
@Directive({
  selector: '[tenantForm]'
})
export class TenantFormDirective {
  @HostBinding('style.display') _display: string = 'none';

  set display(value: boolean) {
    if (value) {
      this._display = 'block';
    } else {
      this._display = 'none';
    }
  }
}

@Component({
  selector: 'popup-sync-tenant',
  templateUrl: './popup-sync-tenant.component.html',
  styleUrls: ['./popup-sync-tenant.component.scss']
})
export class PopupSyncTenantComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChildren(TenantFormDirective)
  formTemplates: QueryList<TenantFormDirective>;
  @ViewChild(TenantTabGroupComponent)
  tabGroupComponent: TenantTabGroupComponent;
  public visiblePopup$: Observable<boolean>;
  public formMaster: FormGroup;

  public tenantFormName = TenantFormName;
  public isSubmitted: boolean = false;
  public currentStepId: string;
  public action: string;
  public disabledForm$ = this.tenantFormMaster.disable$;

  public isLoading: boolean = null;
  public errorState = {
    [TenantFormName.Info]: false,
    [TenantFormName.Lease]: false,
    [TenantFormName.Contact]: false,
    [TenantFormName.Deposit]: false,
    [TenantFormName.Setting]: false,
    [TenantFormName.Charges]: false,
    [TenantFormName.UserFields]: false
  };
  public syncInfo = {
    status: ESyncStatus.NOT_SYNC,
    time: new Date()
  };

  public isArchiveMailbox$: Observable<boolean>;
  public popupClassName$ = this.popupVisibleStateService.popupSync$.pipe(
    map((visible) => {
      return `rent-manager-popup-sync-tenant ${
        visible === false ? 'hidden' : ''
      }`;
    })
  );

  private _currentIdUserPropertyGroup = null;
  private _destroy$ = new Subject<void>();
  private _inputEvent$ = new Subject<void>();

  isConsole: boolean;

  constructor(
    public popupVisibleStateService: PopupVisibleStateService,
    private widgetRMService: WidgetRMService,
    private tenantFormMaster: TenantFormMasterService,
    private tenantApiService: TenantApiService,
    private tenantState: TenantStateService,
    private popupSyncTenantService: PopupSyncTenantService,
    private toastService: ToastrService,
    private stepService: StepService,
    private trudiService: TrudiService,
    private propertyService: PropertiesService,
    private inboxService: InboxService,
    private eventCalendarService: EventCalendarService,
    private showSidebarRightService: ShowSidebarRightService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this._initVisiblePopup();
    this._initFormMaster();
    this._setCurrentStep();
    this._setSyncInfo();
    this._setLoading();
    this._setCurrentIdUserPropertyGroup();
    this._formValueChanges();
    this._updateSyncInfo();
    this.isArchiveMailbox$ = this.inboxService.isArchiveMailbox$;
    this.isConsole = this.sharedService.isConsoleUsers();
  }

  ngAfterViewInit(): void {
    this._mapTenantName();
    this._detectEvents();
  }

  private _detectEvents() {
    const tabContent = this.tabGroupComponent.contentTemplate.nativeElement;
    combineLatest([
      fromEvent(tabContent, 'keyup').pipe(startWith(null)),
      fromEvent(tabContent, 'mouseup').pipe(startWith(null))
    ])
      .pipe(
        map(([keyup, mouseup]) => keyup || mouseup),
        first(Boolean)
      )
      .subscribe(() => {
        this._inputEvent$.next();
        this._inputEvent$.complete();
      });
  }

  private _mapTenantName() {
    const formName = this.formMaster
      .get(TenantFormName.Info)
      .get(TenantFormName.Name) as FormGroup;

    const formContact = this.formMaster.get(
      TenantFormName.Contact
    ) as FormGroup;

    const _compareName = (a, b) => {
      const compareKeys = ['firstName', 'lastName'];
      return compareKeys.every((key) => (a?.[key] || '') === (b?.[key] || ''));
    };

    const setupFormChanges = <T>(formChanges$: Observable<T>): Observable<T> =>
      formChanges$.pipe(
        takeUntil(this._destroy$),
        skipUntil(this._inputEvent$),
        distinctUntilChanged((previous, current) =>
          _compareName(previous, current)
        )
      );

    const formNameChanges$ = setupFormChanges(formName.valueChanges);
    const formContactChanges$ = setupFormChanges(
      formContact.valueChanges.pipe(
        map((contacts) => contacts.find((contact) => contact?.isPrimary))
      )
    );

    const _mapNameToContact = (tenantName) => {
      const contacts = formContact.getRawValue();
      const primaryContact = contacts.find((contact) => contact?.isPrimary);
      if (primaryContact && !_compareName(tenantName, primaryContact)) {
        primaryContact.firstName = tenantName?.firstName;
        primaryContact.lastName = tenantName?.lastName;
        formContact.patchValue(contacts, { emitEvent: false, onlySelf: true });
      }
    };

    const _mapContactToName = (primaryContact) => {
      if (!primaryContact) return;
      const name = formName.getRawValue();
      if (!_compareName(primaryContact, name)) {
        formName.patchValue(
          {
            firstName: primaryContact?.firstName,
            lastName: primaryContact?.lastName
          },
          { emitEvent: false, onlySelf: true }
        );
      }
    };

    formNameChanges$.subscribe(_mapNameToContact);
    formContactChanges$.subscribe(_mapContactToName);
  }

  private _updateSyncInfo() {
    this.formMaster.valueChanges
      .pipe(
        takeUntil(this._destroy$),
        map(() => this.formMaster.getRawValue()),
        distinctUntilChanged((previous, current) => isEqual(previous, current)),
        skipWhile(() => this.isLoading),
        skipUntil(this._inputEvent$),
        filter((value) => Boolean(value?.id))
      )
      .subscribe(() => {
        setTimeout(() => {
          if (
            [
              ESyncStatus.COMPLETED,
              ESyncStatus.UN_SYNC,
              ESyncStatus.FAILED
            ].includes(this.syncInfo.status)
          ) {
            this.syncInfo = {
              status: ESyncStatus.UN_SYNC,
              time: new Date()
            };
          }
        }, 0);
      });
  }

  private _setLoading() {
    this.tenantState.isLoading$
      .pipe(takeUntil(this._destroy$))
      .subscribe((isLoading) => {
        this.isLoading = isLoading;
      });
  }

  private _setSyncInfo() {
    this.tenantState.tenant$
      .pipe(
        takeUntil(this._destroy$),
        map((formValue) => formValue?.id),
        switchMap((tenantId) => {
          return this.widgetRMService
            .getRMWidgetStateByType(RMWidgetDataField.NEW_TENANT)
            .pipe(
              map((tenants: any[]) => {
                const tenant = tenants.find((t) => t?.id == tenantId);
                if (tenant?.syncStatus == ESyncStatus.INPROGRESS) {
                  this._disableForm();
                } else {
                  this._enableForm();
                }
                return {
                  status: tenant?.syncStatus || ESyncStatus.NOT_SYNC,
                  time: tenant?.syncDate || new Date()
                };
              })
            );
        })
      )
      .pipe(takeUntil(this._destroy$))
      .subscribe((data) => {
        this.syncInfo = data;
        this.syncInfo?.status === ESyncStatus.INPROGRESS
          ? this.tenantFormMaster.setSyncing(true)
          : this.tenantFormMaster.setSyncing(false);
      });
  }

  private _formValueChanges() {
    this.formMaster.valueChanges
      .pipe(
        takeUntil(this._destroy$),
        skipWhile(() => !this.isSubmitted)
      )
      .subscribe(() => {
        this.handleShowError();
      });
  }

  private _setCurrentStep() {
    this.stepService.currentRMStep$
      .pipe(takeUntil(this._destroy$))
      .subscribe((cur) => {
        if (cur?.componentType === ERentManagerType.NEW_TENANT) {
          this.currentStepId = cur?.id;
          this.action = cur?.action;
        }
      });
  }

  private _setCurrentIdUserPropertyGroup() {
    this.tenantState.tenant$
      .pipe(takeUntil(this._destroy$))
      .subscribe((res) => {
        this._currentIdUserPropertyGroup = res?.idUserPropertyGroup;
      });
  }

  public handleSyncTenant() {
    this.formMaster.markAllAsTouched();
    this.isSubmitted = true;
    this.handleShowError();

    if (this.formMaster.invalid) return;

    const formValue = this.formMaster.getRawValue();
    const payload = this.popupSyncTenantService.mapDataSync(formValue);
    this.showSidebarRightService.handleToggleSidebarRight(true);

    const { firstName, lastName } = formValue?.info?.name || {};
    const tenantData = {
      id: formValue?.id || uuid4(),
      data: { ...payload, firstName, lastName },
      idUserPropertyGroup: this._currentIdUserPropertyGroup
    };
    const trackId = tenantData.id;
    this.popupSyncTenantService._updateWidgetData(
      tenantData,
      trackId,
      ESyncStatus.INPROGRESS
    );
    const syncingForm = this._composeSyncingForm(trackId, this.formMaster);
    this.tenantState.addSyncingForm(syncingForm);
    this.handleClosePopup();
    this.tenantApiService
      .syncNewTenant(payload)
      .pipe()
      .subscribe({
        next: (response) => {
          const { errorMessSync, syncStatus, syncDate } = response || {};
          if (errorMessSync) {
            this.toastService.error(errorMessSync);
          }

          this.tenantState.removeSyncingForm(syncingForm);

          // when create new tenant
          if (response.id !== trackId) {
            this.formMaster
              .get(TenantFormName.Id)
              .setValue(response.id, { emitEvent: false, onlySelf: true });
            syncingForm
              .get(TenantFormName.Id)
              .setValue(response.id, { emitEvent: false, onlySelf: true });
          }

          this._updateTenantAfterSync(response);

          response.firstTimeSyncSuccess =
            response.syncStatus === ESyncStatus.COMPLETED;
          this.popupSyncTenantService._updateWidgetData(
            response,
            trackId,
            syncStatus,
            syncDate
          );

          if (syncStatus === ESyncStatus.COMPLETED) {
            this.eventCalendarService.refreshListEventCalendarWidget(
              this.tenantApiService.getIDsFromOtherService().taskId
            );
            this._handleUpdateButton(response);
            this._updateListOfTenant();
          }
        },
        error: (err) => {
          this.toastService.error(err?.message);
        }
      });
  }

  private _composeSyncingForm(
    trackId: string,
    formMaster: FormGroup
  ): FormGroup {
    const form = cloneDeep(formMaster);
    const data = this.popupSyncTenantService.mapDataSync(form.getRawValue());
    const patcher = new TenantFormPatcher(form);
    patcher.patchCharge({
      recurringCharges: data?.recurringCharges,
      oneTimeCharges: data.charges
    });
    form
      .get(TenantFormName.Id)
      .setValue(trackId, { emitEvent: false, onlySelf: true });

    return form;
  }

  private async _updateTenantAfterSync(response: any) {
    const tenant = await firstValueFrom(this.tenantState.tenant$);
    if (tenant) {
      this.tenantState.setTenant(response);
    }
  }

  private _updateListOfTenant() {
    const propertyId = this.propertyService.currentPropertyId.getValue();
    this.propertyService.getPeople(propertyId);
  }

  private _handleUpdateButton(res) {
    const trudiResponse = this.trudiService.getTrudiResponse?.getValue();
    if (!trudiResponse.isTemplate || !this.currentStepId) return;
    this.stepService
      .updateStep(
        res?.taskId,
        this.currentStepId,
        this.action,
        TrudiButtonEnumStatus.COMPLETED,
        ECRMSystem.RENT_MANAGER,
        ERentManagerType.NEW_TENANT
      )
      .pipe(first(Boolean))
      .subscribe((res) => {
        this.stepService.updateTrudiResponse(res, EActionType.UPDATE_RM);
        this.stepService.setChangeBtnStatusFromRMWidget(false);
      });
  }

  public handleShowError() {
    for (const formName of Object.keys(this.errorState)) {
      const form = this.formMaster.get(formName) as FormGroup | FormArray;
      if (Array.isArray(form.controls) && form.controls.length) {
        this.errorState[formName] = form.controls.some(
          (control) => control.touched && control.invalid
        );
      } else {
        this.errorState[formName] = form?.touched && form?.invalid;
      }
    }
  }

  public handleClosePopup() {
    this._destroy$.next();
    this.widgetRMService.setPopupWidgetState(null);
    this.tenantFormMaster.getRawForm().reset({}, { emitEvent: false });
    this.tenantState.setTenant(null);
  }

  private _initVisiblePopup() {
    this.visiblePopup$ = this.widgetRMService
      .getPopupWidgetState()
      .pipe(map((state) => state == ERentManagerType.NEW_TENANT));
  }

  private _initFormMaster() {
    this.formMaster = this.tenantFormMaster.getRawForm();
    this.formMaster.markAsPristine();
    this._enableForm();
  }

  private _enableDateDeposit() {
    const depositForm = this.formMaster.get(TenantFormName.Deposit);
    const dateControl = depositForm.get('date');
    if (depositForm.value.isDepositPrior) {
      dateControl.disable();
    } else {
      dateControl.enable();
    }
  }

  private _disableForm() {
    this.formMaster.disable({ emitEvent: false });
    this.tenantFormMaster.setDisable(true);
  }

  private _enableForm() {
    this.formMaster.enable({ emitEvent: false });
    this.tenantFormMaster.setDisable(false);
    this._enableDateDeposit();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
