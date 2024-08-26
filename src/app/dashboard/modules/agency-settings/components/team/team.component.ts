import {
  Component,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList
} from '@angular/core';
import { ApiService } from '@services/api.service';
import { agencies, users } from 'src/environments/environment';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import {
  Team,
  TeamsByProperty,
  TeamSentInvite
} from '@shared/types/team.interface';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { EActionRole, UserStatus } from '@shared/enum/user.enum';
import { SettingTeamService } from '@services/setting-team.service';
import { SharedService } from '@services/shared.service';
import { LoadingService } from '@services/loading.service';
import { NavigationStart, Router } from '@angular/router';
import { HeaderService } from '@services/header.service';
import { FormArray, FormControl, Validators } from '@angular/forms';
import { CurrentUser } from '@shared/types/user.interface';
import { UserService } from '@services/user.service';
import { PermissionService } from '@services/permission.service';
import { ERole } from '@/app/auth/auth.interface';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { ToastrService } from 'ngx-toastr';
import { INVITE_SENT, INVITE_SENT_FAILED } from '@services/messages.constants';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
@DestroyDecorator
export class TeamComponent implements OnInit, OnDestroy {
  @ViewChildren(NgSelectComponent) selectElements: QueryList<any>;
  companyId = '';
  sizeBtn = 'medium';
  public isTeamPage: boolean = false;
  popupModalPosition = ModalPopupPosition;
  isShowActivateModal = false;
  isShowDeactivateModal = false;
  isShowAsignAdminModal = false;
  isShowAsignOwnerModal = false;
  isOpenInviteModal: boolean = false;
  isShowDeleteProfileModal = false;
  private unsubscribe = new Subject<void>();
  public currentUserType;
  public userId: string;
  public dataTable: TeamsByProperty;
  public itemPerRowOptions = [
    {
      id: 1,
      text: 10
    },
    {
      id: 2,
      text: 20
    },
    {
      id: 3,
      text: 50
    },
    {
      id: 4,
      text: 100
    }
  ];

  private timeOut1: NodeJS.Timeout;
  public pageIndex = 0;
  public pageSize: number = Number(this.itemPerRowOptions[3].text);
  public selectedRowOption = 4;
  menuState = true;
  public currentUserName = '';
  public currentId: string = null;
  UserStatus = UserStatus;
  Role = ERole;
  UserPropertyType = EUserPropertyType;
  public formTitleArray = new FormArray([]);
  public activeMobileApp = false;
  private selectedUser: CurrentUser = null;
  public isPermissionEdit: boolean = true;
  public readOnly: boolean = false;
  public canDeactive: boolean = false;
  public canAssignAdmin: boolean = false;
  public canAssignOwner: boolean = false;
  public canUnassignAdmin: boolean = false;
  public canInvite: boolean = false;
  public canEdit: boolean = false;
  public canEditPublicFacing: boolean = false;
  public hasOwner: boolean = false;

  constructor(
    private router: Router,
    private headerService: HeaderService,
    private apiService: ApiService,
    private readonly agencyDashboardService: AgencyDashboardService,
    private readonly companyService: CompanyService,
    private settingTeamService: SettingTeamService,
    private sharedService: SharedService,
    public loadingService: LoadingService,
    public userService: UserService,
    public permissionService: PermissionService,
    private websocketService: RxWebsocketService,
    private toastService: ToastrService,
    private inboxService: InboxService
  ) {}

  ngOnInit() {
    this.isPermissionEdit =
      this.permissionService.isOwner || this.permissionService.isAdministrator;
    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((user: CurrentUser) => {
        this.selectedUser = user;
        this.userId = user.id;
        this.currentUserType = user.type;
      });
    this.getTeamMembers();
    this.headerService.headerState$.next({
      ...this.headerService.headerState$.value,
      title: 'Team'
    });
    this.isTeamPage = window.location.href.includes('agency-settings/team');
    this.router.events.pipe(takeUntil(this.unsubscribe)).subscribe((rs) => {
      if (rs instanceof NavigationStart) {
        this.isTeamPage = rs.url.includes('agency-settings/team');
      }
    });
    this.router.setUpLocationChangeListener();
    this.subscribeRealtimeUpdateRole();
  }

  getTeamMembers() {
    combineLatest([
      this.companyService.getCurrentCompanyId(),
      this.companyService.getActiveMobileApp()
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged((prev, current) => {
          return prev[0] === current[0];
        })
      )
      .subscribe(([companyId, status]) => {
        if (companyId && status !== null) {
          this.companyId = companyId;
          this.activeMobileApp = status;
          this.getDataTable(this.pageIndex, this.pageSize);
          this.subscribeAgenciesValue();
        }
      });
  }

  subscribeAgenciesValue() {
    this.companyService
      .getCompanies()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((companies) => {
        if (!companies) return;
        this.hasOwner =
          companies.find((item) => item.id === this.companyId)?.hasOwner ??
          true;
      });
  }

  subscribeRealtimeUpdateRole() {
    this.websocketService.onSocketUpdateRole.subscribe((data) => {
      if (!data) return;
      const newRole = data.companyAgents?.find(
        (item) => item.companyId === this.companyId
      );
      const index = this.dataTable.list.findIndex(
        (item) => item.id === data.id
      );
      if (newRole?.role === ERole.OWNER) {
        this.dataTable.list.forEach((user) => {
          if (user.id !== data.id && user.role === ERole.OWNER) {
            user.role = ERole.MEMBER;
          }
        });
      }
      index && (this.dataTable.list[index].role = newRole?.role);
      this.checkPermission();
    });
  }

  checkAvatar(avatarUrl: string): boolean {
    let fileName = avatarUrl.substring(avatarUrl.lastIndexOf('/') + 1);
    fileName = fileName.substring(0, fileName.lastIndexOf('.'));
    if (fileName?.length === 1) return false;
    return true;
  }

  onGoToFirstPage(pageSize) {
    if (pageSize) {
      this.pageIndex = 0;
      this.getDataTable(0, pageSize);
    }
  }

  onGoToPrevPage(pageSize) {
    if (pageSize) {
      this.pageIndex--;
      this.getDataTable(this.pageIndex, pageSize);
    }
  }

  onGoToNextPage(pageSize) {
    if (pageSize) {
      this.pageIndex++;
      this.getDataTable(this.pageIndex, pageSize);
    }
  }

  onGoToLastPage(pageSize) {
    if (pageSize) {
      this.pageIndex = this.dataTable.totalPages - 1;
      this.getDataTable(this.pageIndex, pageSize);
    }
  }

  itemPerRowChanged(event) {
    if (event) {
      this.pageSize = event.text;
      this.pageIndex = 0;
      this.getDataTable(this.pageIndex, this.pageSize);
    }
  }

  getDataTable(pageIndex: number, pageSize: number) {
    const pi = pageIndex?.toString().trim();
    const ps = pageSize?.toString().trim();
    this.loadingService.onLoading();
    this.apiService
      .getAPI(agencies, `team?page=${pi}&size=${ps}`)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (res: TeamsByProperty) => {
          this.checkPermission();
          this.dataTable = res;
          this.fillDataToFormArray();
          this.loadingService.stopLoading();
        },
        () => {
          this.loadingService.stopLoading();
        }
      );
  }

  checkPermission() {
    this.canDeactive = this.permissionService.hasFunction(
      'TEAM.MEMBER.DEACTIVATE'
    );
    this.canAssignOwner = this.permissionService.hasFunction(
      'TEAM.MEMBER.ASSIGN_OWNER'
    );
    this.canAssignAdmin = this.permissionService.hasFunction(
      'TEAM.MEMBER.ASSIGN_ADMIN'
    );
    this.canUnassignAdmin = this.permissionService.hasFunction(
      'TEAM.MEMBER.UNASSIGN_ADMIN'
    );
    this.canInvite = this.permissionService.hasFunction('TEAM.MEMBER.INVITE');
    this.canEdit = this.permissionService.hasFunction('TEAM.MEMBER.EDIT');
    this.canEditPublicFacing = this.permissionService.hasFunction(
      'TEAM.PUBLIC_FACING.EDIT'
    );
  }

  fillDataToFormArray() {
    this.dataTable.list.forEach((team) => {
      this.formTitleArray.push(
        new FormControl(team.title, [
          Validators.required,
          Validators.maxLength(40)
        ]),
        { emitEvent: false }
      );
    });
    if (this.permissionService.isMember || this.readOnly) {
      this.formTitleArray.disable();
    }
  }

  capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  changeActivated(id: string, status: string) {
    const companyId = this.companyId;
    this.isShowDeactivateModal = false;
    this.isShowActivateModal = false;
    const body = {
      id,
      status
    };
    this.apiService.postAPI(agencies, `team/change-activated`, body).subscribe(
      () => {
        const index = this.dataTable.list.findIndex((item) => item.id === id);
        this.companyService.setCurrentCompanyId(null);
        this.companyService.setCurrentCompanyId(companyId);
      },
      (resError) => {
        console.log(resError);
      }
    );
  }

  showActivate(status: boolean) {
    this.isShowActivateModal = status;
  }

  active(item: Team) {
    this.isShowActivateModal = true;
    this.currentId = item.id;
    this.currentUserName = this.sharedService.displayName(
      item.firstName,
      item.lastName
    );
  }

  showDeactivate(status: boolean) {
    this.isShowDeactivateModal = status;
  }

  showDeleteProfileModal(id: string) {
    this.isShowDeleteProfileModal = true;
    this.currentId = id;
  }

  cancelDeleteProfile() {
    this.isShowDeleteProfileModal = false;
  }

  deleteProfile() {
    this.isShowDeleteProfileModal = false;
    this.loadingService.onLoading();
    const body = {
      userId: this.currentId
    };
    this.apiService
      .postAPI(agencies, `team/delete-user-agency`, body)
      .subscribe({
        next: (res) => {
          this.dataTable.list = this.dataTable.list.filter(
            (team) => team.id !== this.currentId
          );
          this.dataTable.totalItems--;
        },
        complete: () => {
          this.loadingService.stopLoading();
        }
      });
  }

  deactive(item: Team) {
    this.isShowDeactivateModal = true;
    this.currentId = item.id;
    this.currentUserName = this.sharedService.displayName(
      item.firstName,
      item.lastName
    );
  }

  sendInvite(propertyManagerId: string, inviteStatus: string) {
    const body: TeamSentInvite = {
      senderId: this.selectedUser.id,
      propertyManagerId
    };
    this.apiService
      .post<TeamSentInvite, any>(`${users}pm-onboard/invite-pm`, body)
      .subscribe({
        next: () => {
          this.toastService.success(INVITE_SENT);

          if (inviteStatus === UserStatus.UNINVITED) {
            const index = this.dataTable.list.findIndex(
              (item) => item.id === propertyManagerId
            );
            this.dataTable.list[index] = {
              ...this.dataTable.list[index],
              inviteStatus: UserStatus.PENDING
            };
          }
        },
        error: () => {
          this.toastService.error(INVITE_SENT_FAILED, null, {
            enableHtml: true
          });
        }
      });
  }

  onCheckboxChange(propertyManagerId: string) {
    const index = this.dataTable.list.findIndex(
      (item) => item.id === propertyManagerId
    );
    this.settingTeamService
      .updatePublicFacingProfile({
        userId: propertyManagerId,
        isMeetTheTeam: !this.dataTable.list[index].isMeetTheTeam
      })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          this.dataTable.list[index] = {
            ...this.dataTable.list[index],
            isMeetTheTeam: !this.dataTable.list[index].isMeetTheTeam
          };
        }
      });
  }

  showAssignAdmin(status: boolean) {
    this.isShowAsignAdminModal = status;
  }

  showAssignOwner(status: boolean) {
    this.isShowAsignOwnerModal = status;
  }

  assignAdmin(item: Team) {
    this.isShowAsignAdminModal = true;
    this.currentId = item.id;
    this.currentUserName = this.sharedService.displayName(
      item.firstName,
      item.lastName
    );
  }

  confirmAssignAdmin(propertyManagerId: string) {
    const currentAgencyAdmin = this.dataTable.list.find(
      (item) => item.isAgencyAdmin === true
    );
    if (currentAgencyAdmin) {
      currentAgencyAdmin.isAgencyAdmin = false;
    }
    const index = this.dataTable.list.findIndex(
      (item) => item.id === propertyManagerId
    );
    this.settingTeamService
      .updateRoleAgencyAdmin(propertyManagerId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          this.dataTable.list[index] = {
            ...this.dataTable.list[index],
            isAgencyAdmin: true
          };
          this.apiService.getAPI(users, 'current-user').subscribe({
            next: (user) => {
              this.userService.userInfo$.next(user);
              this.isShowAsignAdminModal = false;
            },
            error: () => {
              this.isShowAsignAdminModal = false;
            }
          });
        },
        error: () => {
          this.isShowAsignAdminModal = false;
        }
      });
  }
  assignOwner(item: Team) {
    this.isShowAsignOwnerModal = true;
    this.currentId = item.id;
    this.currentUserName = this.sharedService.displayName(
      item.firstName,
      item.lastName
    );
  }

  confirmAssignOwner(propertyManagerId: string) {
    const currentAgencyAdmin = this.dataTable.list.find(
      (item) => item.isAgencyAdmin === true
    );
    if (currentAgencyAdmin) {
      currentAgencyAdmin.isAgencyAdmin = false;
    }
    const index = this.dataTable.list.findIndex(
      (item) => item.id === propertyManagerId
    );
    const body = {
      action: EActionRole.ASSIGN_OWNER,
      userId: propertyManagerId
    };
    this.settingTeamService
      .updateRole(body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          this.dataTable.list.forEach((user) => {
            if (user.role === ERole.OWNER) user.role = ERole.MEMBER;
          });
          this.hasOwner = true;
          this.dataTable.list[index] = {
            ...this.dataTable.list[index],
            role: ERole.OWNER
          };
          this.loadingService.onLoading();
          this.userService.setCurrentUser().subscribe({
            next: (_) => {
              this.checkPermission();
              this.loadingService.stopLoading();
            },
            error: () => {
              this.loadingService.stopLoading();
            }
          });
          this.isShowAsignOwnerModal = false;
        },
        error: () => {
          this.isShowAsignOwnerModal = false;
        }
      });
  }
  handleOpenInviteModal() {
    this.isOpenInviteModal = true;
  }

  handleCloseInviteModal() {
    this.isOpenInviteModal = false;
  }

  onInviteTeamMember(body) {
    const companyId = this.companyId;
    this.apiService
      .getAPI(agencies, `team?page=${0}&size=${100}`)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (res: TeamsByProperty) => {
          this.loadingService.stopLoading();
          this.companyService.setCurrentCompanyId(null);
          this.companyService.setCurrentCompanyId(companyId);
        },
        () => {
          this.loadingService.stopLoading();
        }
      );
  }

  isEmpty() {
    return (
      this.dataTable?.list?.length === 0 && !this.loadingService.isLoading.value
    );
  }

  assignAdministrator(userId: string) {
    const index = this.dataTable.list.findIndex((item) => item.id === userId);
    const body = {
      action: EActionRole.ASSIGN_ADMIN,
      userId: userId
    };
    this.settingTeamService
      .updateRole(body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          this.dataTable.list[index] = {
            ...this.dataTable.list[index],
            role: ERole.ADMIN
          };
        },
        error: () => {}
      });
  }

  unAssignAdministrator(userId: string) {
    const index = this.dataTable.list.findIndex((item) => item.id === userId);
    const body = {
      action: EActionRole.UNASSIGN_ADMIN,
      userId: userId
    };
    this.settingTeamService
      .updateRole(body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          this.dataTable.list[index] = {
            ...this.dataTable.list[index],
            role: ERole.MEMBER
          };
        },
        error: () => {}
      });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOut1);
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
