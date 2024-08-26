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
import { FormControl, Validators } from '@angular/forms';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  skip,
  Subject,
  takeUntil
} from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ReiFormService } from '@services/rei-form.service';
import { TaskService } from '@services/task.service';
import { ReiForm, ReiFormLink } from '@shared/types/rei-form.interface';
import { TaskItem } from '@shared/types/task.interface';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { Router } from '@angular/router';
import { UserService } from '@services/user.service';
import { getErrorMessageReiForm } from '@shared/feature/function.feature';
import { IRadioButton } from '@trudi-ui';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { IConfirmEssential } from '@/app/task-detail/modules/steps/utils/communicationType';
import { SharedService } from '@/app/services/shared.service';
import { SelectDocumentService } from '@shared/components/select-document/select-document.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ICompany } from '@shared/types/company.interface';
import { CompanyService } from '@services/company.service';
import { StepKey } from '@trudi-ui';
import { cloneDeep } from 'lodash-es';

export enum SelectDocumentType {
  OPENEXIST = 'OPENEXIST',
  CREATENEW = 'CREATENEW'
}

export enum ReiFormAction {
  TOUCHED = 'TOUCHED'
}

const INIT_REIFORM_ERROR = {
  status: false,
  message: [
    {
      text: '',
      href: ''
    }
  ]
};

@Component({
  selector: 'app-select-document',
  templateUrl: './select-document.component.html',
  styleUrls: ['./select-document.component.scss'],
  providers: [SelectDocumentService]
})
export class SelectDocumentComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isResizableModal: boolean = false;
  @Input() modalId: string;
  @Input() showSelectDocumentPopup = false;
  @Input() showBackBtn = true;
  @Input() showPropertyAddress = true;
  @Input() title = '';
  @Input() isCreateNew = false;
  @Input() isStep: boolean = false;
  @Input() leaveDate = null;
  @Input() closable: boolean = true;
  @Output() onBackAttachModal = new EventEmitter();
  @Output() onCloseDocumentModal = new EventEmitter();
  @Output() onNext = new EventEmitter<ReiFormLink>();
  @Output() closeAndResetAllPopup = new EventEmitter<boolean>();

  public modalIdSelectDocument = StepKey.communicationStep.selectDocument;

  private unSub = new Subject<void>();
  private readonly _destroyModal$ = new Subject<void>();
  public isLoading = false;
  public searchValue: BehaviorSubject<string> = new BehaviorSubject(null);
  public isFocusOnSelectField = false;
  public selectedForm = new FormControl(null, [Validators.required]);
  public formName = new FormControl(null, [Validators.required]);
  public currentReiForm: ReiForm;
  public currentTask: TaskItem;
  public selectLabel = 'Select form';
  readonly SelectDocumentType = SelectDocumentType;
  public notFoundItemText = 'No results found';

  public loading: boolean = false;
  public currentSearch = '';
  public currentPage = 1;
  public currentAgencyId: string;
  public reiToken: string;
  public reiFormError = cloneDeep(INIT_REIFORM_ERROR);
  public radioListData: IRadioButton[] = [];
  public radioValue: string;
  public isConsole: boolean;
  private confirmEssentialData: IConfirmEssential;
  public currentCompany: ICompany;

  get checkboxList() {
    return this.trudiSendMsgService.checkboxList;
  }

  get selectedOption() {
    return this.trudiSendMsgService.selectedOption;
  }

  get isPrivate() {
    return this.trudiSendMsgService.isPrivate;
  }

  constructor(
    private router: Router,
    private taskService: TaskService,
    private reiFormService: ReiFormService,
    private agencyService: AgencyService,
    private trudiSendMsgService: TrudiSendMsgService,
    private dashboardAgencyService: AgencyService,
    private userService: UserService,
    private cd: ChangeDetectorRef,
    private stepService: StepService,
    private sharedService: SharedService,
    private selectDocumentService: SelectDocumentService,
    private inboxService: InboxService,
    private companyService: CompanyService
  ) {}

  public isLoading$ = this.selectDocumentService.isLoading$;
  public listReiForm$ = this.selectDocumentService.listReiForm$;

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();

    combineLatest([
      this.searchValue.pipe(
        skip(1),
        distinctUntilChanged((prev, current) => {
          if (!prev) return false;
          return prev.trim() === current.trim();
        })
      ),
      this.userService.userInfo$,
      this.companyService.getCurrentCompany()
    ])
      .pipe(debounceTime(300), takeUntil(this.unSub))
      .subscribe(([searchValue, userInfo, currentCompany]) => {
        if (
          Boolean(userInfo?.reiToken) &&
          !this.agencyService.isRentManagerCRM(currentCompany as ICompany)
        ) {
          this.currentCompany = currentCompany;
          this.selectDocumentService.currentPage =
            searchValue !==
            this.selectDocumentService?.getCurrentPayload()?.name
              ? 1
              : this.selectDocumentService.currentPage;
          this.selectDocumentService.setPayload({
            name: searchValue || '',
            page: this.selectDocumentService.currentPage
          });
        }
      });

    this.selectedForm.valueChanges
      .pipe(takeUntil(this.unSub))
      .subscribe((res) => {
        if (res) {
          const isTemplate =
            this.selectedOption?.id === SelectDocumentType.CREATENEW;
          this.currentReiForm = this.selectDocumentService
            .getListReiform()
            .find((data) => data.id === res);
          this.searchValue.next(this.currentReiForm.name);
          if (isTemplate) {
            this.formName?.setValue(
              this.currentReiForm.name +
                (this.taskService.currentTask$.value?.property?.streetline &&
                this.showPropertyAddress
                  ? ' - ' +
                    this.taskService.currentTask$.value?.property?.streetline
                  : '')
            );
          }
        } else {
          this.selectDocumentService.setPayload({
            name: '',
            page: 1
          });
        }
      });

    this.taskService.currentTask$
      .pipe(takeUntil(this.unSub))
      .subscribe((res) => {
        if (res) {
          this.currentTask = res;
        }
      });

    this.userService.userInfo$.pipe(takeUntil(this.unSub)).subscribe((user) => {
      this.reiToken = user?.reiToken;
    });
    this.getListRadioListData();
    this.stepService
      .getConfirmEssential()
      .pipe(takeUntil(this.unSub))
      .subscribe((data) => {
        if (!data) return;
        this.confirmEssentialData = data;
      });
  }

  private getReiFormTemplate() {
    this.selectDocumentService
      .getListReiFormTemplate$()
      .pipe(takeUntil(this.unSub), takeUntil(this._destroyModal$))
      .subscribe({
        error: (err) => {
          this.getReiFormError({
            throwError: err?.message === 'Invalid token'
          });
        }
      });
  }

  getListRadioListData() {
    const { checkboxList } = this.trudiSendMsgService;
    const radioDataAndValue = checkboxList.reduce(
      (result, item) => {
        result.radioListData.push({
          label: item.label,
          value: item.id
        });

        if (item.checked) {
          result.radioValue = item.id;
        }

        return result;
      },
      { radioListData: [], radioValue: null }
    );

    this.radioListData = radioDataAndValue.radioListData;
    this.radioValue = radioDataAndValue.radioValue;
    this.onValueRadioChange(radioDataAndValue.radioValue);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showSelectDocumentPopup']?.currentValue) {
      this.isLoading = this.isConsole;
    }
    if (this.showSelectDocumentPopup) {
      this.getReiFormTemplate();
    }
  }

  searchFnFake() {
    return true;
  }

  getReiFormError(rei?: { type?: ReiFormAction; throwError?: boolean }) {
    let errorMessage = null;
    const { getReiFormError, reiFormErrorNotFound } = getErrorMessageReiForm();

    if (!this.reiToken) {
      errorMessage = reiFormErrorNotFound;
    }

    if (this.reiToken && rei?.throwError) {
      errorMessage = getReiFormError;
    }

    if (errorMessage) {
      this.resetValue();
      this.setVariableReiForm(errorMessage);
    }

    if (
      rei.type === ReiFormAction.TOUCHED &&
      this.reiToken &&
      !this.reiFormError.message[0].text
    ) {
      this.resetValue();
      this.setVariableReiForm(getReiFormError);
    }
  }

  setVariableReiForm(message) {
    this.reiFormError = message;
    this.cd.markForCheck();
  }

  onScrollToEnd() {
    if (this.selectDocumentService.lastPage) return;
    this.selectDocumentService.getNextPage();
  }

  handleBackAttachModal() {
    this.resetForm();
    this.trudiSendMsgService.resetCheckBox();
    this.onBackAttachModal.emit();
    this._destroyModal$.next();
  }

  handleCloseModal() {
    this.closeAndResetAllPopup.emit();
    this.onCloseDocumentModal.emit();
    this.resetForm();
    this.resetDefaultCheckboxList();
    this.resetValue();
    this.reiFormError = cloneDeep(INIT_REIFORM_ERROR);
    this._destroyModal$.next();
  }

  resetForm() {
    this.selectedForm.reset();
    this.formName.reset();
    this.onPrivateChange(false);
    this.selectedForm.markAsUntouched({ onlySelf: true });
    this.formName.markAsUntouched({ onlySelf: true });
  }

  resetDefaultCheckboxList() {
    this.radioValue = SelectDocumentType.OPENEXIST;
    this.trudiSendMsgService.selectedOption = this.checkboxList?.[0];
  }

  onValueRadioChange(value: string) {
    this.currentSearch = '';
    this.currentReiForm = null;
    const isCreateNew = value === SelectDocumentType.CREATENEW;
    if (
      this.agencyService.isRentManagerCRM(this.currentCompany) ||
      !Boolean(this.reiToken)
    ) {
      const { reiFormErrorNotFound } = getErrorMessageReiForm();
      this.reiFormError = reiFormErrorNotFound;
    } else {
      if (!this.reiFormError.message[0].text) {
        this.selectDocumentService.setPayload({
          isTemplate: isCreateNew,
          page: 1,
          name: ''
        });
      }
    }
    this.selectLabel = isCreateNew ? 'Select form template' : 'Select form';
    const foundIndex = this.checkboxList.findIndex((item) => item.id === value);
    this.trudiSendMsgService.selectedOption = this.checkboxList[foundIndex | 0];
    this.resetForm();
  }

  onPrivateChange(event: boolean) {
    this.trudiSendMsgService.isPrivate = event;
  }

  isValidForm() {
    if (this.selectedOption.id === SelectDocumentType.OPENEXIST) {
      return !this.selectedForm.dirty || !!this.selectedForm.value;
    } else if (this.selectedOption.id === SelectDocumentType.CREATENEW) {
      const isFormValid = (formName: FormControl) =>
        formName.dirty && !!formName.value;
      return isFormValid(this.formName) && isFormValid(this.selectedForm);
    }
    return false;
  }

  handleOpen() {
    this.selectedForm.markAsTouched({ onlySelf: true });
    this.selectedForm.markAsDirty({ onlySelf: true });
    this.formName.markAsTouched({ onlySelf: true });

    if (!this.isValidForm()) return;

    this.isLoading = true;
    if (this.selectedOption?.id === SelectDocumentType.OPENEXIST) {
      this.reiFormService
        .createLinkReiForm(this.currentReiForm.id.toString())
        .pipe(takeUntil(this.unSub))
        .subscribe({
          next: (reiFormLink) => {
            if (reiFormLink) {
              this.onNext.emit(reiFormLink);
              this.isLoading = false;
            }
          },
          complete: () => {
            this.isLoading = false;
          }
        });
    } else if (this.selectedOption?.id === SelectDocumentType.CREATENEW) {
      const eventId =
        this.confirmEssentialData?.calendarEventBreachRemedy || null;
      const body = {
        templateId: this.currentReiForm?.templateId.toString(),
        formName: this.formName?.value,
        isPrivate: this.isPrivate,
        propertyId: this.currentTask?.property?.id,
        taskId: this.currentTask?.id,
        eventId,
        userTemlateId: this.currentReiForm?.id.toString(),
        leaveDate: this.leaveDate
      };
      this.reiFormService
        .createNewReiForm(body)
        .pipe(takeUntil(this.unSub))
        .subscribe({
          next: (reiFormLink) => {
            if (reiFormLink) {
              this.onNext.emit(reiFormLink);
              this.isLoading = false;
            }
          },
          complete: () => {
            this.isLoading = false;
          }
        });
    }
    this._destroyModal$.next();
  }

  ngSelectedSearch(event) {
    if (!event.term) {
      this.selectedForm.reset();
    }
    this.searchValue.next(event.term);
    return true;
  }

  ngBlur(event) {
    if (!this.currentReiForm && this.searchValue.value)
      this.searchValue.next('');
  }

  resetValue() {
    this.loading = false;
    this.currentPage = 1;
    this.currentSearch = '';
    this.currentReiForm = null;
  }

  handleClickMsg(path) {
    if (!path) return;
    this.onCloseDocumentModal.emit();
    this.router.navigate([path]);
  }

  ngOnDestroy(): void {
    this.resetValue();
    this.trudiSendMsgService.resetCheckBox();
    this.unSub.next();
    this.unSub.complete();
  }
}
