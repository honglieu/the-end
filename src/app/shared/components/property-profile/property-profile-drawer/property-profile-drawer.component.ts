import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { EPreviewUserType } from '@shared/components/property-profile/enums/property-profile.enum';
import { ETypePage } from '@/app/user/utils/user.enum';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';

@Component({
  selector: 'property-profile-drawer',
  templateUrl: './property-profile-drawer.component.html',
  styleUrls: ['./property-profile-drawer.component.scss'],
  animations: [
    trigger('openClose', [
      state('false', style({ marginRight: '{{closeMargin}}px' }), {
        params: { closeMargin: 0 }
      }),
      state('true', style({ marginRight: '0' })),
      transition('false <=> true', [animate('0.3s ease-out')])
    ])
  ]
})
export class PropertyProfileDrawerComponent implements OnChanges {
  @Input() closeMargin: string = '-400';
  @Input() propertyId: string = '';
  @Input() visible: boolean = false;
  @Input() displayBackButton: boolean = false;
  @Input() currentDataUser: UserProperty;
  @Input() userId: string = '';
  @Input() userType: EPreviewUserType = null;
  @Input() openFrom: ETypePage = ETypePage.OTHER;
  @Output() triggerCloseDrawer = new EventEmitter();
  @Output() triggerBackButton = new EventEmitter();
  visibleProperty: boolean = true;

  constructor(private _propertyProfileService: PropertyProfileService) {}

  handleBackButton() {
    this.triggerBackButton.emit();
  }

  onCloseDrawer(): void {
    this.triggerCloseDrawer.emit();
    this.visible = false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['openFrom'] || changes['currentDataUser']) {
      this._propertyProfileService.setCurrentPageData({
        openFrom: this.openFrom,
        currentUserData: this.currentDataUser
      });
    }

    if (changes['visible'] && !changes['visible'].isFirstChange()) {
      this.visibleProperty = true;
    }
  }

  handleAnimationEnd() {
    if (!this.visible) {
      this.visibleProperty = false;
    }
  }
}
