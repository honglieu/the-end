import { EInviteStatus } from '@shared/enum/user.enum';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { mappedProfileRole } from '@/app/user/shared/components/drawer-user-info/constants/constants';

@Component({
  selector: 'profile-card',
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss']
})
export class ProfileCardComponent implements OnChanges {
  readonly EInviteStatus = EInviteStatus;
  @Input() profileData: UserProperty;
  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['profileData']?.currentValue) {
      this.profileData = {
        ...this.profileData,
        fullName:
          `${this.profileData.firstName} ${this.profileData.lastName}`?.trim(),
        role: mappedProfileRole[this.profileData.companyAgents?.role]
      };
    }
  }
}
