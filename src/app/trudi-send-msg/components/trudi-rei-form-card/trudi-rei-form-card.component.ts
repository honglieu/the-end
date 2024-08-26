import {
  Component,
  EventEmitter,
  Host,
  Inject,
  Input,
  OnInit,
  Optional,
  Output
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { FilesService } from '@services/files.service';
import { ReiFormService } from '@services/rei-form.service';
import { PetRequestState } from '@shared/enum/petRequest.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import {
  FormFileInfo,
  ReiFormData,
  ReiFormLink
} from '@shared/types/rei-form.interface';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { TrudiSendMsgComponent } from '@/app/trudi-send-msg/trudi-send-msg.component';
import { ETypeMessage } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { PreventButtonService } from '@trudi-ui';
import { EButtonType, EButtonWidget } from '@trudi-ui';
@Component({
  selector: 'trudi-rei-form-card',
  templateUrl: './trudi-rei-form-card.component.html',
  styleUrls: ['./trudi-rei-form-card.component.scss']
})
export class TrudiReiFormComponent implements OnInit {
  @Input() isResizableModal: boolean = false;
  @Input() closable: boolean = true;
  @Input() modalId: string;
  @Input() currentTaskId: string;
  @Output() onClose = new EventEmitter();
  public reiFormData: ReiFormData = {};
  public popupName = {
    selectDocument: 'selectDocument',
    reviewAttachment: 'reviewAttachment',
    addFile: 'addFile',
    sendMessage: 'sendMessage',
    attachDraftForm: 'attachDraftForm',
    selectPeople: 'selectPeople',
    addReiFormOutside: 'addReiFormOutside'
  };
  public titleAttachNote: string = 'Create a file';
  public state: PetRequestState;
  public titleSendMessage = 'Send message';
  public isCompleted: boolean = false;
  public isProcessing: boolean = false;
  public showPopupMessage: boolean = false;
  private unsubscribe = new Subject<void>();
  public reiFormInfo: ReiFormData;
  public isNextFromSkipAttachDocument: boolean = false;
  public isHideReviewAttachmentBottomWrapper = false;
  public showDocumentStatus: boolean = false;
  public showREIFormNameBox: boolean = true;
  public isUploadLocal: boolean = false;
  public reiFormLink: ReiFormLink;
  public EUserPropertyType = EUserPropertyType;
  public showPropertyAddress = false;

  constructor(
    @Host() @Optional() private trudiSendMsg: TrudiSendMsgComponent,
    private fileService: FilesService,
    private reiFormService: ReiFormService,
    private trudiSendMsgService: TrudiSendMsgService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSaveDraftService: TrudiSaveDraftService,
    @Inject(PreventButtonService)
    private preventButtonService: PreventButtonService
  ) {}

  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get listOfFilesControl(): AbstractControl {
    return this.sendMsgForm?.get('listOfFiles');
  }

  get popupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  ngOnInit(): void {
    this.showPropertyAddress =
      this.trudiSendMsg?.typeMessage === ETypeMessage.SCRATCH;
  }

  getSelectDocumentValue(event) {
    if (event) {
      this.isUploadLocal = false;
      this.reiFormLink = event;
      this.isHideReviewAttachmentBottomWrapper = false;
      this.handleChangeStatePopup(this.popupName.reviewAttachment);
    }
  }

  handleChangeStatePopup(state: string, val = true) {
    this.trudiSendMsgService.resetPopupStateReiForm();
    this.trudiSendMsgService.setPopupState({ [state]: val });
  }

  handleClose() {
    this.preventButtonService.deleteProcess(
      EButtonWidget.REI_FORM,
      EButtonType.WIDGET
    );
    this.handleChangeStatePopup(
      this.trudiSendMsgService.getPopupState().addReiFormOutside
        ? this.popupName.addReiFormOutside
        : this.popupName.sendMessage,
      true
    );
    this.trudiSendMsg?.onQuit?.emit();
    this.onClose.emit();
  }

  onBack(): void {
    if (this.isNextFromSkipAttachDocument) {
      this.handleChangeStatePopup(this.popupName.sendMessage);
    } else if (this.reiFormService.currentReiFormData$.getValue()?.formDetail) {
      this.reiFormData = {};
      this.isHideReviewAttachmentBottomWrapper = false;
      this.handleChangeStatePopup(this.popupName.reviewAttachment);
    } else {
      this.handleChangeStatePopup(this.popupName.addFile);
    }
  }

  getMapFiles(reiFormData) {
    return {
      formFileInfo: {
        ...reiFormData.formFileInfo,
        fileIcon: this.fileService.getFileIcon(
          reiFormData.formFileInfo.fileName
        ),
        shortName: reiFormData.formFileInfo.fileName.split('.')[0]
      } as FormFileInfo,
      formFiles: reiFormData.formDetail.formFiles?.map((file) => ({
        ...file,
        fileIcon: this.fileService.getFileIcon(file.filename),
        shortName: file.filename.split('.')[0]
      }))
    };
  }

  onConfirmFromReviewAttachment(reiFormData: ReiFormData) {
    this.reiFormData = reiFormData;
    const { fileSize, fileName, contentType } = reiFormData.formFileInfo;
    const { isSigned, signers } = reiFormData.formDetail;
    const isSignRemote = isSigned && signers?.length > 0;

    const files = {
      ...reiFormData.formDetail,
      icon: this.fileService.getFileIcon(fileName),
      size: fileSize,
      name: fileName,
      fileType: {
        name: contentType
      },
      fileUrl: reiFormData.s3Info.url,
      formDetail: {
        ...reiFormData.formDetail,
        formFiles: reiFormData.formDetail?.formFiles.map((x) => ({
          ...x,
          fileIcon: this.fileService.getFileIcon(x.filename),
          shortName: x.filename.split('.')[0]
        }))
      }
    };

    if (
      this.trudiSendMsgService.getPopupState().addReiFormOutside &&
      !isSignRemote
    ) {
      this.trudiSendMsgService.getPopupState().handleCallback([files]);
    }

    if (this.trudiSendMsgService.getPopupState().addReiForm && isSignRemote) {
      this.trudiSendMsgService.setListFilesReiFormSignRemote([
        {
          ...files,
          ...this.getMapFiles(reiFormData)
        }
      ]);
    }

    if (this.trudiSendMsgService.getPopupState().addReiForm && !isSignRemote) {
      this.listOfFilesControl.setValue([
        ...this.listOfFilesControl.value,
        files
      ]);
    }

    this.trudiSendMsgService.resetCheckBox();
    this.handleChangeStatePopup(this.popupName.sendMessage);
    this.trudiSaveDraftService.setTrackControlChange('reiForm', true);
    this.onClose.emit();
  }

  onBackAttachNote() {
    this.handleChangeStatePopup(this.popupName.selectPeople);
  }

  onBackAttachModal() {
    this.trudiSendMsgService.setPopupState({
      [this.popupName.sendMessage]: true,
      addReiForm: false,
      addReiFormOutside: false,
      addReiFormWidget: true
    });
  }

  closeSendMessage() {
    this.popupState.sendMessage = false;
    this.trudiSendMsgService.resetPopupStateReiForm();
  }

  changeREIFormButtonBox(status: boolean, nameBox: boolean) {
    this.showDocumentStatus = status;
    this.showREIFormNameBox = nameBox;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
