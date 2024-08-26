import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {
  generateSendToData,
  generateStepTypeData
} from '@/app/dashboard/modules/task-editor/constants/communication.constant';
import {
  ESelectStepType,
  EStepAction,
  ETypeSend,
  PopUpEnum
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';
import { CalendarEventComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/calendar-event/calendar-event.component';
import { SendAttachmentComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/send-attachment/send-attachment.component';
import { ScheduleReminderComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/schedule-remider/schedule-reminder.component';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import {
  Subject,
  distinctUntilChanged,
  filter,
  from,
  lastValueFrom,
  skip,
  takeUntil
} from 'rxjs';
import { SendContactCardComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/send-contact-card/send-contact-card.component';
import { ConversationFileComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/conversation-file/conversation-file.component';
import { TrudiMultiSelectComponent } from '@trudi-ui';
import { TrudiSingleSelectComponent } from '@trudi-ui';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { TinyEditorContainerComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/tiny-editor-container/tiny-editor-container.component';
import { BoundAmountDueComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/bound-amount-due/bound-amount-due.component';
import { EntryReportDeadlineComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/entry-report-deadline/entry-report-deadline.component';
import { ApplicationShortlistComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/application-shortlist/application-shortlist.component';
import { BondReturnSummaryComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/bond-return-summary/bond-return-summary.component';
import { LettingRecommendationComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/letting-recommendation/letting-recommendation.component';
import { CapturePetBondComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/capture-pet-bond/capture-pet-bond.component';
import { CaptureConditionsForRequestApprovalComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/capture-conditions-for-request-approval/capture-conditions-for-request-approval.component';
import { CaptureLeaseTermsComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/capture-lease-terms/capture-lease-terms.component';
import { CaptureBreakLeaseFeeComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/capture-break-lease-fee/capture-break-lease-fee.component';
import { CaptureInspectionActionComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/capture-inspection-action/capture-inspection-action.component';
import { CaptureAmountOwingToVacateComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/capture-amount-owing-to-vacate/capture-amount-owing-to-vacate.component';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { NoticeToLeaveComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/notice-to-leave/notice-to-leave.component';
import { EActionShowMessageTooltip } from '@shared/enum/share.enum';
import { CompanyService } from '@services/company.service';
import { ITaskTemplate } from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { IFile } from '@shared/types/file.interface';
import {
  EMAIL_PATTERN,
  FILE_VALID_TYPE,
  MAX_FILE_SIZE
} from '@services/constants';
import { EUserPropertyType } from '@shared/enum';
import { validateFileExtension } from '@shared/feature/function.feature';
import { FileUploadService } from '@services/fileUpload.service';
import { FilesService } from '@services/files.service';
import { PropertiesService } from '@services/properties.service';
import uuid4 from 'uuid4';
import { TaskTemplateHelper } from '@/app/dashboard/modules/task-editor/modules/task-template-details/helper/task-template.helper';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import { SharedService } from '@services/shared.service';
import { IAiInteractiveBubbleConfigs } from '@/app/shared';
import { AiInteractiveBuilderService } from '@/app/shared/components/tiny-editor/services/ai-interactive-builder.service';
import { cloneDeep, isEmpty, isEqual, values } from 'lodash-es';

interface ISendToItem {
  id: string;
  subId?: string;
  label: string;
  isInvalid: boolean;
  type?: string;
  subLabel?: string;
}

@Component({
  selector: 'communication-step-form',
  templateUrl: './communication-step-form.component.html',
  styleUrls: ['./communication-step-form.component.scss'],
  providers: [AiInteractiveBuilderService]
})
export class CommunicationStepFormComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('customForm', { read: ViewContainerRef })
  customForm: ViewContainerRef;
  @ViewChild('sendToSelect') sendToSelect: TrudiMultiSelectComponent;
  @ViewChild('stepTypeSelect') stepTypeSelect: TrudiSingleSelectComponent;
  @ViewChild('tinyEditorContainer')
  tinyEditorContainer: TinyEditorContainerComponent;
  @ViewChild('modalContent') modalElement?: ElementRef;
  @Input() disabledForm: boolean = false;
  @Input() disableMessage: boolean = false;
  @Input() isShowUpgradeMessage: boolean = false;
  @Input() isEditingStep: boolean = false;
  @Output() setIsDisabledNext = new EventEmitter<boolean>();
  @Output() aiSettingValue = new EventEmitter<boolean>();
  @Output() onDropFile = new EventEmitter<IFile[] | File[]>();

  isConsoleUser: boolean;
  toPlaceholder: string;
  ccBccPlaceholder: string;
  private destroy$ = new Subject<void>();
  private customFormInstance;
  public items = [];
  public multiItems: ISendToItem[] = [];
  public defaultList: ISendToItem[];
  public readonly EStepType = EStepAction;
  public readonly ETypeSend = ETypeSend;
  public listCodeOptions = [
    {
      text: 'Task name',
      param: 'task_name'
    },
    {
      text: 'Task title',
      param: 'task_title'
    },
    {
      text: 'Short property address',
      param: 'short_property_address'
    }
  ];
  public typeSendOptions = [
    {
      text: 'Single email',
      value: ETypeSend.SINGLE_EMAIL,
      icon: 'singleMailOutline'
    },
    {
      text: 'Bulk email',
      value: ETypeSend.BULK_EMAIL,
      icon: 'bulkMailOutline'
    }
  ];
  public listComponentStep: string[] = [];
  public isChangeState: boolean = false;
  public isMsgCopyDisabled = false;
  public calendarEventTypes: string[] = [];
  public isShowSumaryRequestParams: boolean = false;
  public fileAttach: IFile[] = [];
  public taskTemplateData: ITaskTemplate;
  readonly EActionShowMessageTooltip = EActionShowMessageTooltip;
  public EUserPropertyType = EUserPropertyType;
  public isFocused: boolean = false;
  public isUnSupportFile: boolean = false;
  public overFileSize: boolean = false;
  private FILE_VALID_TYPE = FILE_VALID_TYPE;
  public focusIndex: number = 0;
  public aiInteractiveBubbleConfigs: IAiInteractiveBubbleConfigs;

  constructor(
    private cdr: ChangeDetectorRef,
    private communicationFormService: CommunicationStepFormService,
    private taskEditorService: TaskEditorService,
    private stepManagementService: StepManagementService,
    private taskTemplateService: TaskTemplateService,
    private companyService: CompanyService,
    private fileUpload: FileUploadService,
    private filesService: FilesService,
    private propertyService: PropertiesService,
    private templateTreeService: TemplateTreeService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsoleUser = this.sharedService.isConsoleUsers();
    this.toPlaceholder = 'Select contact type or add external email';
    this.ccBccPlaceholder = this.isConsoleUser
      ? 'Add external email'
      : 'Select supplier, other contact or add external email';
    this.aiInteractiveBubbleConfigs = {
      enableAiInteractiveReply: true,
      enableAiDetectsPolicy: !this.taskEditorService.isConsoleSettings
    };

    if (this.taskEditorService.isConsoleSettings) {
      this.taskTemplateService.taskTemplate$
        .pipe(takeUntil(this.destroy$))
        .subscribe((template) => {
          this.multiItems = generateSendToData(
            template.crmSystemKey,
            true,
            false
          );
          this.subscribeTaskTemplate(template.crmSystemKey);
        });
    } else {
      this.companyService.currentCompanyCRMSystemName
        .pipe(takeUntil(this.destroy$))
        .subscribe((crm) => {
          this.multiItems = generateSendToData(crm, true, false);
          this.subscribeTaskTemplate(crm);
        });
    }

    this.communicationFormService.buildForm();

    this.sendToControl.value.map((item) => {
      if (EMAIL_PATTERN.test(item)) {
        this.multiItems.push({
          id: item,
          label: item,
          type: EUserPropertyType.UNIDENTIFIED,
          isInvalid: false
        });
      }
    });

    this.defaultList = [...this.multiItems];

    this.stepTypeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type: EStepAction) => {
        this.stepManagementService.setSelectedHelpDocumentStepType(type);
        this.handleChangeStepType(type);
      });

    this.getPreviousSteps();
    this.isMsgCopyDisabled = this.disableMessage;
    this.getFileAttach();
  }

  async uploadFileToS3(files) {
    this.setIsDisabledNext.emit(true);
    let listFileUploaded = [];
    for (let i = 0; i < files.length; i++) {
      const fileUpload = files[i]['0'];
      const validFileType = validateFileExtension(
        fileUpload,
        this.FILE_VALID_TYPE
      );
      const isOverFileSize =
        (fileUpload.size || fileUpload.fileSize) / 1024 ** 2 > MAX_FILE_SIZE;
      fileUpload.canUpload = !isOverFileSize && validFileType;
      if (
        !fileUpload?.mediaLink &&
        fileUpload?.canUpload &&
        !fileUpload.uploaded
      ) {
        const infoLink$ = from(
          this.fileUpload.uploadFile2(
            fileUpload,
            this.propertyService.currentPropertyId.value
          )
        ).pipe(takeUntil(this.destroy$));
        const infoLink = await lastValueFrom(infoLink$);
        fileUpload.uploaded = true;
        fileUpload.canUpload = true;
        fileUpload.mediaLink = infoLink?.Location;
        listFileUploaded.push({
          icon: files[i].icon,
          '0': {
            localId: fileUpload.localId,
            title: fileUpload?.name,
            fileName: fileUpload?.name,
            fileSize: fileUpload?.fileSize || fileUpload?.size,
            mediaLink: infoLink?.Location,
            fileType: fileUpload?.type || fileUpload?.fileType,
            type: fileUpload?.type,
            icon: this.filesService.getFileIcon(fileUpload?.name),
            canUpload: true,
            uploaded: true,
            isSupportedVideo: fileUpload?.isSupportedVideo,
            mediaType:
              fileUpload?.mediaType ||
              this.filesService.getFileTypeSlash(fileUpload?.type),
            name: fileUpload?.name
          }
        });
        this.communicationFormService.fileAttach.next(listFileUploaded);
      } else {
        if (fileUpload?.canUpload) {
          const file = this.communicationFormService.fileAttach.value.find(
            (item) => item['0'].localId === fileUpload.localId
          );
          if (file) {
            listFileUploaded.push(file);
          }
        }
      }
    }
    this.fileAttach = [...this.fileAttach];
    this.communicationFormService.fileAttach.next(listFileUploaded);
    const isHasFileUploading = this.fileAttach.some(
      (file) => !file['0'].uploaded && file['0'].canUpload
    );
    if (!this.isUnSupportFile && !this.overFileSize && !isHasFileUploading) {
      this.setIsDisabledNext.emit(false);
    }
  }

  async handleFileUpload(files) {
    this.setIsDisabledNext.emit(false);
    this.isUnSupportFile = false;
    this.overFileSize = false;
    for (let i = 0; i < files.length; i++) {
      const file = files[i]?.[0];
      const validFileType = validateFileExtension(file, this.FILE_VALID_TYPE);
      const isOverFileSize =
        (file.size || file.fileSize) / 1024 ** 2 > MAX_FILE_SIZE;
      file.canUpload = !isOverFileSize && validFileType;
      this.isUnSupportFile = !validFileType;
      this.overFileSize = isOverFileSize;
      file?.localId || (file.localId = uuid4());
      if (file?.mediaLink) {
        file.uploaded = true;
      } else {
        file.uploaded = file?.uploaded || false;
      }
    }
    this.fileAttach = files;
    await this.uploadFileToS3(files);
  }
  addEmail = (label) => {
    const uuid = uuid4();
    const emailPattern = EMAIL_PATTERN;
    label = label.replaceAll(/\s/g, '').trim();
    const isInvalid = !emailPattern.test(label);
    return {
      id: label,
      subId: uuid,
      label: label,
      isInvalid,
      type: EUserPropertyType.EXTERNAL,
      subLabel: null
    } as ISendToItem;
  };

  removeFile(indexAttachment: number) {
    this.fileAttach = this.fileAttach.filter(
      (_, index) => index !== indexAttachment
    );
    this.dropFile(this.fileAttach);
  }

  subscribeTaskTemplate(crm?: ECRMSystem) {
    this.taskTemplateService.taskTemplate$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.items = generateStepTypeData(crm).map((item) => {
            item['disabled'] = item['disabled'];
            return item;
          });
        }
      });
  }

  handleInsertComponent(component): void {
    this.destroyCustomComponent();
    this.customFormInstance = this.customForm.createComponent(component);
  }

  handleChangeStepType(stepType: EStepAction): void {
    if (this.isChangeState) {
      this.communicationFormService.removeControl('messageCopy');
      this.communicationFormService.resetCustomForm();
      this.communicationFormService.addCustomControlByType(stepType);
      this.buildUiForCustomForm(stepType);
      this.communicationFormService.addMessageCopyControl();
    }
  }

  getFileAttach() {
    let filePrefill = [];
    if (this.filesControl.value) {
      filePrefill = this.filesControl.value.map((item) => {
        return {
          icon: item.icon,
          '0': {
            ...item['0'],
            canUpload: true,
            uploaded: true
          }
        };
      });
    }
    this.fileAttach = filePrefill || [];
    this.communicationFormService.fileAttach.next(filePrefill || []);
  }

  buildUiForCustomForm(stepType: EStepAction): void {
    switch (stepType) {
      case EStepAction.SEND_CALENDAR_EVENT: {
        this.handleInsertComponent(CalendarEventComponent);
        break;
      }
      case EStepAction.SEND_ATTACHMENT: {
        this.handleInsertComponent(SendAttachmentComponent);
        break;
      }
      case EStepAction.SCHEDULE_REMINDER: {
        this.handleInsertComponent(ScheduleReminderComponent);
        break;
      }
      case EStepAction.SEND_CONTACT_CARD: {
        this.handleInsertComponent(SendContactCardComponent);
        break;
      }
      case EStepAction.SEND_CONVERSATION_FILES: {
        this.handleInsertComponent(ConversationFileComponent);
        break;
      }
      case EStepAction.BOND_AMOUNT_DUE: {
        this.handleInsertComponent(BoundAmountDueComponent);
        break;
      }
      case EStepAction.ENTRY_REPORT_DEADLINE: {
        this.handleInsertComponent(EntryReportDeadlineComponent);
        break;
      }
      case EStepAction.BOND_RETURN_SUMMARY: {
        this.handleInsertComponent(BondReturnSummaryComponent);
        break;
      }
      case EStepAction.LETTING_RECOMMENDATIONS: {
        this.handleInsertComponent(LettingRecommendationComponent);
        break;
      }
      case EStepAction.CAPTURE_PET_BOND: {
        this.handleInsertComponent(CapturePetBondComponent);
        break;
      }
      case EStepAction.CAPTURE_CONDITIONS_FOR_REQUEST_APPROVAL: {
        this.handleInsertComponent(
          CaptureConditionsForRequestApprovalComponent
        );
        break;
      }
      case EStepAction.CAPTURE_LEASE_TERMS: {
        this.handleInsertComponent(CaptureLeaseTermsComponent);
        break;
      }
      case EStepAction.CAPTURE_BREAK_LEASE_FEES: {
        this.handleInsertComponent(CaptureBreakLeaseFeeComponent);
        break;
      }
      case EStepAction.CAPTURE_INSPECTION_ACTIONS: {
        this.handleInsertComponent(CaptureInspectionActionComponent);
        break;
      }
      case EStepAction.APPLICATIONS_SHORTLIST: {
        this.handleInsertComponent(ApplicationShortlistComponent);
        break;
      }
      case EStepAction.CAPTURE_AMOUNT_OWING_TO_VACATE: {
        this.handleInsertComponent(CaptureAmountOwingToVacateComponent);
        break;
      }
      case EStepAction.NOTICE_TO_LEAVE: {
        this.handleInsertComponent(NoticeToLeaveComponent);
        break;
      }
      default: {
        this.destroyCustomComponent();
        break;
      }
    }
  }

  ngAfterViewInit() {
    if (this.communicationFormService.getSelectedStep()) {
      this.buildUiForCustomForm(this.stepTypeControl.value);
    }
    if (this.disabledForm) {
      this.communicationForm.disable();
    }
    this.isChangeState = true;

    this.communicationForm?.valueChanges
      ?.pipe(
        takeUntil(this.destroy$),
        // using skip(1) for case edit to skip excess values from tiny editor
        skip(this.isEditingStep ? 1 : 0),
        distinctUntilChanged(isEqual)
      )
      .subscribe((value) => {
        this.stepManagementService.setIsEditingForm(
          !values(value).every(isEmpty)
        );
      });
  }

  destroyCustomComponent() {
    if (!!this.customForm) {
      this.customForm.clear();
      this.customFormInstance = null;
      this.cdr.detectChanges();
    }
  }

  resetFormValues() {
    this.communicationForm.markAsPristine();
    this.communicationForm.markAsUntouched();
    this.communicationForm.updateValueAndValidity();

    if (this.stepTypeSelect) {
      this.stepTypeSelect.clearAll();
      this.stepTypeSelect.valueSelected = EStepAction.SEND_BASIC_EMAIL;
      this.stepTypeControl.setValue(EStepAction.SEND_BASIC_EMAIL);
    }

    this.communicationForm.reset();
  }

  handleSelectSendOption(option) {
    if (this.typeSendControl?.value !== option.value) {
      this.communicationFormService.isSubmittedCommunicationForm = false;
      this.typeSendControl.setValue(option.value);
      this.sendToControl.setValue([]);
      this.sendCcControl.setValue([]);
      this.sendBccControl.setValue([]);
      this.cdr.detectChanges();
    }
  }

  get communicationForm() {
    return this.communicationFormService.getCommunicationForm;
  }

  get messageCopyControl() {
    return this.communicationForm?.get('messageCopy');
  }

  get emailTitleControl() {
    return this.communicationForm?.get('emailTitle');
  }

  get stepTypeControl() {
    return this.communicationForm?.get('stepType');
  }

  get filesControl() {
    return this.communicationForm?.get('files');
  }

  get sendToControl() {
    return this.communicationForm?.get('sendTo');
  }

  get sendCcControl() {
    return this.communicationForm?.get('sendCc');
  }

  get sendBccControl() {
    return this.communicationForm?.get('sendBcc');
  }

  get typeSendControl() {
    return this.communicationForm?.get('typeSend');
  }

  get isSubmittedCommunicationForm() {
    return this.communicationFormService.isSubmittedCommunicationForm;
  }

  openHelpDocument() {
    if (!!this.stepTypeControl.value) {
      this.stepManagementService.setSelectedHelpDocumentStepType(
        this.stepTypeControl.value
      );
    }
    this.taskEditorService.setPopupTaskEditorState(PopUpEnum.PopupHelpDocument);
  }

  async dropFile(files) {
    this.onDropFile.emit(files);
    this.handleFileUpload(files);
  }

  getPreviousSteps() {
    let data;
    let targetedNode = this.stepManagementService.getTargetedNode();
    if (targetedNode)
      data = {
        listPreviousSteps: TaskTemplateHelper.getListPreviousStep(
          this.templateTreeService.getCurrentTemplateTree(),
          targetedNode
        )
      };
    data = targetedNode
      ? data
      : this.communicationFormService.getSelectedStep();
    if (!!data) {
      this.listComponentStep = data?.listPreviousSteps
        .filter(
          (item) =>
            item.stepType === ESelectStepType.PROPERTY_TREE_ACTION ||
            ESelectStepType.RENT_MANAGER_ACTION
        )
        .map((item) => item.componentType);
      this.calendarEventTypes = data?.listPreviousSteps
        .filter((item) => item.stepType === ESelectStepType.CALENDAR_EVENT)
        .map((item) => item.eventType);
    }
  }

  ngOnDestroy(): void {
    this.communicationFormService.setSelectedStep(null);
    this.setIsDisabledNext.emit(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  getFocusableElements(element: HTMLElement): HTMLElement[] {
    return Array.from(
      element.querySelectorAll('input, select, button, textarea')
    ) as HTMLElement[];
  }

  @HostListener('keydown.Tab', ['$event'])
  onTabKeyPress(event: Event): void {
    const modalContentElement = this.modalElement?.nativeElement;
    const focusableElements =
      this.getFocusableElements(modalContentElement) ?? [];

    if (this.focusIndex === focusableElements.length - 1) {
      this.focusIndex = 0;
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (focusableElements.length > 0) {
      if (
        focusableElements[this.focusIndex % focusableElements.length] instanceof
        HTMLTextAreaElement
      ) {
        focusableElements[this.focusIndex % focusableElements.length].focus();
        focusableElements[this.focusIndex % focusableElements.length].click();
      }

      focusableElements[this.focusIndex % focusableElements.length].focus();

      this.focusIndex++;
    }
  }
}
