import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserService } from '@services/user.service';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { EUserInviteStatusType } from '@shared/enum/userType.enum';
import { Personal } from '@shared/types/user.interface';

@Component({
  selector: 'list-item-select-people',
  templateUrl: './list-item-select-people.component.html',
  styleUrls: ['./list-item-select-people.component.scss']
})
export class ListItemSelectPeopleComponent {
  @Input() listItemUsers: Personal[] = [];
  @Input() selectedUser = [];
  @Input() fieldInList: string;
  @Input() srcImg: string;
  @Input() srcImgCheck: string;
  @Input() srcImgUnCheck: string;
  @Input() peopleE2e: string;
  @Output() onCheckboxChange = new EventEmitter<string>();
  @Output() onScrollToTopList = new EventEmitter<void>();
  public EUserInviteStatusType = EUserInviteStatusType;
  public EUserType = EUserPropertyType;

  forwardButtonAction = ForwardButtonAction;

  constructor(public userService: UserService) {}

  ngOnInit(): void {}

  isChecked(idRow: string) {
    const item = this.selectedUser.find((i) => i.id === idRow);
    return item ? item.checked : false;
  }

  isGroupChecked(groupId: string) {
    return this.selectedUser.some((el) => el.groupId === groupId && el.checked);
  }

  handleChangeCheckbox(subId: string) {
    this.onCheckboxChange.emit(subId);
  }
}
