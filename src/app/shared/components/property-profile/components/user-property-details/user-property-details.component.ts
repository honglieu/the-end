import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UserAgentApiService } from '@/app/user/services/user-agent-api.service';
import { IUserPropertyV2 } from '@/app/user/utils/user.type';
import { Subject, takeUntil } from 'rxjs';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import { EPropertyProfileStep } from '@shared/components/property-profile/enums/property-profile.enum';
import { ETypePage } from '@/app/user/utils/user.enum';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { ITenantIdDispatcher } from '@shared/components/property-profile/interface/property-profile.interface';

@Component({
  selector: 'user-property-details',
  templateUrl: './user-property-details.component.html',
  styleUrls: ['./user-property-details.component.scss']
})
export class UserPropertyDetailsComponent implements OnInit, OnDestroy {
  userPropertyList?: IUserPropertyV2[] = [];
  isLoading: boolean = false;
  openFrom: ETypePage = ETypePage.OTHER;
  currentDataUser: UserProperty;
  private _destroy$ = new Subject<void>();

  constructor(
    private _userAgentApiService: UserAgentApiService,
    private _propertyProfileService: PropertyProfileService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    let userId: string = '';
    this._propertyProfileService.currentPageData$.subscribe({
      next: (pageData) => {
        this.openFrom = pageData.openFrom;
        this.currentDataUser = pageData.currentUserData;
      }
    });
    if (
      this._propertyProfileService.getCurrentStep() ===
      EPropertyProfileStep.TENANT_DETAIL
    ) {
      userId = this._propertyProfileService.getCurrentTenant().id;
    } else {
      userId = this._propertyProfileService.getCurrentOwnershipId();
    }
    this._userAgentApiService
      .getUserPropertyV2([userId])
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (value) => {
          this.userPropertyList = value;
          this._propertyProfileService.setCurrentTenant({
            ...this._propertyProfileService.getCurrentTenant(),
            userPropertyGroupId: value[0]?.idUserPropertyGroup
          } as ITenantIdDispatcher);
          this.isLoading = false;
          this._cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this._cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next(null);
    this._destroy$.complete();
  }
}
