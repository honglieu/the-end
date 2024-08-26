import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  finalize,
  from,
  lastValueFrom,
  switchMap,
  takeUntil
} from 'rxjs';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SharedService } from '@services/shared.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AttachAction } from '@trudi-ui';
import { AiPolicyService } from '@/app/dashboard/services/ai-policy.service';
import { FormArray, FormGroup, Validators } from '@angular/forms';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  FILE_VALID_TYPE,
  MAX_FILE_SIZE,
  TIME_FORMAT
} from '@/app/services/constants';
import { TinyEditorFileControlService } from '@/app/services/tiny-editor-file-control.service';
import { validateFileExtension } from '@shared/feature/function.feature';
import { ToastrService } from 'ngx-toastr';
import { EToastType } from '@/app/toast/toastType';
import { SendMessageService } from '@services/send-message.service';
import { EUserPropertyType, UserTypeEnum } from '@shared/enum/user.enum';
import { PropertiesService } from '@services/properties.service';
import { CompanyService } from '@services/company.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { FilesService } from '@services/files.service';
import {
  IPolicyDetail,
  IQuestionPolicy,
  IUserUpdated
} from '@/app/dashboard/modules/agency-settings/utils/enum';
import {
  IInvalidFile,
  ITag
} from '@/app/dashboard/modules/agency-settings/utils/interface';
import { PoliciesFormService } from '@/app/dashboard/modules/agency-settings/components/policies/services/policies-form.service';
import { PoliciesService } from '@/app/dashboard/modules/agency-settings/components/policies/services/policies.service';
import { EPolicyDetailOpenFrom } from '@/app/dashboard/modules/agency-settings/components/policies/utils/enum';
import {
  clearStylesReply,
  convertHtmlToText
} from '@/app/dashboard/modules/agency-settings/components/policies/utils/helper-function';
import { IPolicySelected } from '@/app/dashboard/modules/agency-settings/components/policies/utils/polices-interface';
import { FileUploadService } from '@services/fileUpload.service';
import uuid4 from 'uuid4';
import { EBehaviorScroll } from '@shared/utils/helper-functions';
import dayjs from 'dayjs';
import { EPage } from '@/app/shared/enum';
import { convertUTCToLocalDateTime } from '@/app/core/time/timezone.helper';
import { AnimationOptions } from 'ngx-lottie';
import { ChatGptService } from '@/app/services/chatGpt.service';

@Component({
  selector: 'policy-detail-panel',
  templateUrl: './policy-detail-panel.component.html',
  styleUrls: ['./policy-detail-panel.component.scss'],
  animations: [
    trigger('openClose', [
      state('false', style({ display: 'none', width: '0' })),
      state('true', style({ display: 'block', width: '624px' })),
      transition('false <=> true', [animate('.3s ease-out')])
    ])
  ],
  providers: [TinyEditorFileControlService]
})
export class PolicyDetailPanelComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @ViewChild('textarea') textarea: ElementRef;
  @ViewChild('policyBodyPanel') policyBodyPanel: ElementRef;
  @ViewChild('spanElement') spanElement: ElementRef;
  @ViewChildren('customPolicyElements')
  customPolicyElements!: QueryList<ElementRef>;

  @Input() editMode: boolean = false;
  @Input() visible: boolean = false;
  @Input() currentPolicyId: string;
  @Input() policyDefaultValue: IPolicyDetail;
  @Input() manualHighlighText: string;
  @Input() selectedPolicy: IPolicySelected;
  @Input() openFrom: EPolicyDetailOpenFrom = EPolicyDetailOpenFrom.POLICY_PAGE;
  @Output() closeDrawer = new EventEmitter();
  @Output() deleteAiPolicy = new EventEmitter();
  @Output() savePolicy = new EventEmitter();

  public options: AnimationOptions = {
    path: '/assets/animations/ai_loading.json'
  };
  private destroy$: Subject<void> = new Subject<void>();
  public readonly EPage = EPage;
  public hasValueChanged: boolean = false;
  public listQuestions: IQuestionPolicy[] = [];
  public isAutomateReply: boolean = false;
  public isShowErrorOfQuestionTag: boolean = false;
  public pipeDateFormat: string;
  public agencyTimezone: string;
  public isConsole: boolean = false;
  public isArchivedMailbox: boolean = false;
  public isShowPolicyNameText: boolean = false;
  public prefillReply: string = '';
  public selectedContactCard = [];
  public isLoading: boolean = false;
  public policyDetail: IPolicyDetail;
  public FILE_VALID_TYPE = FILE_VALID_TYPE;
  public MAX_FILE_SIZE = MAX_FILE_SIZE;
  public ACCEPT_ONLY_SUPPORTED_FILE = ACCEPT_ONLY_SUPPORTED_FILE;
  public listOfFiles;
  public isNoQuestion: boolean = false;
  public overFileSize = false;
  public isUnSupportFile = false;
  public isInvalid: boolean = false;
  public updatedAt: string = '';
  public isLoadingOk: boolean = false;
  public userPropertyType = EUserPropertyType;
  public isScrolledDrawerContent: boolean = false;
  public customPolicies = [];
  public customPolicyCounter = 1;
  public countCustomPolicy: number = 0;
  public properties = [];
  public isRMEnvironment: boolean = false;
  public tags: ITag[] = [];
  public dataSources = [];
  public listOfPropertiesOrTags = [];
  public isLoadingFile: boolean = false;
  public invalidDefaultReply: boolean = false;
  public invalidCustomReply: boolean = false;
  public isSubmitted: boolean = false;
  public currentIndex: number;
  public isOpenSupplierPopup: boolean = false;
  public supplierPopupForm: FormGroup;
  public isAddSupplier: boolean = false;
  public listPropertyCurrentPolicy: string[] | unknown[] = [];
  public indexHasInactiveProperty: string[] = [];
  public lastUpdatedBy: IUserUpdated;
  public invalidCustomFile: boolean = false;
  public isAiGenerating: boolean = false;
  public isBlurPolicyName: boolean = false;
  public scrollTimeOut: NodeJS.Timeout;
  public triggerBtnTimeOut: NodeJS.Timeout;
  public policyNameTimeout: NodeJS.Timeout;
  public focusTimeOut: NodeJS.Timeout;
  public confirmDelete: boolean = false;
  public isCloseAiGenerating: boolean = false;

  get policyForm() {
    return this.policiesFormService?.policyForm;
  }

  get policyName() {
    return this.policyForm.get('policyName');
  }

  get defaultReply() {
    return this.policyForm.get('defaultReply');
  }

  get customPolicy(): FormArray {
    return this.policyForm.get('customPolicy') as FormArray;
  }

  get questionForm() {
    return this.policiesFormService?.questionForm;
  }

  get question() {
    return this.questionForm.get('question');
  }

  get selectedCard() {
    return this.policyForm.get('selectedContactCard');
  }

  get editQuestion() {
    return this.questionForm.get('editQuestion');
  }

  get invalidForm() {
    return (
      this.policyForm.invalid ||
      this.isNoQuestion ||
      this.invalidDefaultReply ||
      this.policyName.invalid ||
      this.question.invalid ||
      this.editQuestion.invalid ||
      this.isUnSupportFile ||
      this.overFileSize ||
      this.invalidCustomReply ||
      this.invalidCustomFile
    );
  }
  get permissionToEdit() {
    return !!this.aiPolicyService.hasPermissionToEdit;
  }

  constructor(
    private _agencyDateFormatService: AgencyDateFormatService,
    public sharedService: SharedService,
    public inboxService: InboxService,
    private policiesFormService: PoliciesFormService,
    private aiPolicyService: AiPolicyService,
    private _changeDetectorRef: ChangeDetectorRef,
    private tinyEditorFileControlService: TinyEditorFileControlService,
    private toastService: ToastrService,
    private sendMessageService: SendMessageService,
    private policiesService: PoliciesService,
    private companyService: CompanyService,
    private agencyService: AgencyService,
    private propertiesService: PropertiesService,
    private filesService: FilesService,
    private fileUpload: FileUploadService,
    private propertyService: PropertiesService
  ) {
    this.policiesFormService.buildPolicyForm();
    this.getCurrentCompany();
    this.getCurrentDateTimeFormat();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.isShowPolicyNameText = false;
    this.isLoading = false;
    this.policiesService.setSelectedContactCard([]);
    this.tinyEditorFileControlService.setListOfFiles([]);
    if (changes['policyDefaultValue']?.currentValue) {
      this.handlePreFillPolicyForm(
        this.policyDefaultValue,
        this.manualHighlighText
      );
    }
  }

  ngOnInit(): void {
    this.handlePolicyDetail();
    this.isConsole = this.sharedService.isConsoleUsers();
    this.checkIsArchiveMailbox();
    this.getListOfFile();
    this.subscribeSelectedCard();
    this.getAllPropertiesOfCustom();
    this.handlePolicyChange();
    ChatGptService.enableSuggestReplySetting
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        if (status) return;
        this.onCloseSuggestedChatGpt();
      });
  }

  handlePolicyChange() {
    this.policyName.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((value) => {
        const emptyValue = !value.trim();
        this.policyName.setValidators(
          emptyValue
            ? [Validators.required]
            : this.policiesFormService.validateDuplicatePolicyName(false)
        );
        this.policyName.updateValueAndValidity();
      });
  }

  handlePolicyDetail() {
    switch (this.openFrom) {
      case EPolicyDetailOpenFrom.POLICY_PAGE:
        this.getPolicyDetail(this.currentPolicyId);
        break;
      default:
        if (!this.policyDefaultValue) {
          this.editMode = false;
          this.getPolicyAiGenerating();
          break;
        }
        this.handlePreFillPolicyForm(
          this.policyDefaultValue,
          this.manualHighlighText
        );
        break;
    }
  }

  ngAfterViewInit(): void {
    this.triggerBtnTimeOut = setTimeout(() => {
      const button = document.querySelector(`#scroll-policy`) as HTMLDivElement;
      button?.click();
    }, 1000);
    if (this.openFrom === EPolicyDetailOpenFrom.POLICY_PAGE) {
      this.isBlurPolicyName = false;
    } else {
      this.handleFocusToSelectedPolicy();
    }
  }

  handleFocusToSelectedPolicy() {
    this.isBlurPolicyName = !this.policyDefaultValue?.isSelected;
    this.focusTimeOut = setTimeout(() => {
      const headerElements = document.getElementsByClassName(
        'trudi-ui-textarea'
      ) as HTMLCollectionOf<HTMLElement>;
      !this.isBlurPolicyName
        ? this.focusDefaultAndSetCursorToEnd(headerElements[0])
        : this.focusCustomPolicy(headerElements);
    }, 1000);
  }

  focusDefaultAndSetCursorToEnd(element): void {
    element?.focus();
    const length = element?.value?.length;
    element?.setSelectionRange(length, length);
    this._changeDetectorRef.markForCheck();
  }

  focusCustomPolicy(headerElements) {
    const headerSelected = this.policyDefaultValue?.policyCustoms?.findIndex(
      (item) => item?.isSelected
    );
    if (!headerElements.length || headerSelected === -1) return;
    headerElements[headerSelected]?.focus();
    this._changeDetectorRef.markForCheck();
  }

  scrollToSelectedPolicyVersion(
    block: ScrollLogicalPosition = 'center',
    inline: ScrollLogicalPosition = 'center'
  ): void {
    if (this.openFrom === EPolicyDetailOpenFrom.POLICY_PAGE) return;
    const selectedCustomIndex =
      this.policyDefaultValue?.policyCustoms?.findIndex(
        (item) => item?.isSelected
      );
    if (selectedCustomIndex === -1) return;
    clearTimeout(this.scrollTimeOut);
    this.scrollTimeOut = setTimeout(() => {
      const scrollElement =
        this.customPolicyElements?.toArray()?.[selectedCustomIndex]
          ?.nativeElement;
      scrollElement?.scrollIntoView({
        block,
        inline,
        behavior: EBehaviorScroll.SMOOTH
      });
    }, 0);
  }

  handlePreFillPolicyForm(data, hightLightText?: string) {
    if (!data) return;
    this.policiesFormService.patchValuePolicyForm(data, hightLightText);
    this.policyDetail = data;
    const { questions, listOfFiles, selectedContactCard } =
      this.policyForm.value;
    this.listQuestions = questions;
    this.selectedContactCard = selectedContactCard;
    this.listOfFiles = listOfFiles;
    this.getUpdateDate(data.updatedAt);
    this.lastUpdatedBy = this.handleLastUpdatedBy(data.lastUpdatedBy);
    this.handleAddInactivePropertyToList(data?.policyCustoms);
  }
  getPolicyAiGenerating() {
    const workflow_id = '';
    const text = this.manualHighlighText;
    let payload = { workflow_id, text };
    this.isLoading = true;
    this.isAiGenerating = true;
    this.aiPolicyService.getPolicyAiGenerated(payload).subscribe((res) => {
      if (!res || this.isCloseAiGenerating) return;
      const policyQuestions = res.three_applicable_questions.map((value) => {
        return { id: uuid4(), question: value };
      });
      const policy = {
        name: res?.policy_title,
        defaultReply: '',
        policyQuestions,
        policyCustoms: [],
        additionalData: { contactCard: [], uploadFile: [] },
        isSelected: true
      };
      this.handlePreFillPolicyForm(policy, this.manualHighlighText);
      this.focusTimeOut = setTimeout(() => {
        const policyNameElement = document.querySelector(
          '.policy-value'
        ) as HTMLDivElement;
        policyNameElement.click();
      }, 100);
      this.isLoading = false;
      this.isAiGenerating = false;
      this._changeDetectorRef.markForCheck();
    });
  }

  getAllPropertiesOfCustom() {
    this.customPolicy.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((val) => {
        if (this.isRMEnvironment) return;
        const allProperties = val
          .flatMap((policy) => policy.property)
          .flatMap((pro) => this.dataSources.filter((data) => data.id === pro))
          .flatMap((data) => data.properties.map((pr) => pr.id));

        this.listPropertyCurrentPolicy = [...new Set(allProperties)];
      });
  }

  getCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((company) => {
          this.isRMEnvironment = this.agencyService.isRentManagerCRM(company);
          return this.isRMEnvironment
            ? this.propertiesService.listofActiveProp
            : this.aiPolicyService.getTags();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((result) => {
        if (!result?.length) return;
        this.formatListDataSources(result);
      });
  }

  checkIsArchiveMailbox() {
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isArchivedMailbox) => {
        this.isArchivedMailbox = isArchivedMailbox;
      });
  }

  getCurrentDateTimeFormat() {
    return combineLatest([
      this._agencyDateFormatService.dateFormatDayJS$,
      this._agencyDateFormatService.timezone$
    ])
      .pipe(distinctUntilChanged(), filter(Boolean), takeUntil(this.destroy$))
      .subscribe(([dateFormat, timeZone]) => {
        this.pipeDateFormat = dateFormat;
        this.agencyTimezone = timeZone.value;
      });
  }

  getListOfFile() {
    this.tinyEditorFileControlService.listOfFiles$
      .pipe(takeUntil(this.destroy$))
      .subscribe((newFileList) => {
        this.processInitUploadFile(newFileList);
        this.handleFileUpload(newFileList);
        this.validateFileSize();
        if (!this.isSubmitted) return;
        this.invalidDefaultReply =
          this.policiesFormService.invalidDefaultReplyField(
            this.defaultReply.value,
            this.listOfFiles?.length > 0,
            !!this.selectedContactCard?.length
          );
        this._changeDetectorRef.markForCheck();
      });
  }

  subscribeSelectedCard() {
    this.selectedCard.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (!this.isAddSupplier) return;
        this.selectedContactCard = value;
        this.invalidDefaultReply =
          this.policiesFormService.invalidDefaultReplyField(
            this.defaultReply.value,
            this.listOfFiles?.length > 0,
            !!this.selectedContactCard?.length
          );
        this._changeDetectorRef.markForCheck();
      });
  }

  handleEnterPolicyName(event) {
    this.isShowPolicyNameText = false;
  }

  onScrollDrawerContent(event) {
    this.isScrolledDrawerContent = true;
    this.hideMenuAndScrollbar();
    this._changeDetectorRef.markForCheck();
  }

  hideMenuAndScrollbar() {
    const menus = document.querySelectorAll('.tox-menu');
    menus.forEach((menu) => {
      const htmlMenu = menu as HTMLElement;
      if (htmlMenu) {
        htmlMenu.classList.add('hide');
      }
    });
  }

  getPolicyDetail(currentPolicyId) {
    if (!currentPolicyId) return;
    this.isLoading = true;
    this.aiPolicyService
      .getPolicyDetail(currentPolicyId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isBlurPolicyName = true;
          this.focusTimeOut = setTimeout(() => {
            const policyNameElement = document.querySelector(
              '.policy-value'
            ) as HTMLDivElement;
            policyNameElement?.click();
          }, 0);

          this.isLoading = false;
          this._changeDetectorRef.markForCheck();
        })
      )
      .subscribe((policy) => {
        if (!policy) return;
        const { updatedAt, lastUpdatedBy, policyCustoms } = policy || {};
        this.getUpdateDate(updatedAt);
        this.lastUpdatedBy = this.handleLastUpdatedBy(lastUpdatedBy);

        const policyFormat = {
          ...policy,
          policyCustoms: this.handleSortCustomPolicies(policyCustoms)
        };

        this.handlePreFillPolicyForm(policyFormat);
      });
  }

  handleLastUpdatedBy(lastUpdatedBy: IUserUpdated) {
    return {
      ...lastUpdatedBy,
      isConsoleUpdate: [UserTypeEnum.ADMIN, UserTypeEnum.SUPERVISOR].includes(
        lastUpdatedBy?.type
      )
    };
  }

  handleSortCustomPolicies(customPolicies) {
    return customPolicies?.sort((a, b) =>
      dayjs(b.createdAt).isAfter(dayjs(a.createdAt)) ? -1 : 1
    );
  }

  handleValidatorsSaveAndEditPolicy(data) {
    this.isInvalid = data.isError;
    if (data?.policy?.existName) {
      this.isShowPolicyNameText = false;
      this.policyName.setValidators(
        this.policiesFormService.validateDuplicatePolicyName(true)
      );
      this.policyName.markAsTouched();
      this.policyName.markAsDirty();
      this.policyName.updateValueAndValidity();
      this.isBlurPolicyName = false;
    }
    this.listQuestions = this.listQuestions.map((i) => {
      const item = data.questions?.find(
        (item) =>
          i?.question?.trim().toLowerCase() ===
          item?.question?.trim().toLowerCase()
      );
      return {
        ...i,
        similarPolicies: item?.similarPolicies?.length
          ? item?.similarPolicies.map((item) => ({
              ...item,
              question: i.question
            }))
          : null,
        existName: item?.existName || null,
        isInvalidSimilarPolicies: true
      };
    });
    this._changeDetectorRef.markForCheck();
  }

  handleOk() {
    this.isSubmitted = true;
    this.isNoQuestion = !this.listQuestions?.length;
    this.validatorAllGeneratedReplies();
    if (this.invalidForm) {
      this.policyForm.markAllAsTouched();
      this.policyForm.markAsDirty();
      this.policyForm.enable();
      return;
    }

    this.isLoadingOk = true;
    if (!this.currentPolicyId && !this.policyDefaultValue?.id) {
      this.handleAddNewPolicy();
    } else {
      this.handleEditPolicy();
    }
  }

  async getPayloadPolicy(isEdit) {
    const payloadQuestions = this.listQuestions?.map((item) => ({
      question: item.question,
      ...(isEdit && !item?.isAddNewQuestion && { id: item.id })
    }));

    const customPolicies = this.customPolicy.value.map((i) => {
      const basePolicy = {
        ...(isEdit && !!i.customPolicyId.length && { id: i.customPolicyId }),
        name: i.policyName,
        reply: convertHtmlToText(i.generatedReplies),
        additionalData: {
          uploadFile: i.listOfFiles,
          contactCard: i.selectedContactCard
        }
      };

      return {
        ...basePolicy,
        ...(this.isRMEnvironment
          ? { properties: i.property }
          : { tags: i.property })
      };
    });

    const fileUploadedS3 = await Promise.all(
      customPolicies.map(async (policy) => {
        return {
          ...policy,
          additionalData: {
            ...policy.additionalData,
            uploadFile: !!policy.additionalData.uploadFile?.length
              ? await this.sendMessageService.uploadFileS3(
                  policy.additionalData.uploadFile
                )
              : []
          }
        };
      })
    );

    const addNewPolicyPayload = {
      name: this.policyName.value,
      defaultReply: convertHtmlToText(this.defaultReply.value),
      additionalData: {
        uploadFile: !!this.listOfFiles?.length
          ? await this.sendMessageService.uploadFileS3(this.listOfFiles)
          : [],
        contactCard: this.selectedContactCard
      },
      questions: payloadQuestions,
      policyCustoms: fileUploadedS3
    };
    const editPolicyPayload = {
      ...addNewPolicyPayload,
      policyId: this.policyDetail?.id
    };

    return isEdit ? editPolicyPayload : addNewPolicyPayload;
  }

  handleEditQuestion(event) {
    this.listQuestions = event;
  }

  async handleEditPolicy() {
    this.aiPolicyService
      .updatePolicy(await this.getPayloadPolicy(true))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingOk = false;
          if (this.isInvalid) return;
          this.handleShowToast();
          this.savePolicy.emit(true);
          this.closeDrawer.emit(false);
        })
      )
      .subscribe((policy) => {
        this.handleValidatorsSaveAndEditPolicy(policy);
        this.policyForm.enable();
      });
  }

  async handleAddNewPolicy() {
    this.aiPolicyService
      .addPolicy(await this.getPayloadPolicy(false))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingOk = false;
          if (this.isInvalid) return;
          this.handleShowToast();
          this.savePolicy.emit(true);
          this.closeDrawer.emit(false);
          this.aiPolicyService.setSavedPolicy(this.policyDefaultValue);
        })
      )
      .subscribe((policy) => {
        this.handleValidatorsSaveAndEditPolicy(policy);
        this.policyForm.enable();
      });
  }

  handleShowToast() {
    const message = `Policy ${this.editMode ? 'updated' : 'created'}`;
    this.toastService.show(
      message,
      '',
      {
        timeOut: 3000
      },
      EToastType.SUCCESS
    );
  }

  handleCancel() {
    this.closeDrawer.emit();
    this.aiPolicyService.setSavedPolicy(null);
    this.tinyEditorFileControlService.setListOfFiles([]);
  }

  handleDelete(event) {
    this.confirmDelete = true;
  }

  handleCancelModal() {
    this.confirmDelete = false;
  }

  deletePolicy() {
    this.aiPolicyService
      .deletePolicy(
        this.openFrom === EPolicyDetailOpenFrom.POLICY_PAGE
          ? this.currentPolicyId
          : this.policyDetail?.id
      )
      .subscribe(() => {
        this.toastService.show(
          'Policy deleted',
          '',
          {
            timeOut: 5000
          },
          EToastType.WARNING
        );
      });
    this.confirmDelete = false;
    this.deleteAiPolicy.emit();
    this.handleCancel();
  }

  handleClickAttachIcon(event) {
    this.isScrolledDrawerContent = false;
    this._changeDetectorRef.markForCheck();
  }

  handleClickAttachments(action) {
    if (this.isLoadingOk) return;
    switch (action) {
      case AttachAction.Computer:
        this.handleAddFileComputer();
        break;
      case AttachAction.ContactCard:
        this.selectedCard.setValue(this.selectedContactCard);
        this.setSupplierPopupVariable(true, this.policyForm);
        break;
      default:
        break;
    }
  }

  onTriggerAddContactCard() {
    this.setSupplierPopupVariable(false);
  }

  onCloseAddContactCard() {
    this.setSupplierPopupVariable(false);
  }

  handleCloseQuestion(value) {
    this.listQuestions = value;
  }

  handleAddQuestion(value) {
    if (value.length) {
      this.isNoQuestion = false;
    }
    this.listQuestions = value;
    this.isShowErrorOfQuestionTag = false;
  }

  handleAddFileComputer() {
    const button = document.querySelector(`#upload-policy`) as HTMLDivElement;
    button?.click();
    this.tinyEditorFileControlService.setListOfFiles([]);
  }

  async fileBrowseHandler(event) {
    this.tinyEditorFileControlService.fileBrowseHandler(event);
  }

  async handleFileUpload(listOfFiles) {
    this.isLoadingFile = !!listOfFiles?.length;
    for (const file of listOfFiles) {
      const fileCheck = file?.[0] || file;
      if (
        !fileCheck?.mediaLink &&
        fileCheck?.canUpload &&
        !fileCheck?.uploaded
      ) {
        const infoLink$ = from(
          this.fileUpload.uploadFile2(
            fileCheck,
            this.propertyService.currentPropertyId.value
          )
        ).pipe(takeUntil(this.destroy$));
        const infoLink = await lastValueFrom(infoLink$);
        fileCheck.mediaLink = infoLink?.Location;
        fileCheck.uploaded = true;
        fileCheck.canUpload = true;
      }
    }

    const listFileUpload = this.listOfFiles?.filter(
      (file) => !file[0]?.uploaded && file[0]?.canUpload
    );

    this.listOfFiles = this.listOfFiles?.map((file) => {
      listFileUpload?.some((item) => item[0]?.localId === file[0]?.localId) &&
        (file[0].uploaded = true);
      return file;
    });

    this.isLoadingFile = this.listOfFiles.some(
      (file) => !file[0]?.uploaded && file[0]?.canUpload
    );
    this._changeDetectorRef.markForCheck();
  }

  processInitUploadFile(listOfFiles) {
    listOfFiles.forEach((file) => {
      const fileCheck = file?.[0] || file;
      if (!fileCheck?.localId) {
        fileCheck.localId = uuid4();
      }
      fileCheck.uploaded = false;
      fileCheck.canUpload =
        validateFileExtension(fileCheck, this.FILE_VALID_TYPE) &&
        fileCheck.size / 1024 ** 2 <= MAX_FILE_SIZE;
      fileCheck.mediaType = this.filesService.getFileTypeSlash(
        fileCheck?.fileType?.name
      );
    });
    this.listOfFiles = [...(this.listOfFiles || []), ...listOfFiles];
    this._changeDetectorRef.markForCheck();
  }

  removeFile(index) {
    const newList = this.listOfFiles.filter((_, i) => i !== index);
    this.listOfFiles = [];
    this.tinyEditorFileControlService.setListOfFiles(newList);
    const input = document.querySelector(`#upload-policy`) as HTMLInputElement;
    input.value = null;
    this.tinyEditorFileControlService.validateFileSize();
  }

  onClearContactById(cardId: string) {
    if (this.selectedContactCard.length > 0) {
      const selectedContactCard = this.selectedContactCard.filter(
        (card) => card.id !== cardId
      );
      this.policiesService.setSelectedContactCard(selectedContactCard);
      this.selectedContactCard = selectedContactCard;
    }
  }

  validateFileSize() {
    if (!this.listOfFiles?.length) {
      this.isUnSupportFile = false;
      this.overFileSize = false;
      return;
    }
    this.isUnSupportFile = this.listOfFiles?.some(
      (item) => !validateFileExtension(item[0] || item, this.FILE_VALID_TYPE)
    );
    this.overFileSize = this.listOfFiles?.some(
      (item) => (item[0]?.size || item.size) / 1024 ** 2 > this.MAX_FILE_SIZE
    );
    this._changeDetectorRef.markForCheck();
  }

  removeCustomPolicy(index: number) {
    this.customPolicy.controls.splice(index, 1);
    this.customPolicy.updateValueAndValidity();
  }

  addListOfFiles(event, index) {
    const listOfFiles = event;
    const customPolicyArray = this.customPolicy as FormArray;
    const group = customPolicyArray.at(index) as FormGroup;
    group?.patchValue({ listOfFiles: listOfFiles });
    const {
      generatedReplies,
      selectedContactCard,
      listOfFiles: listOfFileForm
    } = group.value;
    this.invalidCustomReply =
      this.policiesFormService.invalidDefaultReplyCustomField(
        generatedReplies,
        !!listOfFileForm?.length,
        !!selectedContactCard?.length,
        index
      );
  }

  handleAddCustomPolicy(event) {
    this.formatListDataSources(this.dataSources);
    this.customPolicyCounter++;
    this.policiesFormService.addCustomPolicyItem();
    this.customPolicy.controls.forEach((group: FormGroup, index) => {
      this.currentIndex = index;
      const uniquePolicyName = `Custom Policy ${index + 1}`;
      if (!!group.value?.policyName) return;
      group.patchValue({
        policyName: uniquePolicyName
      });
    });
    this.handleFocusCustomAfterAdd();
  }

  handleFocusCustomAfterAdd() {
    clearTimeout(this.policyNameTimeout);
    this.policyNameTimeout = setTimeout(() => {
      const headerElements = document.getElementsByClassName(
        'trudi-ui-textarea'
      ) as HTMLCollectionOf<HTMLElement>;
      if (!headerElements?.length) return;
      const indexFocus = headerElements.length - 1;
      headerElements[indexFocus]?.focus();
      this._changeDetectorRef.markForCheck();
    }, 100);
  }

  handleFocusChange(isFocus: boolean) {
    if (!isFocus) return;
    this.formatListDataSources(this.dataSources);
  }

  formatListDataSources(dataSource) {
    const propertiesFilter =
      this.policiesService.validateTagsInCurrentCustomPolicy(
        this.currentIndex,
        this.dataSources,
        this.listPropertyCurrentPolicy,
        this.isRMEnvironment
      );
    this.dataSources = dataSource?.map((item) => {
      const matchingPolicy = this.customPolicy.value.find((policy, index) => {
        return (
          policy.property.includes(item?.id) && index !== this.currentIndex
        );
      });

      const existedOtherCustom = this.isRMEnvironment
        ? false
        : this.policiesService.checkTagExistedOtherCustomPolicy(
            propertiesFilter,
            item
          );
      return {
        ...item,
        value: item.id,
        label: this.isRMEnvironment ? item.streetline : item.name,
        disabled: !!matchingPolicy || existedOtherCustom,
        matchingPolicy,
        tooltip:
          item?.status === 'INACTIVE'
            ? 'Inactive property'
            : matchingPolicy
            ? this.policiesService.getTitleMatchingPolicyReply(
                matchingPolicy.policyName,
                this.isRMEnvironment,
                item?.sourceProperty?.type
              )
            : existedOtherCustom
            ? 'Properties within this tag are assigned to another custom policy.'
            : null,
        tagGroupName: item?.tagGroup?.name
      };
    });
  }

  onSupplierChange(event, index) {
    const selectedCard = event;
    const customPolicyArray = this.customPolicy as FormArray;
    const group = customPolicyArray.at(index) as FormGroup;
    group?.patchValue({ selectedContactCard: selectedCard });
    const {
      generatedReplies,
      selectedContactCard,
      listOfFiles: listOfFileForm
    } = group.value;
    this.invalidCustomReply =
      this.policiesFormService.invalidDefaultReplyCustomField(
        generatedReplies,
        !!listOfFileForm?.length,
        !!selectedContactCard?.length,
        index
      );
  }

  setSupplierPopupVariable(visible: boolean, form: FormGroup = null) {
    this.isAddSupplier = !visible;
    this.isOpenSupplierPopup = visible;
    this.supplierPopupForm = form;
    this._changeDetectorRef.detectChanges();
  }

  validatorAllGeneratedReplies() {
    this.invalidDefaultReply =
      this.policiesFormService.invalidDefaultReplyField(
        this.defaultReply.value,
        !!this.listOfFiles?.length,
        !!this.selectedContactCard?.length
      );

    this.customPolicy.controls.forEach((item, index) => {
      const { listOfFiles, generatedReplies, selectedContactCard } =
        item?.value || {};
      this.invalidCustomReply =
        this.policiesFormService.invalidDefaultReplyCustomField(
          generatedReplies,
          !!listOfFiles?.length,
          !!selectedContactCard?.length,
          index
        );
    });
  }

  handleAddInactivePropertyToList(policyCustoms) {
    if (!this.isRMEnvironment) return;
    policyCustoms?.forEach((item, index) => {
      const hasInactive = item?.properties
        .filter((property) => property?.status === 'INACTIVE')
        .map((inactive) => ({ ...inactive, index }));
      if (!!hasInactive?.length) {
        this.dataSources = [...this.dataSources, ...hasInactive].sort((a, b) =>
          a.streetline > b.streetline ? 1 : -1
        );
        this.indexHasInactiveProperty.push(index);
      }
    });

    this.formatListDataSources(this.dataSources);
  }

  handleInvalidCustomFile(invalidFile: IInvalidFile) {
    this.invalidCustomFile =
      invalidFile.overFileSize || invalidFile.unSupportFile;
  }

  onCloseSuggestedChatGpt() {
    this.isCloseAiGenerating = true;
    this.isLoading = false;
    this.isAiGenerating = false;
    this.isBlurPolicyName = true;
    const policy = {
      name: '',
      defaultReply: '',
      policyQuestions: [],
      policyCustoms: [],
      additionalData: { contactCard: [], uploadFile: [] },
      isSelected: true
    };
    this.handlePreFillPolicyForm(policy, this.manualHighlighText);
    this.focusTimeOut = setTimeout(() => {
      const policyNameElement = document.querySelector(
        '.policy-value'
      ) as HTMLDivElement;
      policyNameElement.click();
    }, 100);
    this._changeDetectorRef.markForCheck();
  }

  triggerUploadContactCard() {
    this.selectedCard.setValue(this.selectedContactCard);
    this.setSupplierPopupVariable(true, this.policyForm);
  }

  handleFocusReply() {
    this.defaultReply.setValue(clearStylesReply(this.defaultReply.value));
  }

  handleLoadingFileCustomPolicy(event) {
    this.isLoadingFile = event;
  }

  onFocus() {
    this.isBlurPolicyName = false;
  }

  onBlur() {
    this.isBlurPolicyName = !!this.policyName.value;
  }

  clickPolicyName() {
    if (this.isLoadingOk) return;
    this.isBlurPolicyName = false;
    const headerElements = document.getElementsByClassName(
      'trudi-ui-textarea'
    ) as HTMLCollectionOf<HTMLElement>;
    clearTimeout(this.policyNameTimeout);
    this.policyNameTimeout = setTimeout(() => {
      headerElements[0]?.focus();
      this._changeDetectorRef.markForCheck();
    }, 100);
  }

  getUpdateDate(updatedAt: string) {
    if (!updatedAt || !this.pipeDateFormat) return;
    const dateFormat = `${this.pipeDateFormat} • ${TIME_FORMAT}`;
    this.updatedAt = dayjs(
      convertUTCToLocalDateTime(new Date(updatedAt), this.agencyTimezone)
    ).format(dateFormat);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.scrollTimeOut);
    clearTimeout(this.triggerBtnTimeOut);
    clearTimeout(this.policyNameTimeout);
    clearTimeout(this.focusTimeOut);
  }
}
