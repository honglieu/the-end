import { Component, Input } from '@angular/core';

@Component({
  selector: 'ownership-section-skeleton',
  templateUrl: './ownership-section-skeleton.component.html',
  styleUrl: './ownership-section-skeleton.component.scss'
})
export class OwnershipSectionSkeletonComponent {
  @Input() displayHeader: boolean = true;
}
