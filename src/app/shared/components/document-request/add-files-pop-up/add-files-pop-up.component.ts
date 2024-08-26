import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fileLimit, properties } from 'src/environments/environment';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import { ApiService } from '@services/api.service';
import { FilesService } from '@services/files.service';
import { PopupService } from '@services/popup.service';
import { validateFileExtension } from '@shared/feature/function.feature';
import { IFile } from '@shared/types/file.interface';
import { SharedService } from '@services/shared.service';

@Component({
  selector: 'app-add-files-document-request-popup',
  templateUrl: './add-files-pop-up.component.html',
  styleUrls: ['./add-files-pop-up.component.scss']
})
export class DocumentRequestAddFilesPopUpComponent implements OnInit {
  @Input() show = false;
  @Input() fileTypeSelect: string;

  @Output() isOpenQuitConfirmModal = new EventEmitter<boolean>();
  @Output() isOpenNewActionLinkModal = new EventEmitter<boolean>();
  @Output() isOpenSendMessageModal = new EventEmitter<boolean>();
  @Output() isOpenSendQuote = new EventEmitter<boolean>();
  @Output() isOpenFileSendQuote = new EventEmitter<boolean>();
  @Output() outSelectedFile = new EventEmitter<IFile>();
  selectedFile: IFile;
  public selectTopicItems;
  public fg: FormGroup;
  public overFileSize = false;
  public timeUpload: number;
  public statusQuoteFile: boolean;

  private fileTypes: any;
  isValidFileUploadType = true;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    public fileService: FilesService,
    private agentUserService: AgentUserService,
    private popupService: PopupService,
    public shareService: SharedService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['show']?.currentValue) {
      this.getListFileType();
      this.getListDocumentType();
      this.fg?.reset();
      this.statusQuoteFile = this.shareService.isStatusStepQuote$.getValue();
    } else {
    }
  }

  getListFileType() {
    if (!localStorage.getItem('listFileType')) {
      this.apiService
        .getAPI(properties, 'list-of-filetype')
        .subscribe((res) => {
          this.fileTypes = res;
          localStorage.setItem('listFileType', JSON.stringify(res));
        });
    } else {
      this.fileTypes = JSON.parse(localStorage.getItem('listFileType'));
    }
  }

  getListDocumentType() {
    if (!localStorage.getItem('listDocumentType')) {
      this.apiService
        .getAPI(properties, 'list-of-documenttype')
        .subscribe((res) => {
          if (res) {
            localStorage.setItem('listDocumentType', JSON.stringify(res));
            const table = [];
            const fulllistofConversationCategory = res;
            fulllistofConversationCategory.forEach((el) => {
              table.push({
                id: el.id,
                text: el.name
              });
            });
            this.selectTopicItems = table;
          }
        });
    } else {
      const table = [];
      const fulllistofConversationCategory = JSON.parse(
        localStorage.getItem('listDocumentType')
      );
      fulllistofConversationCategory.forEach((el) => {
        table.push({
          id: el.id,
          text: el.name
        });
      });
      this.selectTopicItems = table;
    }
  }

  ngOnInit() {
    this.agentUserService.getIsCloseAllModal().subscribe((res) => {
      this.overFileSize = false;
      this.selectedFile = null;
      this.timeUpload = 0;
    });

    this.fg = this.fb.group({
      topic: this.fb.control('', Validators.required),
      title: this.fb.control('', [
        Validators.required,
        Validators.maxLength(30)
      ])
    });
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

  prepareFilesList(file: IFile) {
    this.timeUpload = Date.now();
    this.selectedFile = file;
    this.mapInfoListFile(this.selectedFile);
  }

  onFilesDropped($event) {
    this.overFileSize = false;
    this.isValidFileUploadType = true;
    if ($event.length === 1) {
      const [file] = $event;
      const fileSizeMb = file.size / 1024 ** 2;
      const validFileType = validateFileExtension(file);
      this.isValidFileUploadType = validFileType;
      if (validFileType) {
        const fileType = this.fileTypes.find(
          (el) => el.name === this.getFileType(file)
        );
        if (this.fileTypes && fileType && fileSizeMb < fileLimit) {
          this.prepareFilesList($event);
          this.overFileSize = false;
        } else {
          this.overFileSize = true;
          this.selectedFile = null;
        }
      }
    }
  }

  fileBrowseHandler($event) {
    this.overFileSize = false;
    this.isValidFileUploadType = true;
    if ($event.target.files && $event.target.files.length) {
      this.isValidFileUploadType = false;
      const [file] = $event.target.files;
      const fileSizeMb = file.size / 1024 ** 2;
      const fileType = this.fileTypes.find(
        (el) => el.name === this.getFileType(file)
      );
      const validFileType = validateFileExtension(file);
      this.isValidFileUploadType = validFileType;
      if (validFileType) {
        if (this.fileTypes && fileType && fileSizeMb < fileLimit) {
          this.prepareFilesList($event.target.files);
          this.overFileSize = false;
        } else {
          this.overFileSize = true;
          this.selectedFile = null;
          this.timeUpload = 0;
        }
      }
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.timeUpload = 0;
  }

  clickable() {
    return this.selectedFile && this.fg.valid;
  }

  public backtoSendMessageModal(status: boolean) {
    this.isValidFileUploadType = true;
    this.overFileSize = false;
    this.selectedFile = null;
    this.timeUpload = 0;
    this.checkStatusQuoteFile(status);
    this.popupService.setIsScroll(false);
  }

  public openAddFile(status: boolean) {
    this.overFileSize = false;
    this.outSelectedFile.next({
      ...this.selectedFile,
      title: this.title.value,
      topicId: this.topic.value
    });
    this.selectedFile = null;
    this.timeUpload = 0;
    this.checkStatusQuoteFile(status);
    this.popupService.setIsScroll(true);
  }

  public checkStatusQuoteFile(status: boolean) {
    this.isOpenSendMessageModal.emit(status);
  }

  get topic() {
    return this.fg.get('topic');
  }

  setTopic(value: string) {
    this.topic.setValue(value);
  }

  get title() {
    return this.fg.get('title');
  }

  setTitle(value: string) {
    this.title.setValue(value);
  }

  public openQuitConfirmModal(status) {
    this.isValidFileUploadType = true;
    this.isOpenQuitConfirmModal.next(status);
    this.popupService.setFromFileModal(status);
  }

  mapInfoListFile(fileList) {
    if (!fileList) return;
    for (let index = 0; index < fileList.length; index++) {
      this.mapInfoFile(fileList[index]);
    }
  }

  mapInfoFile(file) {
    if (!file) return;
    file.icon = this.fileService.getFileIcon(file.name);
    file.fileName = this.fileService.getFileName(file.name);
    file.extension = this.fileService.getFileExtension(file.name);
  }
}
