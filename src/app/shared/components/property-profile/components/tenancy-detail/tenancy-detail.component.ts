import { EUserPropertyType } from '@shared/enum';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import { EPropertyProfileStep } from '@shared/components/property-profile/enums/property-profile.enum';
import { Subject, takeUntil } from 'rxjs';
import { UserAgentApiService } from '@/app/user/services/user-agent-api.service';
import { IUserTenancy } from '@shared/types/user.interface';
import { TENANCY_STATUS } from '@services/constants';

@Component({
  selector: 'tenancy-detail',
  templateUrl: './tenancy-detail.component.html',
  styleUrls: ['./tenancy-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenancyDetailComponent implements OnInit, OnDestroy {
  @Input() crmSystemId = '';
  public readonly ECrmSystemId = ECrmSystemId;
  public readonly EUserPropertyType = EUserPropertyType;
  userTenancyList?: IUserTenancy;
  isLoading: boolean = false;
  protected readonly TENANCY_STATUS = TENANCY_STATUS;
  private _destroy$ = new Subject<void>();

  constructor(
    private _propertyProfileService: PropertyProfileService,
    private _userAgentApiService: UserAgentApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    let userPropertyGroupId = '';
    userPropertyGroupId = this._propertyProfileService.getCurrentTenancy();
    this._userAgentApiService
      .getListTenantByTenancy(
        this._propertyProfileService.getCurrentProperty().id,
        userPropertyGroupId
      )
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (userTenancyList) => {
          this.isLoading = false;
          this.userTenancyList = userTenancyList;
          this.cdr.markForCheck();
        },
        error: (e) => {
          console.log(e);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });

    this.crmSystemId = this._propertyProfileService.getCurrentCompany().CRM;
  }

  handleClickBackBtn() {
    this._propertyProfileService.setCurrentStep(
      EPropertyProfileStep.PROPERTY_DETAIL
    );
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
