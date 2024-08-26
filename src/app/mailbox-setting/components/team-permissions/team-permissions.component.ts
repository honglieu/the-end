import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild
} from '@angular/core';
import {
  EventElement,
  IMailboxSetting,
  TeamPermission,
  TheadTable,
  UpdateUserPermission,
  UserPermission
} from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import {
  DEFAULT_MAILNBOX_SETTING,
  THEAD_TABLE
} from '@/app/mailbox-setting/utils/constant';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { Subject, combineLatest, of, retry, switchMap, takeUntil } from 'rxjs';
import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import { cloneDeep, isEmpty, isEqual, sortBy } from 'lodash-es';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  EMailboxSettingTab,
  EUserMailboxRole
} from '@/app/mailbox-setting/utils/enum';
import { ActivatedRoute, Router } from '@angular/router';
import { EMailBoxType } from '@shared/enum/inbox.enum';
import { UserService } from '@services/user.service';
import { LoadingService } from '@services/loading.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';

@Component({
  selector: 'team-permissions',
  templateUrl: './team-permissions.component.html',
  styleUrls: ['./team-permissions.component.scss']
})
export class TeamPermissionsComponent implements OnInit, OnDestroy {
  @ViewChild('tableProperty', { static: true })
  tableProperty: ElementRef<HTMLElement>;
  private readonly refetch$ = new Subject<void>();
  private listTeamPermissionTemp: TeamPermission = [];
  private listTeamPermissionChange: UpdateUserPermission[] = [];
  public theadTable: TheadTable = THEAD_TABLE;
  public userRoleInMailbox: Array<keyof typeof EUserMailboxRole>;
  private currentAgencyId: string = '';
  private mailBoxId: string = '';
  private companyAgentId: string = '';
  private currPage: number = DEFAULT_MAILNBOX_SETTING.currPage;
  private sizePage: number = DEFAULT_MAILNBOX_SETTING.sizePage;
  public isError: boolean = false;
  public isLoading: boolean = true;
  public disableCheckbox: boolean = true;
  public isConsole: boolean = false;
  private stopPagging: boolean = false;
  public mailBoxType: EMailBoxType;
  readonly EUserMailboxRole = EUserMailboxRole;
  readonly MailboxSettingTab = EMailboxSettingTab;
  readonly EMailBoxType = EMailBoxType;
  private unsubscribe = new Subject<void>();
  private currentMailBoxSetting: IMailboxSetting;

  constructor(
    private sharedService: SharedService,
    public mailboxSettingService: MailboxSettingService,
    public inboxService: InboxService,
    private userService: UserService,
    private loadingService: LoadingService,
    private mailboxSettingApiService: MailboxSettingApiService,
    private router: Router,
    private rxWebsocketService: RxWebsocketService,
    private activeRoute: ActivatedRoute
  ) {
    this.getListActiveTeamMember();
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.getAgencyAndMailbox();
    this.getCurrentMailbox();
    this.rxWebsocketService.onSocketChangeOwner
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.getListActiveTeamMember();
        this.getAgencyAndMailbox();
        this.getCurrentMailbox();
      });

    this.rxWebsocketService.onSocketUpdatePermissionMailBox
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.getAgencyAndMailbox();
      });
  }

  getCurrentMailbox() {
    combineLatest([
      this.activeRoute.queryParams,
      this.inboxService.listMailBoxs$,
      this.mailboxSettingService.mailboxSetting$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([queryParams, listMailBoxs, mailBoxSetting]) => {
        const currentMailbox = listMailBoxs?.find(
          (mailbox) => mailbox?.id === queryParams['mailBoxId']
        );
        (this.userRoleInMailbox = currentMailbox?.role) &&
          (this.mailBoxType = currentMailbox?.type) &&
          (this.currentMailBoxSetting = mailBoxSetting);
      });
  }

  getAgencyAndMailbox() {
    combineLatest([
      this.mailboxSettingService.currentAgencyId$,
      this.activeRoute.queryParams
    ])
      .pipe(
        switchMap(([currentAgencyId, queryParams]) => {
          if (!currentAgencyId) return of(null);
          this.onElementScrollToTop();
          this.isLoading = true;
          this.stopPagging = false;
          this.currentAgencyId = currentAgencyId;
          this.mailBoxId = queryParams['mailBoxId'];
          return of(true);
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((fetch) => fetch && this.refetch$.next());
  }

  getListActiveTeamMember() {
    this.refetch$
      .pipe(
        switchMap(() => {
          if (
            !this.currentAgencyId ||
            !this.mailBoxId ||
            !this.router.url.includes('team-permission') ||
            this.stopPagging
          )
            return of(null);

          return this.mailboxSettingApiService.getListActiveTeamMember(
            this.mailBoxId,
            this.currPage,
            this.sizePage
          );
        }),
        takeUntil(this.unsubscribe),
        retry(2)
      )
      .subscribe({
        next: (res) => {
          if (!res) return;

          if (res.currentPage === res.totalPages - 1) this.stopPagging = true;

          if (!this.currPage) {
            this.mailboxSettingService.setTeamPermissonData(res?.list);
          } else {
            this.mailboxSettingService.updateTeamPermissonData(res?.list);
          }

          this.companyAgentId = res.list.find(
            (r) => r.userId === this.userService.userInfo$.value.id
          )?.companyAgentId;

          this.isError = false;
          this.reset();
        },
        error: () => {
          this.isError = true;
          this.reset();
        }
      });
  }

  mapListTeamPermisson(
    { target }: EventElement,
    row: UserPermission,
    role?: EUserMailboxRole
  ) {
    return this.mailboxSettingService.teamPermissonValue.map((user) => {
      const isMatchUser = user.userId === row.userId;

      if (isMatchUser && role) this.checkRole(target.checked, user, role);

      if (isMatchUser && !role) this.checkAssgin(target.checked, user);

      return user;
    });
  }

  checkRole(isChecked: boolean, user: UserPermission, role: EUserMailboxRole) {
    if (!isChecked) user.role = user.role.filter((r) => r !== role);

    if (isEmpty(user.role)) user.isDefault = false;

    if (isChecked && !user.role?.includes(role))
      user.role = [...(user.role || []), role];
  }

  checkAssgin(isChecked: boolean, user: UserPermission) {
    if ((!user.role || isEmpty(user.role)) && isChecked) {
      user.role = [EUserMailboxRole.COLLABORATOR];
    }
  }

  diffUserTeam(
    currChange: UpdateUserPermission,
    prevChange: UpdateUserPermission
  ) {
    return isEqual(
      { ...currChange, role: sortBy(currChange.role) },
      { ...prevChange, role: sortBy(prevChange.role) }
    );
  }

  pickChange(value: UserPermission) {
    return {
      companyAgentId: value?.companyAgentId || '',
      role: value?.role || [],
      isDefault: value?.isDefault || false,
      userId: value?.userId || ''
    };
  }

  detectChangeValue(value: UserPermission) {
    const indexExist = this.listTeamPermissionChange.findIndex(
      (i) => i.companyAgentId === value.companyAgentId
    );

    const currChange = this.pickChange(value);
    const prevChange = this.pickChange(
      this.listTeamPermissionTemp.find(
        (i) => i.companyAgentId === value.companyAgentId
      )
    );

    if (this.diffUserTeam(currChange, prevChange) && indexExist >= 0) {
      this.listTeamPermissionChange.splice(indexExist, 1);
      return;
    }

    if (indexExist >= 0) {
      this.listTeamPermissionChange[indexExist] = currChange;
      return;
    }

    this.listTeamPermissionChange = [
      ...this.listTeamPermissionChange,
      currChange
    ];
  }

  onCheckboxChange(
    event: EventElement,
    user: UserPermission,
    action?: EUserMailboxRole
  ) {
    this.mailboxSettingService.setTeamPermissonData(
      this.mapListTeamPermisson(event, user, action)
    );
    this.detectChangeValue(user);
  }

  checkPrevConfirm(): boolean {
    this.disableCheckbox = true;
    return !isEmpty(this.listTeamPermissionChange);
  }

  setCurrentUser() {
    if (!this.companyAgentId) return;
    const isUpdateCurrentUser = this.listTeamPermissionChange.some(
      (list) => list.companyAgentId === this.companyAgentId
    );
    if (isUpdateCurrentUser) {
      this.userService
        .setCurrentUser()
        .pipe(takeUntil(this.unsubscribe))
        .subscribe({
          next: () => this.loadingService.stopLoading(),
          error: () => this.loadingService.stopLoading()
        });
    }
  }

  onConfirm() {
    const isCheck = this.checkPrevConfirm();
    if (!isCheck) return this.tableProperty.nativeElement.scrollIntoView();

    this.isLoading = true;
    this.mailboxSettingApiService
      .updateListActiveTeamMember(this.mailBoxId, this.listTeamPermissionChange)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          const setting = {
            ...this.currentMailBoxSetting,
            teamMembers: res?.teamMembers
          };
          this.mailboxSettingService.setMailboxSetting(setting);
        },
        complete: () => {
          this.mailboxSettingService.resetTeamPermissonData();
          this.onElementScrollToTop();
          this.setCurrentUser();
          this.stopPagging = false;
          this.disableCheckbox = true;
          this.listTeamPermissionChange = [];
          this.refetch$.next();
        }
      });
  }

  onCancel() {
    if (!isEmpty(this.listTeamPermissionChange)) {
      this.mailboxSettingService.setTeamPermissonData(
        this.listTeamPermissionTemp
      );
    }
    this.listTeamPermissionChange = [];
    this.disableCheckbox = true;
  }

  onEdit() {
    this.listTeamPermissionTemp = cloneDeep(
      this.mailboxSettingService.teamPermissonValue
    );
    this.disableCheckbox = false;
  }

  onElementScrollToTop() {
    this.currPage = 0;
    this.disableCheckbox = true;
    this.tableProperty.nativeElement.scrollIntoView();
  }

  onElementScroll() {
    ++this.currPage;
    this.refetch$.next();
  }

  reset() {
    this.isLoading = false;
  }

  trackByUser(team: UserPermission) {
    return team?.userId;
  }

  ngOnDestroy(): void {
    this.refetch$.complete();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
