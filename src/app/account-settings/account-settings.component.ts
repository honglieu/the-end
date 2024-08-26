import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, of, Subject } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { UserService } from '@services/user.service';
import { CurrentUser, IMailBoxAssignee } from '@shared/types/user.interface';
import { LoadingService } from '@services/loading.service';
import { CompanyService } from '@services/company.service';
import { ERole } from '@/app/auth/auth.interface';
import { PermissionService } from '@services/permission.service';
import { SharedService } from '@services/shared.service';
import { UserTypeEnum } from '@shared/enum';
import { users } from '@/environments/environment';
import { AuthService } from '@services/auth.service';
import { ApiService } from '@services/api.service';
import { UserService as UserDashboardService } from '@/app/dashboard/services/user.service';

interface IDataAvatar {
  dataBase64: string;
  formdata: FormData;
}
@Component({
  selector: 'account-settings',
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss']
})
export class AccountSettingsComponent implements OnInit, OnDestroy {
  private onDestroy = new Subject<void>();

  public isShowChangePasswordModal = false;
  public isRoleOwner = false;
  public isShowModalConfirm = false;
  public isShowModalForm = false;
  public isShowPictureBase64 = false;
  public dataImgBase64 = null;
  public currentRole = '';
  public isButtonsVisible = false;
  public isShowUploadPhotoModal = false;

  public listMailboxAssignee: IMailBoxAssignee[] = [];
  public currentUser: CurrentUser;

  constructor(
    public userService: UserService,
    public loadingService: LoadingService,
    public companyService: CompanyService,
    public permissionService: PermissionService,
    public sharedService: SharedService,
    public authService: AuthService,
    public apiService: ApiService,
    public userDashboardService: UserDashboardService
  ) {}

  ngOnInit(): void {
    this.getInitData();
  }

  private getInitData() {
    this.loadingService.onLoading();
    combineLatest([
      this.companyService.getCurrentCompanyId(),
      this.userService.userInfo$,
      this.userService.getAllMailboxAssignee()
    ])
      .pipe(takeUntil(this.onDestroy))
      .subscribe(([companyId, userInfo, listAssignee]) => {
        if (!userInfo || !companyId || !listAssignee) return;
        this.currentUser = userInfo;
        this.listMailboxAssignee = listAssignee;

        const newRole = this.currentUser.companyAgents?.find(
          (item) => item.companyId === companyId
        );

        const isConsole = window.location.href.includes('console');
        if (!isConsole) {
          this.currentRole = newRole?.role;
        } else {
          const isOwner =
            this.currentUser.type === UserTypeEnum.ADMIN ||
            this.currentUser.type === UserTypeEnum.SUPERADMIN;
          this.currentRole = isOwner ? ERole.OWNER : ERole.MEMBER;
        }

        if (this.currentRole === ERole.OWNER) {
          this.isRoleOwner = true;
        }

        this.loadingService.stopLoading();
      });
  }

  showChangePassword() {
    this.isShowChangePasswordModal = !this.isShowChangePasswordModal;
  }

  showDeleteAccount() {
    if (!this.isRoleOwner && this.listMailboxAssignee.length === 0) {
      this.isShowModalConfirm = !this.isShowModalConfirm;
    } else {
      this.isShowModalForm = !this.isShowModalForm;
    }
  }

  handlePictureProfile() {
    this.isShowUploadPhotoModal = !this.isShowUploadPhotoModal;
  }

  onSaveAvatar(event: IDataAvatar) {
    this.loadingService.onLoading();
    this.authService
      .updateAvatar(event.formdata)
      .pipe(
        switchMap(() => {
          return this.apiService.getAPI(users, 'current-user');
        }),
        catchError((err) => {
          console.error('Update error', err);
          return of(null);
        })
      )
      .subscribe({
        next: (res) => {
          if (!res) return;
          this.userService.userInfo$.next(res);
          this.userService.selectedUser.next(res);
          this.userDashboardService.setUserDetail(res);
        },
        error: (err) => {
          console.error('GET USER INFO ERROR', err);
        }
      });
  }

  checkShowImgBase64(event: IDataAvatar) {
    if (this.dataImgBase64) {
      this.isShowPictureBase64 = true;
    } else {
      this.isShowPictureBase64 = false;
    }
    this.onSaveAvatar(event);
  }

  getAvatarData(event: IDataAvatar) {
    this.dataImgBase64 = event.dataBase64;
    this.checkShowImgBase64(event);
  }

  ngOnDestroy() {
    this.onDestroy.next();
    this.onDestroy.complete();
  }
}
