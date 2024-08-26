import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  EMPTY,
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import {
  Agency,
  AgencyConsoleSetting,
  CompanyPayload,
  StripeCustomer,
  StripeSubscriptions
} from '@shared/types/agency.interface';
import { ShareValidators } from '@shared/validators/share-validator';
import uuid4 from 'uuid4';
import { CompanyConsoleSettingService } from '@/app/console-setting/agencies/services/company-console-setting.service';
import { CompanyFormService } from '@/app/console-setting/agencies/services/company-form.service';
import {
  AgencyConsoleSettingPopupAction,
  EAgencyPlan,
  ECountryName,
  SubscriptionStatus
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { CompanyService } from '@services/company.service';
import { ICompany } from '@shared/types/company.interface';
import { cloneDeep } from 'lodash-es';
import { getMaskPhoneNumber } from '@/app/dashboard/modules/agency-settings/components/policies/utils/helper-function';
import { AgencyService as AgencyServiceDashboard } from '@/app/dashboard/services/agency.service';

@Component({
  selector: 'new-edit-company',
  templateUrl: './new-edit-company.component.html',
  styleUrls: ['./new-edit-company.component.scss']
})
export class NewEditCompanyComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef: ElementRef;
  @Input() isShowModal: boolean = false;
  @Input() userId: string;
  @Output() saveOrEdit: EventEmitter<AgencyConsoleSettingPopupAction> =
    new EventEmitter();

  private unsubscribe = new Subject<void>();
  public readonly SubscriptionStatus = SubscriptionStatus;
  public action: AgencyConsoleSettingPopupAction;
  public agencyData: AgencyConsoleSetting;
  public ActionForm = AgencyConsoleSettingPopupAction;
  public isDisable: boolean = false;
  public isLoading: boolean = false;
  public agencies: ICompany[] = [];
  public drawerOkText: string;
  public removedSubscriptions: StripeSubscriptions[] = [];
  public agencyList: Agency[] = [];
  public customerList: StripeCustomer[] = [];
  public subscriptionsList: StripeSubscriptions[] = [];
  public emailWarning = 'This cannot be changed once set';
  public ECountryName = ECountryName;
  public companyCodeError = '';

  public countryList = [
    {
      name: 'Australia',
      id: ECountryName.AUSTRALIA
    },
    {
      name: 'United States',
      id: ECountryName.UNITED_STATES
    }
  ];

  public CRMList = [];

  public maskPattern;
  public isRmEnvironment: boolean = false;
  public areaCode: string = '';

  constructor(
    private companyFormService: CompanyFormService,
    private toastService: ToastrService,
    private agencyConsoleSettingService: CompanyConsoleSettingService,
    private companyService: CompanyService,
    private agencyServiceDashboard: AgencyServiceDashboard
  ) {}

  get companyFormGroup() {
    return this.companyFormService.companyForm;
  }

  get companyName() {
    return this.companyFormGroup?.get('companyName');
  }

  get country() {
    return this.companyFormGroup?.get('country');
  }

  get crm() {
    return this.companyFormGroup?.get('CRM');
  }

  get CRMSubscription() {
    return this.companyFormGroup?.get('CRMSubscription');
  }

  get customer() {
    return this.companyFormGroup?.get('customer');
  }

  get subscription() {
    return this.companyFormGroup?.get('subscription');
  }
  get suggestedReplies() {
    return this.companyFormGroup?.get('suggestedReplies');
  }

  get voiceMailPhoneNumber() {
    return this.companyFormGroup?.get('voiceMailPhoneNumber');
  }

  get companyCode() {
    return this.companyFormGroup?.get('companyCode');
  }

  get plan() {
    return this.companyFormGroup?.get('plan');
  }

  get initCreateValidators() {
    return [
      this.companyName,
      this.country,
      this.crm,
      this.customer,
      this.subscription,
      this.plan
    ];
  }

  get initEditValidators() {
    return [
      this.companyName,
      this.customer,
      this.subscription,
      this.plan,
      this.voiceMailPhoneNumber
    ];
  }

  get isCreateModal() {
    return this.action === AgencyConsoleSettingPopupAction.CREATE;
  }

  get isEditModal() {
    return this.action === AgencyConsoleSettingPopupAction.EDIT;
  }

  ngOnInit(): void {
    this.companyFormService.buildCompanyForm();
    this.agencyConsoleSettingService.newEditModalData$
      .pipe(
        tap((newEditData) => {
          const { data } = newEditData || {};
          this.areaCode = data?.areaCode ? `(${data?.areaCode})` : '';
          this.isRmEnvironment = this.agencyServiceDashboard.isRentManagerCRM(
            (data as Agency) || null
          );
        }),
        switchMap((newEditData) => {
          const { action, data } = newEditData || {};
          this.action = action || null;
          this.agencyData = data || null;

          if (this.action) {
            return combineLatest([
              this.companyService.getCompanies(),
              this.agencyConsoleSettingService.getListOfAgency(),
              this.agencyConsoleSettingService.getListOfUnregisteredCustomers(
                this.agencyData?.id
              )
            ]);
          } else return EMPTY;
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((value) => {
        if (!value) return;
        const [agencies, ptAgencies, customers] = value;
        agencies?.length && (this.agencies = agencies);

        this.agencyList =
          ptAgencies?.sort((a, b) => a?.name.localeCompare(b?.name)) || [];

        if (customers?.length) {
          this.customerList = customers.filter(
            (customer) => customer.name && customer.email && customer.name
          );
        }

        this.isEditModal
          ? this.setupModalEditFields()
          : this.setupModalCreateFields();
        this.isLoading = false;
      });

    this.handleCustomersFieldLogic();
    this.handleSubscriptionFieldLogic();
    this.handleChangeCountry();
    this.handleValidateCompanyCode();
    this.subscribeToPlanChanges();

    this.maskPattern = getMaskPhoneNumber(
      this.voiceMailPhoneNumber.value || '',
      this.areaCode
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isShowModal']?.currentValue) {
      this.isLoading = true;
      this.CRMList = [];
      this.companyFormService.patchValueCompanyForm(null);
      this.companyFormGroup?.markAsUntouched();
      this.companyFormGroup?.markAsPristine();
      this.companyFormService.setOrRemoveCustomValidator(
        this.companyName,
        false,
        'companyNameExists'
      );
    }
  }

  setupModalCreateFields() {
    this.drawerOkText = 'Add';
    this.suggestedReplies.setValue(true);
    this.companyFormService.setValidationFields(this.initCreateValidators);
  }

  setupModalEditFields() {
    this.drawerOkText = 'Save';
    this.handleSubscriptionsValidate();
    this.companyFormService.setValidationFields(this.initEditValidators);

    const data = cloneDeep(this.agencyData);
    this.isCustomerRemoved(this.customerList) && delete data.customer;
    this.companyFormService.patchValueCompanyForm(
      this.agencyData,
      this.agencyData?.configPlans?.plan
    );
  }

  isCustomerRemoved(customerList: StripeCustomer[]) {
    return !customerList.find(
      (customer) => customer?.id === this.agencyData?.customer?.id
    );
  }

  handleSubscriptionsValidate() {
    this.removedSubscriptions = this.agencyData.subscriptions.filter(
      (subscription) => subscription?.deleted
    );

    this.companyFormService.setOrRemoveCustomValidator(
      this.subscription,
      !!this.removedSubscriptions.length,
      'subscriptionRemoved'
    );
  }

  generateAgencyAvatar() {
    if (
      this.get2CharacterFromName(this.companyName?.value) ===
        this.get2CharacterFromName(this.agencyData?.name) &&
      !!this.agencyData?.agencyLogo
    ) {
      return '';
    }
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    canvas.width = 300;
    canvas.height = 300;

    ctx.fillStyle = '#00AA9F';
    ctx.borderRadius = '4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '130px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      this.get2CharacterFromName(this.companyName?.value),
      canvas.width / 2,
      canvas.height / 2
    );

    return canvas.toDataURL('image/png');
  }

  get2CharacterFromName(name: string) {
    const chars = name?.split(' ');
    if (!chars?.length || chars.length < 1) return '';
    if (chars?.length === 1) {
      return chars[0].substring(0, 2).toUpperCase();
    }
    return (chars[0].charAt(0) + chars[1].charAt(0)).toUpperCase();
  }

  onAgencyFieldChange(agency: Agency) {
    this.companyName.setValue(agency?.name || '');
  }

  handleCustomersFieldLogic() {
    this.customer.valueChanges
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(),
        switchMap((value) => {
          if (!value) return EMPTY;
          this.subscription.reset([]);
          return this.agencyConsoleSettingService.getListOfSubscriptions(value);
        })
      )
      .subscribe((res) => {
        this.subscriptionsList = [];
        if (res?.length) {
          this.subscriptionsList = res.map((subscription) => ({
            ...subscription,
            displayName: subscription?.metadata?.Name ?? subscription?.id
          }));
        }
        if (this.customer.value === this.agencyData?.customer?.id) {
          this.subscriptionsList.push(...this.removedSubscriptions);
        }
      });
  }

  handleSubscriptionFieldLogic() {
    this.subscription.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((value) => {
        const removedIds = new Set(
          this.removedSubscriptions.map((subscription) => subscription.id)
        );
        const needCheckValidate = value?.some((id) => removedIds.has(id));
        this.companyFormService.setOrRemoveCustomValidator(
          this.subscription,
          needCheckValidate,
          'subscriptionRemoved'
        );
      });
  }

  handleChangeCountry() {
    this.country.valueChanges
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((value) => {
          if (!value || this.isEditModal) {
            return EMPTY;
          }
          if (this.country.value === ECountryName.UNITED_STATES) {
            this.companyFormGroup.addControl(
              'companyCode',
              new FormControl('')
            );
            this.companyCode.addValidators([Validators.required]);
            this.companyFormGroup.removeControl('CRMSubscription');
          } else {
            this.companyFormGroup.addControl(
              'CRMSubscription',
              new FormControl('')
            );
            this.CRMSubscription.addValidators([Validators.required]);
            this.companyFormGroup.removeControl('companyCode');
          }
          return this.agencyConsoleSettingService.getCRMList(value);
        })
      )
      .subscribe((res) => {
        if (res) {
          this.CRMList = res?.filter((rs) => rs.isDisplay);
          if (this.CRMList.length === 1) {
            this.crm.setValue(this.CRMList[0].id);
          }
        }
      });
  }

  handleValidateCompanyCode() {
    if (this.companyCode) {
      this.companyCode.valueChanges
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((value) => {
          if (this.companyCodeError) {
            this.companyCodeError = '';
          }
        });
    }
  }

  isChangeAgencyNameEdit() {
    const currentAgencyName = this.agencyData?.name.toLocaleLowerCase();
    const newAgencyName = this.companyName.value.toLocaleLowerCase();
    return !(currentAgencyName === newAgencyName);
  }

  handleSave() {
    if (this.companyFormGroup.invalid) {
      this.companyFormGroup.markAllAsTouched();
      return;
    }

    const companyId = this.agencyData?.id ? this.agencyData?.id : uuid4();
    const payload: CompanyPayload = {
      ...this.companyFormService.payloadForm(),
      agencyLogo: this.generateAgencyAvatar(),
      companyId: companyId
    };
    if (this.action === AgencyConsoleSettingPopupAction.EDIT) {
      this.agencyData.configPlans.features =
        this.companyFormService.payloadForm().configPlans?.features;
    }
    this.handleValidator(payload);
  }

  handleValidator(payload?: CompanyPayload) {
    this.agencyConsoleSettingService
      .checkAgencyValidator(this.agencyData?.id, this.companyName?.value)
      .subscribe((res) => {
        this.companyFormService.setMarkAsTouchedFields([
          this.companyName,
          this.voiceMailPhoneNumber,
          this.country,
          this.customer,
          this.subscription
        ]);
        if (res?.existName) {
          this.companyName.setErrors({ companyNameExists: true });
        }

        if (this.companyFormGroup.valid && !res?.existName) {
          this.addOrEditAgency(payload);
        }
      });
  }

  addOrEditAgency(payload: CompanyPayload) {
    this.isDisable = true;
    if (this.isCreateModal) {
      this.toastService.show(
        'Syncing',
        '',
        {
          disableTimeOut: true
        },
        'toast-syncing'
      );
    }

    this.agencyConsoleSettingService.saveCompany(payload).subscribe({
      next: (company) => {
        this.isShowModal = false;
        this.isCreateModal && this.toastService.clear();
        this.saveOrEdit.emit(this.action);
        this.isDisable = false;
        if (company.isCreatedAgency) {
          this.agencyConsoleSettingService
            .syncAllAgency(company.id)
            .subscribe();
        }
      },
      error: (err) => {
        this.isDisable = false;
        const { agencyURL } = err?.error?.messages || {};
        if (agencyURL) {
          this.companyCodeError = agencyURL;
          this.companyCode.setErrors({ invalidUrl: true });
        } else {
          this.saveOrEdit.emit(null);
          this.toastService.error(
            this.isCreateModal ? err?.error?.message : 'Update failed'
          );
        }
        this.toastService.clear();
      }
    });
  }

  customerListSearchFn(term: string, item: StripeCustomer) {
    term = term.toLowerCase();
    return (
      item?.name?.toLowerCase()?.includes(term) ||
      item?.email?.toLowerCase()?.includes(term)
    );
  }

  handleClose() {
    this.saveOrEdit.emit(null);
    this.companyName.clearAsyncValidators();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  subscribeToPlanChanges() {
    this.plan.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((plan: EAgencyPlan) => {
        this.companyFormService.handlePlanChange(
          plan,
          this.agencyData?.voiceMailPhoneNumber
        );
      });
  }

  handleVoicemailPhoneNumberChange(e) {
    const val = e.target?.value;
    this.maskPattern = val ? getMaskPhoneNumber(val, this.areaCode) : '';
  }

  handleKeydownEnter(event: HTMLInputElement) {
    event.blur();
  }
}
