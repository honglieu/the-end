import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TrudiTab } from '@trudi-ui';
import { UserService } from '@services/user.service';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { ERole } from '@/app/auth/auth.interface';

@Component({
  selector: 'sidebar-item-shared',
  templateUrl: './sidebar-item-shared.component.html',
  styleUrls: ['./sidebar-item-shared.component.scss']
})
export class SidebarItemSharedComponent implements OnInit {
  @Input() listItem: TrudiTab<unknown>[];
  @Input() label: string;
  @Input() mailBoxId: string;
  @Output() changePopupState = new EventEmitter<{}>();
  isOwnerOrAdmin: boolean = false;
  popupState: { [key: string]: boolean } = {};

  ITEM_APPOINTMENT = 'Appointment availability';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    const currentUser = this.userService.userInfo$?.value;
    const isConsole = [
      UserTypeEnum.AGENT,
      UserTypeEnum.ADMIN,
      UserTypeEnum.SUPERVISOR
    ].includes(currentUser?.type as UserTypeEnum);
    const currentAgent = currentUser.companyAgents?.find(
      (agent) => agent.companyId === localStorage.getItem('companyId')
    );
    this.isOwnerOrAdmin = isConsole
      ? currentUser?.type === UserTypeEnum.ADMIN
      : [ERole.OWNER, ERole.ADMIN].includes(currentAgent?.role as ERole);
  }

  handlePopupState(state: { [key: string]: boolean }) {
    this.popupState = { ...this.popupState, ...state };
    this.changePopupState.emit(this.popupState);
  }
}
