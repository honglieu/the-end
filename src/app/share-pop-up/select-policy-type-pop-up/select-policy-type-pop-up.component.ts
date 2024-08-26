import { PoliciesFormService } from '@/app/dashboard/modules/agency-settings/components/policies/services/policies-form.service';
import {
  EPolicySaveType,
  PolicyType
} from '@/app/dashboard/modules/agency-settings/components/policies/utils/enum';
import { IPolicyDetail } from '@/app/dashboard/modules/agency-settings/utils/enum';
import { ITag } from '@/app/dashboard/modules/agency-settings/utils/interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { AiPolicyService } from '@/app/dashboard/services/ai-policy.service';
import { CompanyService } from '@services/company.service';
import { PropertiesService } from '@services/properties.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { EClassType } from '@trudi-ui';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import dayjs from 'dayjs';
import {
  BehaviorSubject,
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  switchMap,
  takeUntil
} from 'rxjs';

export interface IAddPolicyPopoverStyle {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  position?: string;
}

@Component({
  selector: 'select-policy-type-pop-up',
  templateUrl: './select-policy-type-pop-up.component.html',
  styleUrl: './select-policy-type-pop-up.component.scss'
})
export class SelectPolicyTypePopupComponent
  implements OnChanges, OnInit, OnDestroy
{
  @Input() visible: boolean = false;
  @Input() propertyIds: string[] = [];
  @Input() createMessageFrom: string = '';
  @Input() styles: {
    button: IAddPolicyPopoverStyle;
    popup: IAddPolicyPopoverStyle;
  };
  @Input() selectedText = '';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() triggerNextBtn = new EventEmitter<IPolicyDetail>(null);
  @Output() clickAdd = new EventEmitter();

  private destroy$: Subject<void> = new Subject<void>();
  private search$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  private _currentSearchValue: string = '';

  public PolicyType = PolicyType;
  public isExisting: boolean = false;
  public selectedPolicy;
  public isLoading: boolean = true;
  public outOfData: boolean = false;

  public updatePolicy: IPolicyDetail;
  public visibleSelectPolicy: boolean = false;
  public isRMEnvironment: boolean = false;
  public checkboxList = [
    {
      value: EPolicySaveType.CREATE_NEW,
      label: 'Create new',
      disabled: false
    },
    {
      value: EPolicySaveType.UPDATE_EXISTING,
      label: 'Update existing',
      disabled: false
    }
  ];
  public isBlur: boolean;
  public loadingTimeout: NodeJS.Timeout;
  public isScrollToEnd: boolean;
  public disabledPolicySelect: boolean = true;
  EClassType = EClassType;

  get addPolicyFormGroup() {
    return this.policiesFormService.addPolicyFormGroup;
  }

  get addOption() {
    return this.addPolicyFormGroup?.get('addOption');
  }

  get policy() {
    return this.addPolicyFormGroup.get('policy');
  }

  get version() {
    return this.addPolicyFormGroup.get('version');
  }

  public policyList = [];
  public policyVersion = [];
  public isRmEnvironment: boolean = false;
  public tags: ITag[] = [];
  public properties = [];

  constructor(
    private aiPolicyService: AiPolicyService,
    private policiesFormService: PoliciesFormService,
    private cdr: ChangeDetectorRef,
    private companyService: CompanyService,
    private agencyService: AgencyService,
    private propertiesService: PropertiesService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue) {
      this.visible = changes['visible']?.currentValue;
    }
  }

  ngOnInit(): void {
    this.policiesFormService.buildAddPolicyFormGroup();
    this.getListPolices();
    this.handleAddOption();
    this.handlePolicyChange();
    this.handleVersionChange();
    this.subscribeCurrentCompany();
  }

  subscribeCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((company) => {
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
          if (this.isRmEnvironment) {
            return this.propertiesService.listofActiveProp;
          } else {
            return this.aiPolicyService.getTags();
          }
        })
      )
      .subscribe((result) => {
        if (this.isRmEnvironment) {
          this.properties = result;
        } else {
          this.tags = result;
        }
      });
  }

  onScrollToEnd() {
    if (this.outOfData) return;
    const skeletons = [
      { isSkeleton: true, id: 'skeleton1', name: 'skeleton1' },
      { isSkeleton: true, id: 'skeleton2', name: 'skeleton2' }
    ];
    this.policyList = [...this.policyList, ...skeletons];
    this.isScrollToEnd = true;
    this.search$.next(this.search$.value);
  }

  getPolicyDetail(id) {
    this.updatePolicy = this.policyList?.find((i) => i.id === id);
    this.updatePolicy.policyCustoms = this.updatePolicy?.policyCustoms
      ? this.updatePolicy?.policyCustoms.sort((a, b) =>
          dayjs(b.createdAt).isAfter(dayjs(a.createdAt)) ? -1 : 1
        )
      : [];
    const dataFormat = {
      versions: [
        {
          type: PolicyType.DEFAULT,
          additionalData: this.updatePolicy.additionalData,
          defaultReply: this.updatePolicy.defaultReply,
          id: this.updatePolicy.id,
          name: 'Default policy',
          policyQuestions: this.updatePolicy.policyQuestions,
          updatedAt: this.updatePolicy.updatedAt
        },
        ...this.updatePolicy?.policyCustoms?.map((customPolicy) => ({
          ...customPolicy,
          type: PolicyType.CUSTOM,
          updatedAt: customPolicy.updatedAt
        }))
      ]
    };
    this.handleMapSuggestCustomLabel(dataFormat.versions);
    this.handleSortCustomPolicies();
    const policyChecked = this.policyVersion?.filter(
      (item) => item.isSuggested
    )[0];
    if (
      !this.version.value &&
      policyChecked &&
      ![
        ECreateMessageFrom.MULTI_MESSAGES,
        ECreateMessageFrom.CONTACT,
        ECreateMessageFrom.MULTI_TASKS
      ].includes(this.createMessageFrom as ECreateMessageFrom)
    ) {
      this.version.setValue(policyChecked.id);
    }
  }

  handleSortCustomPolicies() {
    this.policyVersion.sort((a, b) => {
      if (a.type !== PolicyType.CUSTOM || b.type !== PolicyType.CUSTOM) {
        return 0;
      }

      if (a.isSuggested !== b.isSuggested) {
        return a.isSuggested ? -1 : 1;
      }

      if (a.isSuggested && b.isSuggested) {
        if (
          [
            ECreateMessageFrom.MULTI_MESSAGES,
            ECreateMessageFrom.CONTACT,
            ECreateMessageFrom.MULTI_TASKS
          ].includes(this.createMessageFrom as ECreateMessageFrom)
        ) {
          return a.name.trim().toLowerCase() > b.name.trim().toLowerCase()
            ? 1
            : -1;
        }
        return dayjs(b.updatedAt).isAfter(dayjs(a.updatedAt)) ? 1 : -1;
      }

      return a.name.trim().toLowerCase() > b.name.trim().toLowerCase() ? 1 : -1;
    });
  }

  getListPolices() {
    this.search$
      .asObservable()
      .pipe(
        debounceTime(500),
        switchMap((searchValue) => {
          if (!this.visibleSelectPolicy) return EMPTY;

          const payload = {
            fetchDetail: true,
            lastValue: this.policyList[this.policyList?.length - 3]?.name,
            orderBy: {
              column: 'name',
              order: 'ASC'
            },
            search: searchValue,
            limit: 20
          };

          !this.isScrollToEnd && delete payload.lastValue;
          this.isScrollToEnd = false;
          return this.aiPolicyService.getListAiRepliesPolicy(payload).pipe(
            catchError(() => EMPTY),
            finalize(() => {
              this.isLoading = false;
              this.disabledPolicySelect = false;
              this.cdr.markForCheck();
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((policyList) => {
        if (!policyList) {
          this.policyList = [];
          return;
        }
        const limitData = 20;
        this.outOfData = policyList?.response?.length < limitData;
        this.policyList = [...this.policyList, ...policyList?.response].filter(
          (item) => !item?.isSkeleton
        );
        this.cdr.markForCheck();
      });
  }

  handleNext() {
    this.policiesFormService.clearValidationFields([this.policy, this.version]);
    if (this.isExisting) {
      this.policiesFormService.setValidationField([this.policy, this.version]);
    }
    if (this.addPolicyFormGroup.invalid) {
      this.addPolicyFormGroup.markAllAsTouched();
      return;
    }
    this.visibleSelectPolicy = false;
    this.triggerNextBtn.emit(this.isExisting ? this.updatePolicy : null);
  }

  handleClickAdd() {
    this.clickAdd.emit(true);
    if (this.visibleSelectPolicy) return;
    this.visibleSelectPolicy = true;
    this.search$.next(null);
    this.cdr.markForCheck();
  }

  handleVersionChange() {
    this.version?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        if (!value?.trim()) return;
        this.updatePolicy = {
          ...this.updatePolicy,
          isSelected: value === this.updatePolicy.id,
          policyCustoms: this.updatePolicy?.policyCustoms?.map((i) => ({
            ...i,
            isSelected: i.id === value
          }))
        };
      });
  }

  handlePolicyChange() {
    this.policy?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.policiesFormService.clearValidationFields([this.version]);
        this.selectedPolicy = value;
        if (!value?.trim()) return;
        this.version.reset();
        this.cdr.markForCheck();
        this.getPolicyDetail(value);
      });
  }

  handleAddOption() {
    this.addOption?.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        if (!value) return;
        if (value === EPolicySaveType.UPDATE_EXISTING) {
          this.isExisting = true;
          this.policiesFormService.setValidationField([
            this.policy,
            this.version
          ]);
        } else {
          this.isExisting = false;
          this.policiesFormService.clearValidationFields([
            this.policy,
            this.version
          ]);
        }
      });
  }

  handleBlurPolicy() {
    this.isLoading = false;
    this.isBlur = true;
    this.search$.value && this.search$.next(null);
  }

  handleSearchPolicy(event) {
    if (!event || event?.term.trim() === this._currentSearchValue.trim())
      return;
    this._currentSearchValue = event?.term;
    this.policyList = [];
    this.isBlur = false;
    // Use debounceTime for loading because the search event runs before the blur event.
    clearTimeout(this.loadingTimeout);
    this.loadingTimeout = setTimeout(() => {
      this.isLoading = !this.isBlur;
    }, 0);
    this.search$.next(event?.term);
  }

  getTagsOfCurrentProperty(tags, propertyIds) {
    const tagsOfCurrentProperty = [];
    const tagsOffOtherPolicy = new Set();
    const propertiesOffOtherPolicy = new Set();
    this.policyVersion?.forEach((item) => {
      item?.tags?.forEach((tag) => {
        tagsOffOtherPolicy.add(tag.id);
        tag.properties?.forEach((property) => {
          propertiesOffOtherPolicy.add(property.id);
        });
      });
    });
    tags.forEach((tag) => {
      const hasProperty = tag.properties?.some((property) =>
        propertyIds.includes(property.id)
      );
      const tagExists = tagsOffOtherPolicy.has(tag.id);
      const isExitsProperty = tag.properties?.some((property) =>
        propertiesOffOtherPolicy.has(property.id)
      );
      if (hasProperty && !tagExists && !isExitsProperty) {
        tagsOfCurrentProperty.push({ id: tag.id, name: tag.name });
      }
    });
    return tagsOfCurrentProperty;
  }

  getCurrentProperty(properties, propertyIds) {
    let propertiesOffOtherPolicy = [];
    this.policyVersion?.forEach((item) => {
      item?.properties?.forEach((item) => {
        propertiesOffOtherPolicy.push(item.id);
      });
    });

    let currentProperties = [];
    propertyIds?.forEach((propertyId) => {
      const currentProperty = properties?.find(
        (property) => property.id === propertyId
      );
      const propertyExists = propertiesOffOtherPolicy?.includes(propertyId);
      if (currentProperty && !propertyExists) {
        const { id, status, streetline } = currentProperty;
        currentProperties.push({
          id: id,
          status: status.status,
          streetline: streetline
        });
      }
    });
    return currentProperties;
  }

  handleAddCustomPolicy(event) {
    const countCustomPolicy = this.updatePolicy?.policyCustoms?.length;
    const newCustomPolicy = {
      id: '',
      name: `Custom Policy ${countCustomPolicy + 1}`,
      tags: this.getTagsOfCurrentProperty(this.tags, this.propertyIds),
      reply: '',
      properties: this.getCurrentProperty(this.properties, this.propertyIds),
      isSelected: true,
      additionalData: {
        uploadFile: [],
        contactCard: []
      }
    };
    this.updatePolicy = {
      ...this.updatePolicy,
      isSelected: false,
      policyCustoms: this.updatePolicy?.policyCustoms?.map((p) => ({
        ...p,
        isSelected: false
      }))
    };
    this.updatePolicy?.policyCustoms.push(newCustomPolicy);

    this.triggerNextBtn.emit(this.isExisting ? this.updatePolicy : null);
  }

  onVisibleChange(visible: boolean) {
    this.visibleChange.next(visible);
  }

  handleMapSuggestCustomLabel(customVersions) {
    this.policyVersion = customVersions.map((element) => {
      const isSuggested = this.mapSuggestionLabel(element);
      return {
        ...element,
        isSuggested
      };
    });
  }

  mapSuggestionLabel(customVersion) {
    if (customVersion.type === PolicyType.DEFAULT) return false;
    if (this.isRmEnvironment) {
      return customVersion?.properties
        .map((pro) => pro.id)
        .some((proId) => this.propertyIds.includes(proId));
    }
    return customVersion?.tags?.some((tag) =>
      tag?.properties?.some((pro) => this.propertyIds.includes(pro.id))
    );
  }

  ngOnDestroy(): void {
    clearTimeout(this.loadingTimeout);
  }
}
