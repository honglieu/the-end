import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { FilesService } from '@services/files.service';
import {
  validateFileExtension,
  validateFileSize
} from '@shared/feature/function.feature';
import { IFile } from '@shared/types/file.interface';
import { fileLimit } from 'src/environments/environment';

import uuid4 from 'uuid4';
const MAX_FILE_SIZE = 25;

@Component({
  selector: 'upload-attachments',
  templateUrl: './upload-attachments.component.html',
  styleUrls: ['./upload-attachments.component.scss']
})
export class UploadAttachmentComponent implements OnChanges {
  @Input() modalId: string;
  @Input() hasBack = false;
  @Input() titleHeader: string = '';
  @Input() listFileUpload = [];
  @Input() showAddFilesModal: boolean = true;
  @Input() acceptType = [];
  @Input() fileRequired = true;
  @Output() handleCurrentIndex = new EventEmitter<number>();
  @Output() isOpenFile = new EventEmitter<boolean>();
  @Output() onSubmit = new EventEmitter<boolean>();
  @Output() onStopProcess = new EventEmitter<boolean>();
  @Output() backStep = new EventEmitter<boolean>();
  @Output() onRemoveFile = new EventEmitter();
  public isNext = false;
  public currentIndex = 0;
  public listFile: IFile[] = [];
  public showPopupUploadFile: boolean = false;
  public isShowAddFilesModal = false;
  public invalidPdf: boolean = false;
  public isDisabled = false;
  public unSupportFile = false;
  public overFileSize = false;
  constructor(public fileService: FilesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listFileUpload']?.currentValue) {
      this.checkDisabled(this.listFileUpload[0].listFile);
    }
    this.isNext = false;
  }

  checkDisabled(files) {
    this.unSupportFile = files?.some(
      (item) => !validateFileExtension(item, this.acceptType)
    );

    this.overFileSize = files?.some(
      (item) => item.size / 1024 ** 2 > fileLimit
    );
    this.isDisabled = this.unSupportFile || this.overFileSize;
  }

  remove(event) {
    this.listFileUpload?.[0]?.listFile?.splice(event, 1);
    this.listFileUpload[0].listFile = [...this.listFileUpload?.[0]?.listFile];
    this.checkDisabled(this.listFileUpload[0].listFile);
    if (!this.listFileUpload?.[0]?.listFile?.length) {
      this.onRemoveFile.emit();
    }
  }

  submit() {
    this.isNext = true;
    if (this.anyFileError()) return;
    this.onSubmit.emit(true);
  }

  public openFile(index: number) {
    this.currentIndex = index;
    this.showAddFilesModal = false;
    this.showPopupUploadFile = true;
    this.isOpenFile.emit(true);
  }

  showAddFiles() {
    this.showPopupUploadFile = true;
  }

  backSelectLandlord() {
    this.backStep.emit();
  }

  BackUploadAttachments() {
    this.showPopupUploadFile = false;
    this.showAddFilesModal = true;
  }

  stopProcess() {
    this.showPopupUploadFile = false;
    this.onStopProcess.emit(true);
  }

  getFiles() {
    return this.listFileUpload.flatMap((item) => item?.listFile);
  }

  anyFileError() {
    const files = this.getFiles();
    if (this.fileRequired && files.length < this.listFileUpload.length)
      return true;
    if (this.fileRequired && files.some((file) => file && file.errors))
      return true;
    return false;
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
    this.mapInfoFile(file[0]);
    this.listFileUpload[this.currentIndex].listFile = {
      id: uuid4(),
      ...file
    };
  }

  mapInfoFile(file) {
    if (!file) return;
    file.icon = this.fileService.getFileIcon(file.name);
    file.fileName = this.fileService.getFileName(file.name);
    file.extension = this.fileService.getFileExtension(file.name);
  }
}
