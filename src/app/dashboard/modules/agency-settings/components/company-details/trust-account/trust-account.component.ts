import { BankAccount } from '@shared/types/user.interface';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  SimpleChanges
} from '@angular/core';
import uuid4 from 'uuid4';
import { SharedAgencySettingsFormService } from '@/app/dashboard/modules/agency-settings/components/shared/shared-agency-settings-form.service';
import { ACCOUNT_NUMBER_PATTERN, BSB_PATTERN } from '@services/constants';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { Agency } from '@shared/types/agency.interface';
import { ToastrService } from 'ngx-toastr';
import { PermissionService } from '@services/permission.service';

@Component({
  selector: 'trust-account',
  templateUrl: './trust-account.component.html',
  styleUrl: './trust-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustAccountComponent implements OnInit {
  @Input() listOfSubscription: Agency[] = [];
  @Input() listOfTrustAccount: BankAccount[] = [];
  public listOfSubscriptionTemp;

  public agencyId: string | null = null;
  public isAddingAccount: boolean = false;
  public readonly BSB_PATTERN = BSB_PATTERN;
  public readonly ACCOUNT_NUMBER_PATTERN = ACCOUNT_NUMBER_PATTERN;
  public checkSubmit = true;
  public createMode: boolean = false;
  currentEditId: string;
  public isPermissionEdit: boolean = false;
  public disableOkBtn: boolean = false;
  public tooltipTitle: string = '';
  public invalid: boolean = false;

  constructor(
    private sharedAgencySettingsFormService: SharedAgencySettingsFormService,
    private cdr: ChangeDetectorRef,
    private agencyService: AgencyService,
    private toastService: ToastrService,
    private permissionService: PermissionService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['listOfSubscription']?.currentValue) {
      this.listOfSubscriptionTemp = this.listOfSubscription;
      this.tooltipTitle = this.getTooltipTitleOfAddBtn();
    }
  }
  ngOnInit(): void {
    this.isPermissionEdit = this.permissionService.hasFunction(
      'COMPANY_DETAIL.PROFILE.EDIT'
    );
    this.sharedAgencySettingsFormService.buildAccountForm();
  }

  getTooltipTitleOfAddBtn() {
    const hasManySubscriptions = this.listOfSubscriptionTemp?.length > 1;
    return `You have set up trust ${
      hasManySubscriptions ? 'accounts' : 'account'
    } for all ${hasManySubscriptions ? 'subscriptions' : 'subscription'}`;
  }

  triggerEventEdit(account: BankAccount) {
    this.checkSubmit = false;
    this.createMode = false;
    this.invalid = this.accountForm.invalid;
    if (this.isAddingAccount) {
      this.listOfTrustAccount = this.listOfTrustAccount.filter(
        (acc) => !acc.tempAccount
      );
      this.isAddingAccount = false;
    }
    this.agencyId = account.agencyId;
    this.currentEditId = account.id;
    this.listOfSubscription =
      this.sharedAgencySettingsFormService.checkSubscriptionExistence(
        this.listOfSubscriptionTemp,
        this.listOfTrustAccount,
        account.agencyId
      );

    this.cdr.markForCheck();
    this.sharedAgencySettingsFormService.patchAccountForm(account);
  }

  handleOk() {
    this.checkSubmit = false;
    this.disableOkBtn = true;
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.disableOkBtn = false;
      this.invalid = this.accountForm.invalid && !this.checkSubmit;
      return;
    }
    this.isAddingAccount = false;
    const payload =
      this.sharedAgencySettingsFormService.getPayloadEditOrAddAccount(
        this.currentEditId
      );

    const createOrUpdateAPI$ = this.agencyId
      ? this.agencyService.updateTrustAccount(payload)
      : this.agencyService.createTrustAccount(payload);
    createOrUpdateAPI$.subscribe((account) => {
      this.disableOkBtn = false;
      const agencyName = this.listOfSubscription.find(
        (sub) => sub.id === account?.agencyId
      )?.name;

      if (this.currentEditId) {
        this.listOfTrustAccount = this.listOfTrustAccount.map((acc) =>
          acc.id === this.currentEditId ? { ...account, agencyName } : acc
        );
      } else {
        this.listOfTrustAccount = [
          ...this.listOfTrustAccount.filter((acc) => !acc.tempAccount),
          { ...account, agencyName, tempAccount: false }
        ];
      }
      this.toastService.success(
        `Trust account ${this.currentEditId ? 'updated' : 'added'}`
      );

      this.currentEditId = null;
      this.cdr.markForCheck();
    });
  }

  prefillSubscription() {
    if (this.listOfSubscription?.length !== 1) return;
    this.crmSubscription.setValue(this.listOfSubscription[0].id);
  }

  addAccount() {
    this.agencyId = null;
    this.createMode = true;
    this.listOfSubscription =
      this.sharedAgencySettingsFormService.checkSubscriptionExistence(
        this.listOfSubscription,
        this.listOfTrustAccount
      );
    this.sharedAgencySettingsFormService.resetAccountForm();
    this.sharedAgencySettingsFormService.patchAccountForm({} as BankAccount);
    this.prefillSubscription();
    const newAcc = {
      id: uuid4(),
      accountName: '',
      accountNumber: '',
      bsb: '',
      agencyId: '',
      tempAccount: true
    };
    this.listOfTrustAccount = [...this.listOfTrustAccount, newAcc];
    this.isAddingAccount = true;
    this.cdr.markForCheck();
  }

  cancel() {
    this.checkSubmit = false;
    this.invalid = false;
    this.createMode = false;
    this.sharedAgencySettingsFormService.resetAccountForm();
    this.isAddingAccount = false;
    this.currentEditId = null;
    this.listOfTrustAccount = this.listOfTrustAccount.filter(
      (acc) => !acc.tempAccount
    );
    this.cdr.markForCheck();
  }

  get accountForm() {
    return this.sharedAgencySettingsFormService.getAccountForm();
  }

  get crmSubscription() {
    return this.accountForm.get('crmSubscription');
  }

  get accountName() {
    return this.accountForm.get('accountName');
  }

  get bsb() {
    return this.accountForm.get('bsb');
  }

  get accountNumber() {
    return this.accountForm.get('accountNumber');
  }

  get disableAddBtn() {
    return (
      this.listOfTrustAccount?.length === this.listOfSubscriptionTemp?.length
    );
  }
}
