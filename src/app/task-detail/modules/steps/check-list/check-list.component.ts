import { FormBuilder, FormGroup } from '@angular/forms';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  FILE_VALID_TYPE,
  MAX_FILE_SIZE
} from '@services/constants';
import {
  CheckListService,
  ICheckListNoteResponse
} from './service/check-list.service';
import { TaskService } from '@services/task.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { Subject, map, takeUntil } from 'rxjs';
import { TrudiResponse } from '@shared/types/trudi.interface';
import { EActionType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  GetListUserPayload,
  GetListUserResponse,
  TrudiSendMsgUserService
} from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { isCheckedReceiversInList } from '@/app/trudi-send-msg/utils/helper-functions';
import { TrudiAddContactCardService } from '@shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';
import { ENotePopup } from '@/app/task-detail/modules/internal-note/utils/internal-note.enum';
import { UploadFromCRMService } from '@shared/components/upload-from-crm/upload-from-crm.service';
import { PropertiesService } from '@services/properties.service';
import { IFile } from '@shared/types/file.interface';
import { TinyEditorFileControlService } from '@services/tiny-editor-file-control.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { SendMessageService } from '@services/send-message.service';
import { EContactCardOpenFrom } from '@shared/enum';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { validateFileExtension } from '@shared/feature/function.feature';
import uuidv4 from 'uuid4';

@Component({
  selector: 'check-list',
  templateUrl: './check-list.component.html',
  styleUrls: ['./check-list.component.scss'],
  providers: [TinyEditorFileControlService]
})
export class CheckListComponent implements OnInit, OnDestroy, OnChanges {
  @Input() model: TrudiStep;
  public isShowChecklist = false;
  public acceptFileType = ACCEPT_ONLY_SUPPORTED_FILE;
  public MAXIMUM_ATTACHED_FILES = 5;
  public checkListForm: FormGroup;
  public taskId: string;
  public listFile = [];
  private noteId: string = null;
  private note: string = '';
  private unsubscribe = new Subject<void>();

  public isUnsupported: boolean = false;
  public buttonKey = EButtonStepKey.CHECK_LIST;
  public selectedContactCard: ISelectedReceivers[];
  public popupState: ENotePopup | null;
  readonly ENotePopup = ENotePopup;
  readonly ModalPopupPosition = ModalPopupPosition;
  public addContactCardConfig = {
    'footer.buttons.showBackBtn': false
  };

  public listOfFiles: IFile[] = [];
  public listOfFileLocal: IFile[] = [];
  public listFileUpload: IFile[] = [];
  public currentProperty;
  public readonly EContactCardOpenFrom = EContactCardOpenFrom;
  public stepContent: SafeHtml;
  public scrolled: boolean = false;
  public prefillNote: string;
  public isOverFileSize: boolean = false;
  public isUnSupportFile: boolean = false;
  public disableOkBtn: boolean = false;
  private FILE_VALID_TYPE = FILE_VALID_TYPE;
  public modalId = StepKey.communicationStep.checkList;
  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }
  get sendMsgPopupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  constructor(
    private formBuilder: FormBuilder,
    private taskService: TaskService,
    private checkListService: CheckListService,
    private stepService: StepService,
    private preventButtonService: PreventButtonService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgUserService: TrudiSendMsgUserService,
    private trudiAddContactCardService: TrudiAddContactCardService,
    private uploadFromCRMService: UploadFromCRMService,
    private propertyService: PropertiesService,
    private tinyEditorFileControlService: TinyEditorFileControlService,
    private trudiSendMsgService: TrudiSendMsgService,
    private sendMessageService: SendMessageService,
    private sanitizer: DomSanitizer
  ) {
    this.checkListForm = this.formBuilder.group({
      note: [null],
      selectedContactCard: [[]]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['model']?.currentValue) {
      this.stepContent = this.sanitizer.bypassSecurityTrustHtml(
        this.model?.fields?.stepContent
      );
    }
  }

  ngOnInit() {
    const formDefaultValue = {
      selectedSender: null,
      msgTitle: '',
      selectedReceivers: [],
      listOfFiles: [],
      attachMediaFiles: [],
      selectedContactCard: []
    };
    this.trudiSendMsgFormService.buildForm(formDefaultValue);
    this.taskService.currentTaskId$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((id) => {
        this.taskId = id;
      });

    this.propertyService.newCurrentProperty
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.currentProperty = res;
      });

    this.trudiAddContactCardService.selectedContactCard$
      .pipe(
        takeUntil(this.unsubscribe),
        map((cards) =>
          cards?.filter(
            (card) => card?.openFrom === EContactCardOpenFrom.CHECK_LIST
          )
        )
      )
      .subscribe((cards) => {
        this.selectedContactCard = cards ?? [];
      });

    this.tinyEditorFileControlService.listOfFiles$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((files) => {
        this.listOfFiles = [...this.listOfFiles, ...files];
        if (this.listOfFiles?.length >= 5) {
          this.listOfFiles = this.listOfFiles.slice(0, 5);
        }
      });
  }

  handleCloseModal() {
    this.stepService
      .updateStep(
        this.taskId,
        this.model.id,
        this.model.action,
        this.model.status,
        this.model.stepType,
        '',
        true
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.isShowChecklist = false;
        this.preventButtonService.deleteProcess(
          this.buttonKey,
          EButtonType.STEP
        );
      });
  }

  async getPayload() {
    const files =
      this.listOfFiles?.length >= 5
        ? this.listOfFiles.slice(0, 5)
        : this.listOfFiles;
    return {
      text: this.note,
      files: this.listFileUpload,
      contactCards: this.selectedContactCard?.map((card) => ({
        ...card,
        address: card?.streetLine
      })),
      taskId: this.taskId,
      stepId: this.model.id,
      noteId: this.noteId
    };
  }

  async handleUploadFile() {
    try {
      this.disableOkBtn = true;
      const listFileCanUpload = this.listOfFiles.filter(
        (file) => file.canUpload
      );
      const infoFileAfterUpload = await this.sendMessageService.uploadFileS3(
        listFileCanUpload
      );
      this.listFileUpload = infoFileAfterUpload;
      const listFileUpdated = this.listOfFiles.map((file) => {
        const fileAfterUpload = infoFileAfterUpload.find(
          (f) => f.localId === (file.localId || file[0]?.localId)
        );
        if (fileAfterUpload) {
          file.canUpload = true;
          file.uploaded = true;
          file?.[0] && (file[0].mediaLink = fileAfterUpload?.mediaLink);
          return file;
        }
        return file;
      });
      this.listOfFiles = listFileUpdated;
      const isUploading = this.listOfFiles.some(
        (file) => !file.uploaded && file.canUpload
      );
      this.disableOkBtn = isUploading;
    } catch (error) {}
  }

  async handleSave() {
    try {
      this.disableOkBtn = true;
      const payload = await this.getPayload();
      this.checkListService
        .updateCheckListNote(payload)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((data) => {
          this.stepService.updateTrudiResponse(
            data as TrudiResponse,
            EActionType.UPDATE_TRUDI_BUTTON
          );
          this.isShowChecklist = false;
          this.preventButtonService.deleteProcess(
            this.buttonKey,
            EButtonType.STEP
          );
          this.trudiAddContactCardService.setSelectedContactCard([]);
          this.tinyEditorFileControlService.setListOfFiles([]);
        });
    } catch (error) {
    } finally {
      this.disableOkBtn = false;
    }
  }

  enableProcess() {
    let payload = {
      stepId: this.model.id,
      taskId: this.taskId
    };
    this.checkListService
      .getStepCheckListNote(payload)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(async (value: ICheckListNoteResponse) => {
        const { noteId, files, cards, text } = value || {};
        this.listOfFiles = [];
        this.noteId = noteId;
        this.prefillNote = text;
        const infoFileAfterUpload = await this.sendMessageService.uploadFileS3(
          files
        );
        this.tinyEditorFileControlService.setListOfFiles(files as IFile[]);
        this.listFileUpload = infoFileAfterUpload;
        this.selectedContactCard = cards;
        this.trudiAddContactCardService.setSelectedContactCard(
          this.selectedContactCard
        );
        this.isShowChecklist = true;
      });
  }

  setPopupState(state: ENotePopup | null) {
    this.popupState = state;
  }

  onTriggerAddContactCard() {
    this.setPopupState(null);
  }

  onTriggerAddFilesFromCrm(files) {
    this.listOfFiles = [...this.listOfFiles, ...files];
    this.setPopupState(null);
  }

  handleAddFileREIForm() {
    this.setPopupState(ENotePopup.ADD_REI_FORM);
    this.trudiSendMsgService.setPopupState({
      addReiFormOutside: true,
      selectDocument: true,
      handleCallback: (files) => {
        this.tinyEditorFileControlService.setListOfFiles(files);
      }
    });
  }

  handleAddContactCards() {
    const selected = this.selectedContactCard;
    if (!this.selectedContactCard?.length) {
      this.setPopupState(ENotePopup.ADD_CONTACT_CARD);
      return;
    }
    this.setPopupState(ENotePopup.ADD_CONTACT_CARD);

    const payload = {
      limit: this.selectedContactCard.length,
      page: 1,
      search: '',
      email_null: true,
      userDetails: this.selectedContactCard.map((user) => ({
        id: user.id,
        propertyId: user.propertyId
      }))
    } as GetListUserPayload;

    this.trudiSendMsgUserService
      .getListUserApi(payload)
      .subscribe((rs: GetListUserResponse) => {
        const cards: ISelectedReceivers[] = rs
          ? rs.users.filter((receiver) =>
              selected.some((contactCard) =>
                isCheckedReceiversInList(receiver, contactCard, 'id')
              )
            )
          : [];

        if (cards?.length) {
          this.trudiSendMsgFormService.sendMsgForm
            .get('selectedContactCard')
            ?.setValue(cards);
          this.trudiAddContactCardService.setSelectedContactCard(cards);
        }
      });
  }

  handleCloseAddContactCard() {
    this.setPopupState(null);
  }

  handleAddFileCrm() {
    this.uploadFromCRMService.setSelectedProperty(this.currentProperty);
    this.setPopupState(ENotePopup.ADD_FILE_CRM);
  }

  handleRemoveFile(files) {
    this.isOverFileSize = false;
    this.isUnSupportFile = false;
    this.disableOkBtn = false;
    let listFiles = [];
    for (let i = 0; i < files.length; i++) {
      const fileCheck = files[i][0];
      const validFileType = validateFileExtension(fileCheck, FILE_VALID_TYPE);
      const isOverFileSize =
        (fileCheck?.size || fileCheck?.fileSize) / 1024 ** 2 > MAX_FILE_SIZE;
      if (!validFileType && !files[i]?.mediaLink) {
        this.isUnSupportFile = true;
      } else if (isOverFileSize) {
        this.isOverFileSize = true;
      }
      if (!files[i]?.mediaLink && !fileCheck?.mediaLink) {
        files[i][0].localId = uuidv4();
        listFiles.push({
          ...files[i],
          uploaded: false,
          canUpload: !isOverFileSize && validFileType
        });
      } else {
        listFiles.push({
          ...files[i],
          localId: uuidv4(),
          uploaded: true,
          canUpload: true
        });
      }
    }
    this.listOfFiles = listFiles;
    this.handleUploadFile();
  }
  handleEventScroll() {
    this.scrolled = !this.scrolled;
  }

  handleChangeValue(value) {
    this.note = value;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.trudiAddContactCardService.setSelectedContactCard([]);
    this.tinyEditorFileControlService.setListOfFiles([]);
  }
}
