import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { IUserTenancy } from '@shared/types/user.interface';
import {
  DEFAULT_ARREARS_DATA,
  EArrearsType
} from '@shared/components/property-profile/interface/property-profile.interface';
import { cloneDeep } from 'lodash-es';
import { TENANCY_STATUS } from '@services/constants';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';

@Component({
  selector: 'tenancy-since-detail',
  templateUrl: './tenancy-since-detail.component.html',
  styleUrls: ['./tenancy-since-detail.component.scss']
})
export class TenancySinceDetailComponent implements OnInit, OnChanges {
  @Input() userTenancyList?: IUserTenancy;
  @Input() crmSystemId = '';
  amountTooltipData = DEFAULT_ARREARS_DATA;
  protected readonly Array = Array;
  protected readonly EArrearsType = EArrearsType;
  protected readonly TENANCY_STATUS = TENANCY_STATUS;
  isCRM = false;
  constructor(private _propertyProfileService: PropertyProfileService) {}

  ngOnInit(): void {
    this.isCRM = this._propertyProfileService.getIsCRM();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const userTenancyListChange = changes['userTenancyList'];
    if (userTenancyListChange) {
      const arrearsData = (userTenancyListChange.currentValue as IUserTenancy)
        ?.arrears;
      if (arrearsData) {
        this.amountTooltipData = (
          userTenancyListChange.currentValue as IUserTenancy
        )?.arrears?.reduce((previousValue, currentValue) => {
          previousValue[currentValue.type].amount += currentValue.amount;
          previousValue.Total.amount += currentValue.amount;
          return previousValue;
        }, cloneDeep(DEFAULT_ARREARS_DATA));
      }
    }
  }
}
