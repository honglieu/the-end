import { Component, Input } from '@angular/core';

@Component({
  selector: 'tenancies-section-skeleton',
  templateUrl: './tenancies-section-skeleton.component.html',
  styleUrl: './tenancies-section-skeleton.component.scss'
})
export class TenanciesSectionSkeletonComponent {
  @Input() displayHeader: boolean = true;
}
