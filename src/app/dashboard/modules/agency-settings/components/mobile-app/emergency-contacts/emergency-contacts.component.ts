import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { Subject, forkJoin, of, switchMap, takeUntil } from 'rxjs';
import {
  EAddOnType,
  EEmergencyContactsSection
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { Router } from '@angular/router';
import { ISelectContacts } from '@/app/dashboard/modules/agency-settings/utils/interface';
import { PermissionService } from '@services/permission.service';
import { EmergencyContactsApiService } from '@/app/dashboard/modules/agency-settings/components/mobile-app/services/emergency-contacts-api.service';
import { EmergencyContactsService } from '@/app/dashboard/modules/agency-settings/components/mobile-app/services/emergency-contacts.service';

@Component({
  selector: 'emergency-contacts',
  templateUrl: './emergency-contacts.component.html',
  styleUrls: ['./emergency-contacts.component.scss'],
  providers: [EmergencyContactsApiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EmergencyContactsComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  suppliersList: ISelectContacts[] = [];
  typesList: { id: string; name: string }[] = [];
  readonly: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();

  readonly EEmergencyContactsSection = EEmergencyContactsSection;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly emergencyContactsService: EmergencyContactsService,
    private readonly emergencyContactsApiService: EmergencyContactsApiService,
    private readonly agencyDashboardService: AgencyService,
    private readonly permissionService: PermissionService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.readonly = !this.permissionService.hasFunction(
      'EMERGENCY_CONTACTS.SUPPLIER.EDIT'
    );
    this.subscribeCurrentPlan();
    this.fetchInitData();
    this.subscribeRefreshListType();
    this.subscribeRefreshListSupplier();
  }

  private fetchInitData(): void {
    const typesObservable =
      this.emergencyContactsApiService.getAllEmergencyContactsTypes();
    const suppliersListObservable =
      this.emergencyContactsApiService.getApiListSupplier();

    forkJoin([typesObservable, suppliersListObservable])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([typesData, suppliersData]) => {
        this.typesList = typesData;
        this.suppliersList = suppliersData?.body || [];
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  private subscribeCurrentPlan() {
    this.agencyDashboardService.currentPlan$
      .pipe(takeUntil(this.destroy$))
      .subscribe((configPlan) => {
        if (!configPlan) return;
        const isMobileAppEnabled =
          configPlan.features[EAddOnType.MOBILE_APP].state;
        if (!isMobileAppEnabled) {
          this.router.navigate(['/dashboard/agency-settings/team']);
        }
      });
  }

  private subscribeRefreshListSupplier() {
    this.emergencyContactsService.triggerRefreshSupplierLists$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((newSupplierData) => {
          if (!newSupplierData) {
            return of(null);
          }
          this.suppliersList = [...this.suppliersList, newSupplierData];
          return this.emergencyContactsApiService.getApiListSupplier();
        })
      )
      .subscribe((suppliersData) => {
        this.suppliersList = suppliersData?.body || [];
      });
  }

  private subscribeRefreshListType() {
    this.emergencyContactsService.triggerRefreshTypeLists$
      .pipe(
        switchMap((data) => {
          if (data) {
            const existedTypeId = this.typesList.find(
              (type) => type.id === data.id
            );
            if (existedTypeId) {
              this.typesList = this.typesList.map((type) => {
                if (type.id === data.id) {
                  return data;
                }
                return type;
              });
            } else {
              this.typesList = [...this.typesList, data];
            }
          }
          return this.emergencyContactsApiService.getAllEmergencyContactsTypes();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((typesData) => {
        this.typesList = typesData;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
