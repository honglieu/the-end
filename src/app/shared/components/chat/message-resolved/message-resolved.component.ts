import {
  EConfirmContactType,
  EConversationType,
  EUserPropertyType
} from '@shared/enum';
import { Component, Input, OnInit } from '@angular/core';
import { trudiUserId } from '@services/constants';
import { EPage } from '@shared/enum/trudi';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { UserProperty } from '@/app/shared/types';

@Component({
  selector: 'app-message-resolved',
  templateUrl: './message-resolved.component.html',
  styleUrls: ['./message-resolved.component.scss']
})
export class MessageResolvedComponent implements OnInit {
  @Input() message;
  @Input() conversationType: EConversationType;
  public EPage = EPage;
  public title: string = '';
  public isFromMailBox: boolean = false;
  _trudiUserId = trudiUserId;
  constructor(
    private readonly userProfileDrawerService: UserProfileDrawerService
  ) {}
  ngOnInit() {
    this.title = this.message?.title;
    this.isFromMailBox =
      this.message?.userType === EConfirmContactType.MAILBOX && !!this.title;
  }

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
