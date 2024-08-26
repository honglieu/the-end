import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { Subject } from 'rxjs';
import { EPage } from '@shared/enum/trudi';
import { EConversationType, EUserPropertyType } from '@/app/shared/enum';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { UserProperty } from '@/app/shared/types';

@Component({
  selector: 'message-change-property',
  templateUrl: './message-change-property.component.html',
  styleUrls: ['./message-change-property.component.scss']
})
export class MessageChangePropertyComponent implements OnChanges {
  @Input() message: any | null = null;
  @Input() conversationType?: EConversationType;
  @Input() listProperty: UserPropertyInPeople[] = [];
  public oldPropertyStreetline: string = 'no property';
  public newPropertyStreetline: string = 'no property';
  public unsubscribe = new Subject<void>();
  public EPage = EPage;
  public EUserPropertyType = EUserPropertyType;
  constructor(
    private readonly userProfileDrawerService: UserProfileDrawerService
  ) {}

  get isClickable() {
    return (
      this.message?.userType === EUserPropertyType.LEAD &&
      [
        EConversationType.MESSENGER,
        EConversationType.SMS,
        EConversationType.WHATSAPP
      ].includes(this.conversationType)
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['listProperty']?.currentValue ||
      changes['message']?.currentValue
    ) {
      if (!this.listProperty?.length) return;
      this.getPropertyStreetline(
        this.message.oldPropertyId,
        this.message.newPropertyId
      );
    }
  }

  getPropertyStreetline(oldPropertyId, newPropertyId) {
    if (!this.listProperty) return;
    let a = false;
    let b = false;

    for (const element of this.listProperty) {
      if (a && b) break;

      if (element.id === oldPropertyId) {
        this.oldPropertyStreetline =
          element?.shortenStreetline || 'no property';
        a = true;
      }

      if (element.id === newPropertyId) {
        this.newPropertyStreetline =
          element?.shortenStreetline || 'no property';
        b = true;
      }
    }
  }

  handleOpenProfileDrawer(event: MouseEvent) {
    if (!this.isClickable) return;
    event.stopPropagation();

    const { userId, firstName, creator, userType } = this.message;

    let dataUser = {
      ...this.message,
      pmUserId: userId,
      pmName: firstName,
      email: creator.email,
      sendFromUserType: userType,
      pmNameClick: true,
      conversationType: this.conversationType
    };

    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser as unknown as UserProperty
    );
  }
}
