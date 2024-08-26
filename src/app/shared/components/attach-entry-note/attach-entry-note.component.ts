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
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ApiService } from '@services/api.service';
import { FilesService } from '@services/files.service';
import { ReiFormService } from '@services/rei-form.service';
import { UserService } from '@services/user.service';
import {
  getErrorMessageReiForm,
  validateFileExtension,
  validateFileSize
} from '@shared/feature/function.feature';
import { IFileType } from '@shared/types/file.interface';
import { fileLimit, properties } from 'src/environments/environment';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import uuid4 from 'uuid4';
import { cloneDeep } from 'lodash-es';

const MAX_FILE_SIZE = 25;
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
  selector: 'attach-entry-note',
  templateUrl: './attach-entry-note.component.html',
  styleUrls: ['./attach-entry-note.component.scss']
})
export class AttachEntryNoteComponent implements OnInit, OnChanges, OnDestroy {
  @Input() modalId: string;
  @Input() showAttachEntryNotePopup = false;
  @Input() headerName = '';
  @Input() listFileUpload = [];
  @Input() bodyTitle = '';
  @Input() hasBackButton = false;
  @Input() canSkip = false;
  @Input() acceptType = [];
  @Input() isShowSelectReiForm: boolean = true;
  @Output() onNextModal = new EventEmitter<boolean>();
  @Output() onCloseModal = new EventEmitter<boolean>();
  @Output() closeAndResetAllPopup = new EventEmitter<boolean>();
  @Output() onBackModal = new EventEmitter<boolean>();
  @Output() onCreateOrSelectForm = new EventEmitter();
  @Output() listSelectedFile = new EventEmitter();
  @Output() onSkipAttachment = new EventEmitter<boolean>();

  private subscribers = new Subject<void>();
  public isLoading = false;
  public overFileSize = false;
  public isValidFileUploadType = true;
  public fileTypes: IFileType[];
  public selectedFile: FileList | File[] = null;
  public timeUpload: number;
  public reiFormError = cloneDeep(INIT_REIFORM_ERROR);
  public isNext = false;
  public currentIndex = 0;
  public fileAccept = '';
  public currentAgencyId: string;
  readonly ModalPopupPosition = ModalPopupPosition;
  public draggable: boolean = true;

  constructor(
    private router: Router,
    private fileService: FilesService,
    private apiService: ApiService,
    private userService: UserService,
    private reiFormService: ReiFormService,
    private agencyService: AgencyService,
    private trudiSendMsgService: TrudiSendMsgService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showAttachEntryNotePopup']?.currentValue) {
      this.isLoading = false;
      this.getListFileType();
      this.reiFormError = cloneDeep(INIT_REIFORM_ERROR);
    }
  }

  handleCloseModal(event: boolean) {
    this.onCloseModal.emit(event);
    this.closeAndResetAllPopup.emit();
    this.reiFormError = cloneDeep(INIT_REIFORM_ERROR);
  }

  handleBackModal() {
    this.onBackModal.emit();
    this.reiFormError = cloneDeep(INIT_REIFORM_ERROR);
  }

  handleCreateOrSelectForm() {
    const { reiFormErrorNotFound } = getErrorMessageReiForm();
    if (!this.userService.userInfo$.value?.reiToken) {
      this.reiFormError = reiFormErrorNotFound;
      return;
    }
    this.isLoading = true;
    this.onCreateOrSelectForm.emit();
    this.onSkipAttachment.emit(false);
  }

  handleNextModal() {
    if (this.canSkip) {
      this.onNextModal.emit(true);
      this.onSkipAttachment.emit(true);
      this.reiFormError = cloneDeep(INIT_REIFORM_ERROR);
    } else {
      this.reiFormError = {
        status: true,
        message: [
          {
            text: 'The document is required.',
            href: ''
          }
        ]
      };
    }
  }

  isReiFormError() {
    if (this.overFileSize) {
      this.reiFormError = {
        status: false,
        message: [
          {
            text: 'Your file is larger than 25MB. Please upload a smaller file.',
            href: ''
          }
        ]
      };
    } else if (!this.isValidFileUploadType) {
      this.reiFormError = {
        status: false,
        message: [
          {
            text: 'Unsupported file type.',
            href: ''
          }
        ]
      };
    } else {
      this.reiFormError = cloneDeep(INIT_REIFORM_ERROR);
    }
  }

  handleClickMsg(path) {
    if (!path) return;
    this.router.navigate([path]);
  }

  onFilesDropped(data) {
    this.overFileSize = false;
    this.isValidFileUploadType = true;
    if (data.length === 1) {
      const [file] = data;
      const fileSizeMb = file.size / 1024 ** 2;
      const validFileType = validateFileExtension(file, this.acceptType);
      this.isValidFileUploadType = validFileType;
      if (validFileType) {
        const fileType = this.fileTypes.find(
          (el) => el.name === this.getFileType(file).toLowerCase()
        );
        if (this.fileTypes && fileType && fileSizeMb < fileLimit) {
          this.prepareFilesList(data);
          this.overFileSize = false;
        } else {
          this.overFileSize = true;
          this.selectedFile = null;
        }
      }
      this.isReiFormError();
    }
  }

  fileBrowseHandler(event) {
    this.overFileSize = false;
    this.isValidFileUploadType = true;
    let filesList: File[] = [];
    const files = event.target.files;

    if (files.length) {
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        filesList.push(file);
        const newFile = filesList.map(
          (
            item: File & {
              id?: string;
              validFileType?: boolean;
              overFileSize?: boolean;
            }
          ) => {
            item.id = uuid4();
            item.validFileType = validateFileExtension(item, this.acceptType);
            item.overFileSize = item.size / 1024 ** 2 > fileLimit;
            return item;
          }
        );
        this.prepareFilesList(newFile);
      }
    }
  }

  getFileType(file): string {
    const splitFileNameArray = file.name.split('.');
    const fileExtension = splitFileNameArray[splitFileNameArray.length - 1];
    if (fileExtension === 'avi') {
      return 'video/avi';
    }
    if (file.type) {
      return file.type;
    }
    return '';
  }

  prepareFilesList(file: FileList | File[]) {
    this.timeUpload = Date.now();
    this.selectedFile = file;
    this.mapInfoListFile(this.selectedFile);
    this.listSelectedFile.emit(this.selectedFile);
    this.onSkipAttachment.emit(false);
  }

  validateFile(file) {
    file.errors = {};
    if (!validateFileSize(file, MAX_FILE_SIZE)) {
      file.errors.fileSize = true;
    }
    if (Object.keys(file.errors).length === 0) {
      file.errors = null;
    }
  }

  addFile(file, index) {
    this.isNext = false;
    this.currentIndex = index;
    this.validateFile(file[0]);
    this.mapInfoListFile(file[0]);
    if (this.listFileUpload[this.currentIndex])
      this.listFileUpload[this.currentIndex].listFile = {
        id: uuid4(),
        ...file
      };
  }

  mapInfoListFile(fileList) {
    if (!fileList) return;
    for (let index = 0; index < fileList.length; index++) {
      if (!fileList[index]) return;
      fileList[index].icon = this.fileService.getFileIcon(fileList[index].name);
      fileList[index].fileName = this.fileService.getFileName(
        fileList[index].name
      );
      fileList[index].extension = this.fileService.getFileExtension(
        fileList[index].name
      );
    }
  }

  getListFileType() {
    if (!localStorage.getItem('listFileType')) {
      this.apiService
        .getAPI(properties, 'list-of-filetype')
        .pipe(takeUntil(this.subscribers))
        .subscribe((res: IFileType[]) => {
          this.fileTypes = res;
          localStorage.setItem('listFileType', JSON.stringify(res));
        });
    } else {
      this.fileTypes = JSON.parse(localStorage.getItem('listFileType'));
    }
  }

  ngOnDestroy(): void {
    this.subscribers.next();
    this.subscribers.complete();
  }
}
