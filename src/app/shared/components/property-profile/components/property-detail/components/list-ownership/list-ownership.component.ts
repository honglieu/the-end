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
import { ECRMId, ERmCrmStatus, EUserPropertyType } from '@shared/enum';
import { ECrmStatus } from '@/app/user/utils/user.enum';

@Component({
  selector: 'list-ownership',
  templateUrl: './list-ownership.component.html',
  styleUrls: ['./list-ownership.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListOwnershipsComponent implements OnInit, OnDestroy {
  public ownership: Personal = null;
  public owners: Personal[] = [];
  public isLoading: boolean = false;
  public isCRM: boolean = false;
  private unsubscribe = new Subject<void>();
  readonly statusMap = {
    [ERmCrmStatus.RMCurrent]: 'current',
    [ERmCrmStatus.RMFuture]: 'future',
    [ERmCrmStatus.RMPast]: 'past',
    [ERmCrmStatus.RMDeleted]: 'deleted',
    [ERmCrmStatus.RMLost]: 'lost'
  };
  constructor(
    private readonly propertyService: PropertiesService,
    public readonly propertyProfileService: PropertyProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  public includePastFuture: boolean = false;

  convertOwnerOfRm(owner) {
    return {
      ...owner,
      status: this.statusMap[owner.status]
    };
  }
  ngOnInit(): void {
    this.propertyProfileService.currentCompany$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((result) => {
        this.isCRM = result?.CRM === ECRMId.RENT_MANAGER;
        this.cdr.markForCheck();
      });

    this.getOwership();
  }

  getOwership(status?: boolean) {
    this.propertyProfileService.propertyId$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (propertyId) => {
          const {
            propertyData,
            filterOfOwners,
            propertyId: oldPropertyId
          } = this.propertyProfileService.getDataOfProperty();
          if (!propertyData) return;
          if (oldPropertyId === propertyId && status === undefined) {
            this.includePastFuture = filterOfOwners;
          } else {
            this.includePastFuture = !!status;
          }
          this.isLoading = true;
          this.propertyService
            .getListOwnershipByProperty(this.isCRM, {
              propertyId,
              includePastFuture: this.includePastFuture
            })
            .pipe(takeUntil(this.unsubscribe))
            .subscribe({
              next: (result) => {
                this.isLoading = false;
                const owners = !this.isCRM
                  ? result?.userProperties
                  : result?.userProperties?.map((item) =>
                      this.convertOwnerOfRm(item)
                    );
                this.ownership = result;
                this.owners = owners;
                this.propertyProfileService.setDataOfProperty({
                  owners,
                  ownership: result,
                  filterOfOwners: this.includePastFuture,
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
  handleClickOwner(id: string) {
    this.propertyProfileService.navigateToStep(
      EPropertyProfileStep.OWNERSHIP_DETAIL,
      id
    );
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  protected readonly EUserPropertyType = EUserPropertyType;
  protected readonly ECrmStatus = ECrmStatus;
}
