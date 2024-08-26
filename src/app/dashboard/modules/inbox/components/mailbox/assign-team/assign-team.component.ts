import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, map, Observable, combineLatest, take } from 'rxjs';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import { UserService } from '@services/user.service';
import { Team, TeamsByProperty } from '@shared/types/team.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EMailBoxPopUp } from '@shared/enum/inbox.enum';
import { FormControl, FormGroup } from '@angular/forms';
import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'assign-team',
  templateUrl: './assign-team.component.html',
  styleUrls: ['./assign-team.component.scss']
})
export class AssignTeamComponent implements OnInit, OnDestroy {
  @Input() isCompanyMailbox: boolean = false;
  @Output() onSaveAssignDefault: EventEmitter<void> = new EventEmitter<void>();
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @ViewChild('multiSelect') multiSelect: ElementRef;
  public popupState: EMailBoxPopUp;
  private unsubscribe = new Subject<void>();
  public currentAgencyId: string;
  public agencyList: Team[] = [];
  public isDisabled: boolean = false;
  public isLoading: boolean = true;
  public listSelectPM: Team[] = [];
  private listAgencyAssign: any[] = [];
  public myForm: FormGroup;
  private mailBoxId: string;
  public title: string = '';
  public subTitle: string = '';
  public isHideFooter: boolean = false;
  public ownerId: string = '';
  public defaultOwner = [];
  assignTeamMember$: Observable<[]>;
  public isError: boolean = false;
  public isRmEnvironment: boolean = false;

  readonly EMailBoxPopUp = EMailBoxPopUp;

  constructor(
    private dashboardAgencyService: DashboardAgencyService,
    private userService: UserService,
    private router: Router,
    private inboxService: InboxService,
    private mailboxSettingApiService: MailboxSettingApiService,
    private agencyDashboardService: AgencyDashboardService,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.myForm = new FormGroup({
      assignTeamMember: new FormControl('')
    });

    this.inboxService
      .getPopupMailBoxState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.popupState = res;
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.mailBoxId = res;
      });

    combineLatest([
      this.dashboardAgencyService.getListAgencyActive(),
      this.dashboardAgencyService
        .getListAssignSelected()
        .pipe(take(1), takeUntil(this.unsubscribe))
    ])
      .pipe(
        map(([res, listSelected]) => {
          return [res.list, listSelected];
        })
      )
      .subscribe(([res, listSelected]) => {
        if (res) {
          this.setAgencyList(res, listSelected);
        }
      });

    this.assignTeamMember$ = this.myForm.get('assignTeamMember').valueChanges;
    this.assignTeamMember$.subscribe((value) => {
      if (value) {
        this.isError = false;
      }
    });
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment =
          this.agencyDashboardService.isRentManagerCRM(company);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('isCompanyMailbox' in changes) {
      this.getTitleModal();
    }
  }

  handleSaveAssignMailBox() {
    this.listAgencyAssign = this.isCompanyMailbox
      ? this.listSelectPM
      : this.listSelectPM.filter((item) => item.selected);
    this.listAgencyAssign = this.listAgencyAssign.map((agent) => ({
      userId: agent.id,
      companyAgentId: agent.companyAgentId,
      isDefault: false,
      role: ['COLLABORATOR']
    }));

    if (this.listSelectPM.length > 1) {
      this.inboxService.setPopupMailBoxState(EMailBoxPopUp.ASSIGN_DEFAULT);
    } else if (this.isRmEnvironment) {
      this.inboxService.setPopupMailBoxState(
        EMailBoxPopUp.SAVE_CONVERSATION_TO_NOTE
      );
    } else {
      this.updateListActiveTeamMember();
    }
  }

  handleSaveAssignTeam() {
    if (!this.isValidationSuccessful()) {
      return;
    }
    if (this.isRmEnvironment) {
      this.inboxService.setPopupMailBoxState(
        EMailBoxPopUp.SAVE_CONVERSATION_TO_NOTE
      );
    } else {
      this.updateListActiveTeamMember();
    }
  }

  handleSaveConversationsMailbox() {
    this.saveMailboxBeHaviours({
      autoSyncConversationNote: true,
      resolvedMessages: null,
      deletedMessages: null
    });
  }

  handleCancelConversationsMailbox() {
    this.saveMailboxBeHaviours({
      autoSyncConversationNote: false,
      resolvedMessages: null,
      deletedMessages: null
    });
  }

  saveMailboxBeHaviours(value: {
    autoSyncConversationNote: boolean;
    resolvedMessages: string;
    deletedMessages: string;
  }) {
    this.updateListActiveTeamMember();
    this.mailboxSettingApiService.isSaveConversationMailbox$.next(
      value.autoSyncConversationNote
    );
    this.mailboxSettingApiService
      .saveMailboxBehaviours(this.mailBoxId, {
        autoSyncConversationNote: value.autoSyncConversationNote,
        resolved: value.resolvedMessages,
        deleted: value.deletedMessages
      })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe();
  }

  isValidationSuccessful(): boolean {
    if (!this.assignTeamMember?.value?.length) {
      this.isError = true;
      return false;
    }
    this.isError = false;
    return true;
  }

  setAgencyList(agencyList: Team[], listSelected: Team[]) {
    let list = [...agencyList];
    const userId = this.userService.userInfo$.value?.id;
    this.agencyList = list
      .map((el) => ({
        ...el,
        selected: listSelected.length
          ? !!listSelected.find((one) => one.id === el.id)
          : true,
        label: `${el.firstName} ${el.lastName || ''}`.trim()
      }))
      .sort((a, b) => (a.id === userId ? -1 : b.id === userId ? 1 : 0));
    this.listSelectPM = [...this.agencyList.filter((item) => item.selected)];
    this.dashboardAgencyService.setListAssignSelected(this.listSelectPM);
    this.defaultOwner = this.listSelectPM
      .filter((item) => item.id === userId)
      .map((obj) => obj.companyAgentId);
    this.assignTeamMember.setValue(this.defaultOwner);
    if (!this.agencyList.length) {
      this.title = 'Assign team members';
      this.isHideFooter = true;
    }
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  updateListActiveTeamMember() {
    this.isDisabled = true;
    const idListTeam: [] = this.assignTeamMember?.value || [];
    this.listAgencyAssign.map((item) =>
      idListTeam.forEach((el) => {
        if (el === item.companyAgentId) item.isDefault = true;
      })
    );
    this.mailboxSettingApiService
      .updateListActiveTeamMember(this.mailBoxId, this.listAgencyAssign)
      .subscribe(() => {
        this.onSaveAssignDefault.emit();
        this.agencyDashboardService.setListAssignSelected([]);
      });
  }

  handleCheckbox(i: number) {
    if (this.isCompanyMailbox) {
      return;
    }
    this.agencyList[i].selected = !this.agencyList[i].selected;
    this.listSelectPM = [...this.agencyList.filter((el) => el.selected)];
    this.dashboardAgencyService.setListAssignSelected(this.listSelectPM);
  }

  inviteTeamMember() {
    const route = `dashboard/agency-settings/team`;
    this.router.navigate([route]);
  }

  handleBack() {
    this.inboxService.setPopupMailBoxState(EMailBoxPopUp.ASSIGN_TEAM);
    this.assignTeamMember.setValue(this.defaultOwner);
    this.isError = false;
  }

  handleCheckAll(event) {
    const userId = this.userService.userInfo$.value?.id;
    if (this.isCompanyMailbox) {
      return;
    }
    if (!event) {
      this.agencyList.forEach((item) => {
        if (item.id !== userId) {
          item.selected = false;
        }
      });
    } else {
      this.agencyList.map((item) => {
        item.selected = true;
      });
    }
    this.listSelectPM = [...this.agencyList.filter((el) => el.selected)];
    this.dashboardAgencyService.setListAssignSelected(this.listSelectPM);
  }

  getTitleModal() {
    this.title = 'Assign team members';
    this.subTitle = this.isCompanyMailbox
      ? 'Company mailbox is shared with all team members by default'
      : '';
  }

  handleClose() {
    this.inboxService.setPopupMailBoxState(null);
    this.dashboardAgencyService.setListAssignSelected([]);
  }

  public handleSkip() {
    this.onCancel.emit();
  }

  get assignTeamMember() {
    return this.myForm?.get('assignTeamMember');
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
