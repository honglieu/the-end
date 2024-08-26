import { IUserTenancy } from '@shared/types/user.interface';
import { Component, Input } from '@angular/core';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import { EPropertyProfileStep } from '@shared/components/property-profile/enums/property-profile.enum';
import { ITenantIdDispatcher } from '@shared/components/property-profile/interface/property-profile.interface';

@Component({
  selector: 'list-tenants',
  templateUrl: './list-tenants.component.html',
  styleUrls: ['./list-tenants.component.scss']
})
export class ListTenantsComponent {
  @Input() userTenancyList?: IUserTenancy;

  constructor(private _propertyProfileService: PropertyProfileService) {}

  handleClickTenant(id: string) {
    this._propertyProfileService.navigateToStep(
      EPropertyProfileStep.TENANT_DETAIL,
      {
        id
      } as ITenantIdDispatcher
    );
  }
}
