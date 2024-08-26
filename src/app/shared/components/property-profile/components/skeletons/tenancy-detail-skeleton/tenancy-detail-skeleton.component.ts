import { Component } from '@angular/core';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import { EPropertyProfileStep } from '@shared/components/property-profile/enums/property-profile.enum';

@Component({
  selector: 'tenancy-detail-skeleton',
  templateUrl: './tenancy-detail-skeleton.component.html',
  styleUrl: './tenancy-detail-skeleton.component.scss'
})
export class TenancyDetailSkeletonComponent {
  constructor(public readonly propertyProfileService: PropertyProfileService) {}

  handleClickBackBtn(): void {
    this.propertyProfileService.navigateToStep(
      EPropertyProfileStep.PROPERTY_DETAIL
    );
  }
}
