import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, combineLatest, filter, switchMap, takeUntil } from 'rxjs';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import { ToastrService } from 'ngx-toastr';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  CompanyAgentCurrentUser,
  IMailBox
} from '@shared/types/user.interface';
import { IUpdateMailboxNameResponse } from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import {
  EMailBoxStatus,
  EMailBoxType,
  EmailProvider
} from '@shared/enum/inbox.enum';
import {
  EMailboxSettingTab,
  EUserMailboxRole
} from '@/app/mailbox-setting/utils/enum';
import { LoadingService } from '@services/loading.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { SharedService } from '@services/shared.service';
import { CompanyService } from '@services/company.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {
  visible: boolean = false;
  emailProvider = EmailProvider;
  mailboxStatus: string;
  isEditting: boolean = false;
  mailboxForm: FormGroup;
  currentAgencyId: string;
  mailboxId: string;
  currentMailbox: IMailBox;
  isUpdatingMailboxName: boolean = false;
  isLoading: boolean = false;
  readonly MailboxRole = EUserMailboxRole;
  readonly MailboxSettingTab = EMailboxSettingTab;
  readonly MailBoxType = EMailBoxType;
  private destroy$ = new Subject<void>();
  public descriptionSharedMailbox = '';
  public isConsole = false;

  constructor(
    public inboxService: InboxService,
    public loadingService: LoadingService,
    public mailboxSettingService: MailboxSettingService,
    private formBuilder: FormBuilder,
    private mailboxSettingApiService: MailboxSettingApiService,
    private toastService: ToastrService,
    private dashboardApiService: DashboardApiService,
    private companyService: CompanyService,
    private sharedService: SharedService,
    private activeRoute: ActivatedRoute
  ) {}

  get mailboxNameControl() {
    return this.mailboxForm.get('mailboxName');
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.buildAccountForm();
    this.getInitialAccountValues();
  }

  buildAccountForm() {
    this.mailboxForm = this.formBuilder.group({
      mailboxName: ''
    });
  }

  getInitialAccountValues() {
    combineLatest([
      this.mailboxSettingService.currentAgencyId$,
      this.inboxService.listMailBoxs$,
      this.activeRoute.queryParams
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([currentAgencyId, listMailBoxs, queryParams]) => {
        this.currentAgencyId = currentAgencyId;
        this.mailboxId = queryParams['mailBoxId'];
        this.currentMailbox = listMailBoxs?.find(
          (mailbox) => mailbox?.id === queryParams['mailBoxId']
        );
        this.mailboxStatus = this.setDisplayedMailboxStatus(
          this.currentMailbox.status
        );
        this.descriptionSharedMailbox = `This is a shared mailbox linked to Outlook account {${this.currentMailbox?.mailBoxOwnerAddress}}`;
      });
  }

  setDisplayedMailboxStatus(status: EMailBoxStatus) {
    switch (status) {
      case EMailBoxStatus.ACTIVE:
      case EMailBoxStatus.FAIL:
        return '(connected)';
      case EMailBoxStatus.DISCONNECT:
        return '(disconnected)';
      case EMailBoxStatus.ARCHIVE:
        return '(archived)';
      default:
        return '';
    }
  }

  editMailboxName() {
    this.isEditting = true;
    this.mailboxForm.setValue({ mailboxName: this.currentMailbox.name });
  }

  updateMailboxName() {
    if (!this.mailboxNameControl.value?.trim()) {
      this.mailboxNameControl.setValidators([Validators.required]);
      this.mailboxNameControl.markAsTouched();
      this.mailboxNameControl.updateValueAndValidity();
      return;
    }
    if (this.mailboxNameControl.value?.trim() === this.currentMailbox.name) {
      this.isEditting = false;
      return;
    }
    this.isUpdatingMailboxName = true;
    this.mailboxSettingApiService
      .updateMailboxName(this.mailboxId, this.mailboxNameControl.value?.trim())
      .pipe(takeUntil(this.destroy$))
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (response: IUpdateMailboxNameResponse) =>
            Object.keys(response).length > 0
        ),
        switchMap((response) => {
          this.inboxService.setCurrentMailBox({
            ...this.currentMailbox,
            name: response?.name
          });
          return this.dashboardApiService.getListMailbox().pipe(
            filter((list) => !!list),
            takeUntil(this.destroy$)
          );
        })
      )
      .subscribe({
        next: (list: CompanyAgentCurrentUser[]) => {
          this.companyService.setListCompanyAgent(list);
        },
        error: () => {
          this.isEditting = false;
          this.isUpdatingMailboxName = false;
        },
        complete: () => {
          this.toastService.success('Mailbox name updated');
          this.isEditting = false;
          this.isUpdatingMailboxName = false;
        }
      });
  }

  handleLoadingArchive(event) {
    this.visible = false;
    this.isLoading = !!event;
  }

  cancelEdit() {
    this.isEditting = false;
    this.mailboxNameControl.clearValidators();
    this.mailboxNameControl.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
