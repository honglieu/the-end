import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import {
  Subject,
  distinctUntilChanged,
  takeUntil,
  from,
  lastValueFrom,
  startWith,
  pairwise
} from 'rxjs';
import { validateFileExtension } from '@shared/feature/function.feature';
import { FILE_VALID_TYPE, MAX_FILE_SIZE } from '@services/constants';
import { FilesService } from '@services/files.service';
import { EAvailableFileIcon, IFile } from '@shared/types/file.interface';
import { PropertiesService } from '@services/properties.service';
import uuid4 from 'uuid4';
import { FileUploadService } from '@services/fileUpload.service';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { CompanyService } from '@services/company.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { PoliciesFormService } from '@/app/dashboard/modules/agency-settings/components/policies/services/policies-form.service';
import { PoliciesService } from '@/app/dashboard/modules/agency-settings/components/policies/services/policies.service';
import { IInvalidFile } from '@/app/dashboard/modules/agency-settings/utils/interface';
import { clearStylesReply } from '@/app/dashboard/modules/agency-settings/components/policies/utils/helper-function';
import { IPolicyDetail } from '@/app/dashboard/modules/agency-settings/utils/enum';
import { EPolicyDetailOpenFrom } from '@/app/dashboard/modules/agency-settings/components/policies/utils/enum';
import { EPropertyStatus } from '@/app/shared/enum';

@Component({
  selector: 'add-custom-policy',
  templateUrl: './add-custom-policy.component.html',
  styleUrl: './add-custom-policy.component.scss'
})
export class AddCustomPolicyComponent implements OnInit, OnChanges, OnDestroy {
  @Input() index: number;
  @Input() customPolicyFormGroup: FormGroup;
  @Input() isGroupBy: boolean = false;
  @Input() dataSources: any[] = [];
  @Input() isAddSupplier: boolean = false;
  @Input() indexHasInactiveProperty: number[] = [];
  @Input() policyDefaultValue: IPolicyDetail;
  @Input() openFrom: EPolicyDetailOpenFrom = EPolicyDetailOpenFrom.POLICY_PAGE;
  @Output() remove = new EventEmitter<void>();
  @Output() addListOfFiles = new EventEmitter<IFile[]>();
  @Output() onFocusChange = new EventEmitter();
  @Output() supplierChange = new EventEmitter<ISelectedReceivers[]>();
  @Output() openSuppierPopup = new EventEmitter<FormGroup>();
  @Output() invalidCustomFile = new EventEmitter<IInvalidFile>();
  @Output() triggerLoadingFile = new EventEmitter<boolean>(false);

  public selectedFiles: File[] = [];
  private listFileUpload = [];
  public listOfFiles: IFile[] = [];
  public invalidFile: IInvalidFile = {
    unSupportFile: false,
    overFileSize: false
  };
  private destroy$: Subject<void> = new Subject<void>();
  public isScrolledDrawerContent: boolean = false;
  public selectedContactCard: ISelectedReceivers[] = [];
  public isRmEnvironment: boolean = false;
  public titleSelectPropertyOrTag: string = '';
  readonly EPropertyStatus = EPropertyStatus;
  public isLoading: boolean = false;
  public loadingTimeOut: NodeJS.Timeout;

  get policyForm() {
    return this.policiesFormService?.policyForm;
  }

  get defaultReply() {
    return this.policyForm.get('defaultReply');
  }
  get customPolicy() {
    return this.policyForm.get('customPolicy') as FormArray;
  }

  get policyName() {
    return this.customPolicyFormGroup.get('policyName');
  }

  get property() {
    return this.customPolicyFormGroup.get('property');
  }

  get generatedReplies() {
    return this.customPolicyFormGroup.get('generatedReplies');
  }

  get customPolicyListOfFiles() {
    return this.customPolicyFormGroup.get('listOfFiles');
  }

  get selectedCustomCard() {
    return this.customPolicyFormGroup.get('selectedContactCard');
  }

  public inActiveUncheckIds = [];
  constructor(
    private policiesFormService: PoliciesFormService,
    private _changeDetectorRef: ChangeDetectorRef,
    private propertyService: PropertiesService,
    private fileUpload: FileUploadService,
    private filesService: FilesService,
    private policiesService: PoliciesService,
    private companyService: CompanyService,
    private agencyDashboardService: AgencyService
  ) {
    this.getCurrentCompany();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customPolicyFormGroup']?.currentValue) {
      this.listOfFiles = this.listOfFiles;
    }
    if (changes['isAddSupplier']?.currentValue) {
      this.isAddSupplier = changes['isAddSupplier']?.currentValue;
      this.selectedContactCard = this.selectedCustomCard?.value;
      this.isAddSupplier &&
        this.selectedCustomCard.setValue([...this.selectedCustomCard?.value]);
    }

    if (
      (changes['indexHasInactiveProperty']?.currentValue ||
        changes['dataSources']?.currentValue) &&
      !this.indexHasInactiveProperty.includes(this.index)
    ) {
      this.dataSources = this.dataSources?.filter(
        (item) => item?.status !== EPropertyStatus.inactive
      );
    }

    this.dataSources = this.dataSources
      .filter(
        (x) =>
          !(x?.status === EPropertyStatus.inactive && x?.index !== this.index)
      )
      .map((x) => {
        return {
          ...x,
          disabled:
            x?.status === EPropertyStatus.inactive
              ? this.inActiveUncheckIds.includes(x.id)
              : x.disabled
        };
      });

    if (!this.isRmEnvironment) {
      this.dataSources = this.checkDuplicateProperty(
        this.dataSources,
        this.customPolicy.value
      );
    }
  }

  getCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        if (!company) return;
        this.isRmEnvironment =
          this.agencyDashboardService.isRentManagerCRM(company);
        this.titleSelectPropertyOrTag = this.isRmEnvironment
          ? 'For the following properties:'
          : 'For the following property tags:';
      });
  }

  checkDuplicateProperty = (tags, customPolicies: Array<any>) => {
    const propertiesMap = new Map<string, Map<string, Set<string>>>();

    customPolicies.forEach((customPolicy) => {
      const tagIds = customPolicy.property || [];
      tagIds.forEach((tagId) => {
        const properties =
          tags.find((tag) => tag.id === tagId)?.properties || [];
        properties.forEach((property) => {
          const key = property.id;
          if (propertiesMap.has(key)) {
            const existing = propertiesMap.get(key);
            if (existing.has(customPolicy.customPolicyId)) {
              existing.get(customPolicy.customPolicyId).add(tagId);
            } else {
              existing.set(customPolicy.customPolicyId, new Set([tagId]));
            }
          } else {
            propertiesMap.set(
              key,
              new Map([[customPolicy.customPolicyId, new Set([tagId])]])
            );
          }
        });
      });
    });

    const resultSet = new Set<string>();
    propertiesMap.forEach((customPolicyMap) => {
      if (customPolicyMap.size === 1) return;
      Array.from(customPolicyMap.values())
        .flatMap((x) => Array.from(x.values()))
        .forEach((x) => resultSet.add(x));
    });

    const tagsResult = tags?.map((item) => ({
      ...item,
      duplicateProperty: resultSet.has(item.id)
    }));
    return tagsResult;
  };

  ngOnInit() {
    this.listOfFiles = this.customPolicyListOfFiles?.value;
    this.selectedContactCard = this.selectedCustomCard?.value;
    this.subscribeSelectedCard();
    this.property.valueChanges
      .pipe(startWith(this.property.value), pairwise())
      .subscribe(([prevValue, currentValue]) => {
        const currentChange = [
          ...prevValue.filter((x) => !currentValue.includes(x)),
          ...currentValue.filter((x) => !prevValue.includes(x))
        ];
        this.dataSources = this.dataSources.map((x) => {
          if (
            x.id === currentChange[0] &&
            x.status === EPropertyStatus.inactive
          ) {
            this.inActiveUncheckIds.push(x.id);
            return {
              ...x,
              disabled: true
            };
          }
          return x;
        });
        this._changeDetectorRef.markForCheck();
      });

    this.policyName.valueChanges.pipe(distinctUntilChanged()).subscribe(() => {
      this.customPolicy?.controls?.forEach((control: FormGroup, index) => {
        if (index !== this.index) {
          control.controls['policyName'].markAsPristine();
          control.controls['policyName'].markAsUntouched();
          control.controls['policyName'].updateValueAndValidity();
        }
      });
    });
  }

  async handleUploadFileLocal(event, index) {
    const [file] = event.target?.files || [];
    this.setInvalidFile(false, false);
    this.selectedFiles = [];
    if (!file) return;
    let files: File[] = [];
    const length = event.target?.files.length;
    for (let index = 0; index < length; index++) {
      const file = event.target.files[index];
      const processedFile = await this.filesService.handleProcessingFile(file);
      if (processedFile) {
        if (!processedFile?.localId) {
          processedFile.localId = uuid4();
        }
        processedFile.uploaded = false;
        processedFile.canUpload =
          validateFileExtension(processedFile, FILE_VALID_TYPE) &&
          processedFile.size / 1024 ** 2 <= MAX_FILE_SIZE;
        processedFile.mediaType = this.filesService.getFileTypeSlash(
          processedFile?.fileType?.name
        );
        files.push(processedFile);
      }
    }
    this.prepareFilesList(files);
    await this.handleOnSubmitUploadAttachments();
    event.target.value = null;
  }

  async handleOnSubmitUploadAttachments() {
    let additionalFiles = this.listFileUpload.flatMap((item) => item.listFile);
    additionalFiles = additionalFiles.map((item) => {
      return {
        '0': item,
        icon:
          item.icon === EAvailableFileIcon.Audio
            ? EAvailableFileIcon.voiceMailAudio
            : item.icon
      };
    });
    this.listOfFiles = [...this.listOfFiles, ...additionalFiles];
    this.validateFileSize();
    await this.handleUploadFiles();
    this.addListOfFiles.emit(this.listOfFiles);
    this.listFileUpload = [];
  }

  async handleUploadFiles() {
    this.triggerLoadingFile.emit(true);
    for (const file of this.listOfFiles) {
      const fileCheck = file?.[0] ? file?.[0] : file;
      if (!fileCheck?.localId) {
        fileCheck.localId = uuid4();
      }
      if (fileCheck?.mediaLink) {
        fileCheck.uploaded = true;
      } else {
        fileCheck.uploaded = fileCheck.uploaded || false;
      }
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

    const listFileUpload = this.listOfFiles.filter(
      (file) => !file?.[0]?.uploaded && file[0]?.canUpload
    );
    this.listOfFiles = this.listOfFiles.map((file) => {
      listFileUpload.some((item) => item[0]?.localId === file[0]?.localId) &&
        (file[0].uploaded = true);
      return file;
    });
    this.triggerLoadingFile.emit(false);
  }

  prepareFilesList(file: File[]) {
    this.selectedFiles = file;
    this.filesService.mapInfoListFile(this.selectedFiles);
    this.listFileUpload = [];
    for (let index = 0; index < this.selectedFiles.length; index++) {
      this.listFileUpload = [
        ...this.listFileUpload,
        {
          title: ``,
          listFile: [this.selectedFiles[index]]
        }
      ];
    }
  }

  setInvalidFile(unSupportFile: boolean, overFileSize: boolean) {
    this.invalidFile = {
      unSupportFile,
      overFileSize
    };
    this.invalidCustomFile.emit(this.invalidFile);
  }

  validateFileSize() {
    if (!this.listOfFiles?.length) {
      this.setInvalidFile(false, false);
      return;
    }
    const unSupportFile = this.listOfFiles.some(
      (item) => !validateFileExtension(item[0] || item, FILE_VALID_TYPE)
    );
    const overFileSize = this.listOfFiles.some(
      (item) => (item[0]?.size || item.size) / 1024 ** 2 > MAX_FILE_SIZE
    );
    this.setInvalidFile(unSupportFile, overFileSize);
  }

  handleBlurPolicyName(event) {
    this.policyName.markAsDirty();
    this.policyName.markAsTouched();
    this.policyName.updateValueAndValidity();
  }

  handleDeleteCustomPolicy() {
    this.remove.emit();
  }

  handleRemoveFile(index) {
    this.listOfFiles = this.listOfFiles.filter((_, i) => i !== index);
    this.addListOfFiles.emit(this.listOfFiles);
    this.validateFileSize();
  }

  handleAddFileComputer(index: number) {
    const button = document.querySelector(
      `#upload-custom-policy-${index}`
    ) as HTMLDivElement;
    button?.click();
  }

  handleClickAttachIcon(event) {
    this.isScrolledDrawerContent = false;
    this._changeDetectorRef.markForCheck();
  }

  onFocusChangeSelect(event) {
    this.isLoading = true;
    clearTimeout(this.loadingTimeOut);
    this.loadingTimeOut = setTimeout(() => {
      this.onFocusChange.emit(event);
      this.isLoading = false;
    }, 0);
  }

  onClearContactById(cardId) {
    if (this.selectedContactCard.length > 0) {
      const selectedContactCard = this.selectedContactCard.filter(
        (card) => card.id !== cardId
      );
      this.policiesService.setSelectedContactCard(selectedContactCard);
      this.selectedContactCard = selectedContactCard;
      this.supplierChange.emit(this.selectedContactCard);
    }
  }

  subscribeSelectedCard() {
    this.selectedCustomCard.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (!this.isAddSupplier) return;
        this.selectedContactCard = value;
        this.supplierChange.emit(this.selectedContactCard);
        this._changeDetectorRef.markForCheck();
      });
  }

  handleFocusReply() {
    this.generatedReplies.setValue(
      clearStylesReply(this.generatedReplies.value)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.loadingTimeOut);
  }
}
