import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import { Personal } from '@shared/types/user.interface';
import { EPropertyProfileStep } from '@shared/components/property-profile/enums/property-profile.enum';
import { Subject, takeUntil } from 'rxjs';
import { PropertiesService } from '@services/properties.service';
import { ECRMId, ERmCrmStatus } from '@shared/enum';
import { ITenantIdDispatcher } from '@shared/components/property-profile/interface/property-profile.interface';
import { ECrmStatus } from '@/app/user/utils/user.enum';

@Component({
  selector: 'list-tenancy',
  templateUrl: './list-tenancy.component.html',
  styleUrls: ['./list-tenancy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListTenancyComponent implements OnInit, OnDestroy {
  public tenancies: Personal[] = [];
  public readonly EPropertyProfileStep = EPropertyProfileStep;
  public isCRM: boolean = false;
  public isLoading: boolean = false;
  readonly statusMap = {
    [ERmCrmStatus.RMCurrent]: 'current',
    [ERmCrmStatus.RMFuture]: 'future',
    [ERmCrmStatus.RMPast]: 'past',
    [ERmCrmStatus.RMDeleted]: 'deleted',
    [ERmCrmStatus.RMLost]: 'lost'
  };
  public filterCheckbox: boolean = false;
  private unsubscribe = new Subject<void>();

  constructor(
    private readonly propertyService: PropertiesService,
    public readonly propertyProfileService: PropertyProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  convertTenancyOfRm(tenancy) {
    return {
      ...tenancy,
      status: this.statusMap[tenancy.status] ?? tenancy.status,
      name: tenancy.user
        ? tenancy.user.firstName + ' ' + tenancy.user.lastName
        : ''
    };
  }

  ngOnInit(): void {
    this.propertyProfileService.currentCompany$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((result) => {
        this.isCRM = result?.CRM === ECRMId.RENT_MANAGER;
        this.cdr.markForCheck();
      });
    this.getListTenancy();
  }

  getListTenancy(status?: boolean) {
    this.propertyProfileService.propertyId$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (propertyId) => {
          const {
            propertyData,
            filterOfTenancies,
            propertyId: oldPropertyId
          } = this.propertyProfileService.getDataOfProperty();
          if (!propertyData) return;
          if (oldPropertyId === propertyId && status === undefined) {
            this.filterCheckbox = filterOfTenancies;
          } else {
            this.filterCheckbox = !!status;
          }
          this.isLoading = true;
          const data = { propertyId };
          data[!this.isCRM ? 'includeArchive' : 'includePastFuture'] =
            this.filterCheckbox;
          this.propertyService
            .getListTenancyByProperty(this.isCRM, data)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe({
              next: (result) => {
                this.isLoading = false;
                const tenancies = !this.isCRM
                  ? result
                  : result?.map((item) => this.convertTenancyOfRm(item));
                this.tenancies = tenancies;
                this.propertyProfileService.setDataOfProperty({
                  tenancies,
                  filterOfTenancies: this.filterCheckbox,
                  propertyId
                });
                this.cdr.markForCheck();
              },
              error: (e) => {
                console.log(e);
                this.isLoading = false;
                this.cdr.markForCheck();
              }
            });
        }
      });
  }

  handleClickTenancy(tenancy) {
    if (this.isCRM) {
      this.propertyProfileService.navigateToStep(
        EPropertyProfileStep.TENANT_DETAIL,
        {
          id: tenancy.id,
          propertyId: tenancy.property?.id,
          userPropertyGroupId: tenancy.idUserPropertyGroup
        } as ITenantIdDispatcher
      );
    } else {
      this.propertyProfileService.navigateToStep(
        EPropertyProfileStep.TENANCY_DETAIL,
        tenancy.id
      );
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  protected readonly ECrmStatus = ECrmStatus;
}
