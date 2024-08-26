import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  FILE_VALID_TYPE,
  MAX_FILE_SIZE
} from '@services/constants';
import { FileUploadService } from '@services/fileUpload.service';
import { PropertiesService } from '@services/properties.service';
import {
  processFile,
  validateFileExtension
} from '@shared/feature/function.feature';
import { IHistoryNoteFile } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { TrudiButtonType } from '@trudi-ui';
import uuid4 from 'uuid4';
import { FilesService, LocalFile } from '@services/files.service';
import { TaskService } from '@services/task.service';
import uuidv4 from 'uuid4';
import { EUploadFileType } from '@shared/components/upload-from-crm/upload-from-crm.interface';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'lease-renewal-attach-file-button',
  templateUrl: './lease-renewal-attach-file-button.component.html',
  styleUrls: ['./lease-renewal-attach-file-button.component.scss']
})
export class LeaseRenewalAttachFileButtonComponent
  implements OnInit, OnDestroy
{
  @Input() multipleFile: boolean = false;
  @Input() acceptTypeFile = ACCEPT_ONLY_SUPPORTED_FILE;
  @Input() title: string;
  @Input() label: string = 'Upload file';
  @Input() disableRemoveButton: boolean = false;
  @Input() enableToast: boolean = false;
  @Input() icon: string;
  @Input() listFileData: IHistoryNoteFile[];
  @Input() disableTooltipText = '';
  @Input() showLoading: boolean = false;
  @Input() showListFile: boolean = true;
  @Input() buttonTheme: TrudiButtonType = 'primary';
  @Input() showFileSize: boolean = true;
  @Input() showPopupWarning: boolean = false;
  @Input() showFileTooLarge: boolean = true;
  @Input() hideAllVisualization: boolean = false;
  @Input() throwError: boolean = false;
  @Input() showCustomizedLabel: boolean = false;
  @Input() supportTypeFile = [];
  @Input() warningContent: string =
    'Only pdf, png, xlsx, doc, docx, jpg, jpeg, ppt, bevm, bpm, csc, eml, gif, htm, HTML, iif, msg, pptx, rmaw, rmct, rmd, rmf, rmt, rmsb, rmtx, rrtx, rtf, xls, xlsx, xlsm are allowed.';
  @Output() getListFile = new EventEmitter();
  @Output() setStatusSyncButton = new EventEmitter<boolean>();
  public listFile: LocalFile[] = [];
  public areSomeFilesTooLarge: boolean = false;
  @Input() disable: boolean = false;
  private destroy$ = new Subject<void>();
  public loading: boolean = false;
  public isShowWarning: boolean = false;
  readonly FILE_VALID_TYPE = FILE_VALID_TYPE;
  public id = uuid4();
  public hasBack: boolean = true;
  public popupState = {
    isSelectFiles: false
  };
  public attachFileText = {
    back: 'Back',
    next: 'Attach',
    overSize: 'Your file is larger than 25MB. Please upload a smaller file.',
    unSupported: 'Unsupported file type.',
    notFound: 'No attachments found in this task',
    header: 'Attach file',
    upload: 'Upload File'
  };
  checkBoxList = [];

  constructor(
    private filesService: FilesService,
    private taskService: TaskService,
    private fileUpload: FileUploadService,
    private propertyService: PropertiesService
  ) {}

  ngOnInit(): void {
    this.listFile = this.filesService.originalLocalFiles.value;
    this.getFiles();
  }

  getFiles() {
    this.filesService
      .getFilesByTask(this.taskService.currentTaskId$.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        let attachFiles = [];
        rs.documents.forEach((x) => attachFiles.push(...x.propertyDocuments));
        this.checkBoxList.push(...attachFiles, ...this.listFile);

        this.checkBoxList.forEach(async (file) => {
          (file.title = file?.name || file?.pdfName || file?.fileName),
            (file.created = file?.created || file?.createdAt),
            (file.fileName = file?.name || file?.pdfName || file?.fileName),
            (file.fileSize = file?.size || file?.fileSize),
            (file.icon = this.filesService.getFileIcon(
              file?.pdfName || file?.name || file?.fileName
            )),
            (file.mediaLink = file?.mediaLink || file?.pdfUrl);
          const fileType = file?.fileType?.name || file?.fileType;
          if (fileType?.indexOf(EUploadFileType.VIDEO) > -1) {
            file.isSupportedVideo = !!file.thumbMediaLink;
            file.localThumb = file.thumbMediaLink || null;
          } else if (fileType?.indexOf(EUploadFileType.IMAGE) > -1) {
            file.localThumb = file.mediaLink;
          } else {
            file.localThumb = null;
          }
          file.name = file.fileName;
          const fileExtension = this.filesService.getFileExtension(file?.name);
          file.extension = fileExtension;
          file.id = file.id || uuidv4();

          await processFile(file, fileExtension);
        });
        this.checkBoxList = this.removeDuplicateFiles(this.checkBoxList);
        this.filesService.originalLocalFiles.next(this.checkBoxList);
      });
  }

  removeDuplicateFiles(fileArray) {
    const map = new Map();
    fileArray.forEach((file) => {
      if (!map.has(file.id) || file.checked) {
        map.set(file.id, file);
      }
    });
    return Array.from(map.values());
  }

  async handleFileUpload() {
    this.setStatusSyncButton.emit(true);
    let rs = [];
    for (let i = 0; i < this.listFile?.length; i++) {
      const file = this.listFile?.[i];
      const fileUpload = {
        title: file?.name,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        mediaLink: file?.mediaLink,
        mediaType: this.filesService.getFileTypeSlash(file?.type),
        icon: this.filesService.getFileIcon(file?.name),
        propertyId: this.propertyService.currentPropertyId.value,
        propertyIds: [],
        isSupportedVideo: file?.isSupportedVideo
      };
      if (!file.mediaLink && file.canUpload && !file.uploaded) {
        const { name, type, size, localThumb, isSupportedVideo } = file || {};

        const infoLink = await this.fileUpload.uploadFile2(
          file,
          this.propertyService.currentPropertyId.value
        );
        file.mediaLink = infoLink?.Location || null;
        file.uploaded = true;
        rs.push({
          ...fileUpload,
          mediaLink: infoLink?.Location
        });
      } else {
        rs.push(fileUpload);
      }
    }
    this.setStatusSyncButton.emit(false);
    return rs;
  }

  async handleUploadFileLocal(event: LocalFile[]) {
    const files = [...event];
    let listFiles = [];
    for (let i = 0; i < files.length; i++) {
      const fileCheck = files[i];
      const validFileType = validateFileExtension(fileCheck, FILE_VALID_TYPE);
      const isOverFileSize = fileCheck?.size / 1024 ** 2 > MAX_FILE_SIZE;
      if (
        !files[i]?.mediaLink &&
        !isOverFileSize &&
        validFileType &&
        !files[i]?.uploaded
      ) {
        files[i].uploaded = false;
        files[i].canUpload = true;
        listFiles.push(files[i]);
      } else {
        listFiles.push(files[i]);
      }
    }
    this.handlePopupState({
      isSelectFiles: false
    });
    this.listFile = listFiles;
    const fileUpload = await this.handleFileUpload();
    this.getListFile.emit(fileUpload);
  }

  async removeFile(file, i) {
    const originalLocalFiles = this.filesService.originalLocalFiles.value;
    const index = originalLocalFiles.findIndex((x) => x.id === file.id);

    if (index !== -1 && !this.disableRemoveButton) {
      this.listFile.splice(i, 1);
      const fileUpload = await this.handleFileUpload();
      this.getListFile.emit(fileUpload);
      originalLocalFiles[index].checked = false;

      this.filesService.originalLocalFiles.next(originalLocalFiles);
    }
  }
  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }
  onBack() {
    this.getListFile.emit([]);
    this.handlePopupState({
      isSelectFiles: false
    });
  }
  onClose() {
    this.getListFile.emit([]);
    this.handlePopupState({
      isSelectFiles: false
    });
  }
  onClickAttachFile() {
    this.handlePopupState({
      isSelectFiles: true
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.filesService.originalLocalFiles.next([]);
  }
}
