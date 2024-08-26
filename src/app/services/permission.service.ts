import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { PERMISSIONS } from '@/app/auth/permissions';
import { ERole } from '@/app/auth/auth.interface';
import { UserTypeEnum } from '@shared/enum/user.enum';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  hasFunction(functionName: string) {
    const currentUser = this.userService.userInfo$?.value;
    const loggedInUser = this.authService.isAuthenticated() && currentUser;

    if (loggedInUser) {
      const permissions = PERMISSIONS[this.getCurrentRole];
      return permissions?.includes(functionName);
    }
    return false;
  }

  get isOwner(): boolean {
    return this.getCurrentRole === ERole.OWNER;
  }

  get isAdministrator(): boolean {
    return this.getCurrentRole === ERole.ADMIN;
  }

  get isMember(): boolean {
    return this.getCurrentRole === ERole.MEMBER;
  }

  get getCurrentRole() {
    const isConsole = window.location.href.includes('console');
    const currentUser = this.userService.userInfo$?.value;
    const isOwner =
      currentUser.type === UserTypeEnum.ADMIN ||
      currentUser.type === UserTypeEnum.SUPERADMIN;
    if (!isConsole) {
      return currentUser.companyAgents.find(
        (item) => item.companyId === localStorage.getItem('companyId')
      )?.role;
    } else {
      return isOwner ? ERole.OWNER : ERole.MEMBER;
    }
  }

  get getCurrentRoleConsole() {
    const currentUser = this.userService.userInfo$?.value;
    return currentUser?.type;
  }
}
