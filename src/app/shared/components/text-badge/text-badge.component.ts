import { Component, Input } from '@angular/core';
import { SharedService } from '@services/shared.service';

@Component({
  selector: 'text-badge',
  templateUrl: './text-badge.component.html',
  styleUrls: ['./text-badge.component.scss']
})
export class TextBadgeComponent {
  @Input() text: string;
  @Input() type?: 'TENANCY' | 'OWNERSHIP'; // 'success' | 'warning' | 'error' | 'normal' | 'prospect';
  @Input() badgeForPropertyUser: boolean;
  constructor(public sharedService: SharedService) {}
}
