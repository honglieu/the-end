import { Component } from '@angular/core';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import { EPropertyProfileStep } from '@shared/components/property-profile/enums/property-profile.enum';

@Component({
  selector: 'tenant-detail-skeleton',
  templateUrl: './tenant-detail-skeleton.component.html',
  styleUrl: './tenant-detail-skeleton.component.scss'
})
export class TenantDetailSkeletonComponent {
  constructor(public readonly propertyProfileService: PropertyProfileService) {}

  handleClickBackBtn(): void {
    this.propertyProfileService.navigateToStep(
      EPropertyProfileStep.PROPERTY_DETAIL
    );
  }
}
