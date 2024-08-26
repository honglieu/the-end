import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { TrudiTab } from '@trudi-ui';
import { UserService } from '@services/user.service';
import { ERole } from '@/app/auth/auth.interface';
import { UserTypeEnum } from '@shared/enum';
import { Router } from '@angular/router';

@Component({
  selector: 'company-settings-item',
  templateUrl: './company-settings-item.component.html',
  styleUrls: ['./company-settings-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanySettingItemComponent implements OnInit {
  @Input() listItem: TrudiTab<unknown>[];
  @Input() label: string;
  @Output() changePopupState = new EventEmitter<{}>();
  @Output() hiddenDropdown = new EventEmitter<boolean>();

  public isOwnerOrAdmin: boolean = false;
  public popupState: { [key: string]: boolean } = {};

  constructor(private userService: UserService, private router: Router) {}

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

  handleClick() {
    this.hiddenDropdown.emit(false);
  }

  handleKeydownEnter(link: string) {
    if (link) {
      this.router.navigateByUrl(`/dashboard/agency-settings/${link}`);
    }
    this.handleClick();
  }
}
