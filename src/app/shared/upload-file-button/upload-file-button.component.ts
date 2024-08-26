import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { EUploadFileError } from '@/app/console-setting/promotions/utils/type';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  FILE_VALID_TYPE,
  SUPPORTED_FILE_CAROUSEL
} from '@services/constants';
import { FileUploadService } from '@services/fileUpload.service';
import { FilesService, LocalFile } from '@services/files.service';
import { PropertiesService } from '@services/properties.service';
import { IHistoryNoteFile } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { TrudiButtonType, TrudiButtonVariant } from '@trudi-ui';
import { processFile } from '@shared/feature/function.feature';
import { fileLimit } from 'src/environments/environment';
import uuid4 from 'uuid4';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { FileCarousel } from '@shared/types/file.interface';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'upload-file-button',
  templateUrl: './upload-file-button.component.html',
  styleUrls: ['./upload-file-button.component.scss'],
  providers: [
    {
      provide: forwardRef(() => FilesService)
    }
  ]
})
export class UploadFileButtonComponent implements OnInit, OnChanges, OnDestroy {
  @Input() multipleFile: boolean = false;
  @Input() acceptTypeFile = ACCEPT_ONLY_SUPPORTED_FILE;
  @Input() title: string;
  @Input() label: string = 'Upload file';
  @Input() buttonVariant: TrudiButtonVariant = 'tonal';
  @Input() disableRemoveButton: boolean = false;
  @Input() enableToast: boolean = false;
  @Input() icon: string;
  @Input() listFileData: IHistoryNoteFile[];
  @Input() useListFileData: boolean = false;
  @Input() disableTooltipText = '';
  @Input() showLoading: boolean = false;
  @Input() showListFile: boolean = true;
  @Input() hiddenButtonUpload = false;
  @Input() buttonTheme: TrudiButtonType = 'primary';
  @Input() showFileSize: boolean = true;
  @Input() showPopupWarning: boolean = false;
  @Input() showFileTooLarge: boolean = true;
  @Input() hideAllVisualization: boolean = false;
  @Input() throwError: boolean = false;
  @Input() showCustomizedLabel: boolean = false;
  @Input() showFileThumb = true;
  @Input() isFromUserDefineFields: boolean = false;
  @Input() supportTypeFile = [];
  @Input() warningContent: string =
    'Only pdf, png, xlsx, doc, docx, jpg, jpeg, ppt, bevm, bpm, csc, eml, gif, htm, HTML, iif, msg, pptx, rmaw, rmct, rmd, rmf, rmt, rmsb, rmtx, rrtx, rtf, xls, xlsx, xlsm are allowed.';
  @Input() maxFiles: number;
  @Input() filePreview: boolean = false;
  @Input() set setCustomErrorMsg(value) {
    this.customErrorMsg = {
      ...this.customErrorMsg,
      ...value
    };
  }
  @Input() isIncludeInvalidFile: boolean = false;
  @Input() isShowFileBeforeUpload: boolean = false;

  @Output() getListFile = new EventEmitter();
  @Output() changeFile = new EventEmitter();
  @Output() hasErrorMsg = new EventEmitter<boolean>();
  public listFile = [];
  public areSomeFilesTooLarge: boolean = false;
  @Input() disable: boolean = false;
  @Output() public loadingChange = new EventEmitter<boolean>(false);
  public loading: boolean = false;
  public isShowWarning: boolean = false;
  readonly FILE_VALID_TYPE = FILE_VALID_TYPE;
  public id = uuid4();
  public invalidType = {};

  public isShowCarousel: boolean = false;
  public popupModalPosition = ModalPopupPosition;
  public initialIndex: number;
  public arrayImageCarousel: FileCarousel[] = [];
  public errorMessage: string;
  public errorMessageArr: {
    errorType: EUploadFileError;
    errorMessage: string;
  }[] = [];
  public showFileInvalid = false;
  private unsubscribe = new Subject<void>();

  private customErrorMsg = {
    fileTypeError: 'Unsupported file type.',
    fileSizeError:
      'Your file is larger than 25MB. Please upload a smaller file.'
  };

  constructor(
    private filesService: FilesService,
    private fileUpload: FileUploadService,
    private propertyService: PropertiesService,
    private toastService: ToastrService
  ) {}

  ngOnInit(): void {
    if (this.listFileData) {
      this.filesService.listFileUpload.next(this.listFileData);
    }
    this.filesService.getListFileUpload
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (!rs) return;
        this.listFile = rs?.map((item) => {
          return {
            ...item,
            localThumb:
              item.mediaType === 'photo' && item.mediaLink
                ? item.mediaLink
                : item.localThumb
          };
        });
        if (!this.multipleFile && this.listFile?.length > 1) {
          this.listFile = [this.listFile.pop()];
        }

        this.getListFile.emit(this.listFile);

        this.listFile.forEach((item) => {
          if (!this.invalidType[item.fileType] && !this.checkFileType(item)) {
            this.invalidType[item.fileType] = true;
          }
        });
      });

    this.loadingChange
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isLoading) => {
        this.loading = isLoading;
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['listFileData']?.currentValue && this.useListFileData) {
      if (!!this.listFileData && this.listFileData.length) {
        this.listFile = this.listFileData;

        if (this.isIncludeInvalidFile) {
          let countInvalidFilesSizeCount = 0;
          let countInvalidFilesTypeCount = 0;
          this.listFile.forEach((file: LocalFile) => {
            if (file.error) {
              if (file.errorType === EUploadFileError.FILE_TOO_LARGES) {
                countInvalidFilesSizeCount++;
              } else if (
                file.errorType === EUploadFileError.FILE_INVALID_TYPE
              ) {
                countInvalidFilesTypeCount++;
              } else {
                countInvalidFilesSizeCount++;
                countInvalidFilesTypeCount++;
              }
            }
          });

          this.checkShowInvalidFilesMessage(
            countInvalidFilesSizeCount,
            countInvalidFilesTypeCount
          );
        }
      } else {
        this.listFile = [];
        this.errorMessageArr = [];
        this.isShowWarning = false;
        this.showFileInvalid = false;
        this.areSomeFilesTooLarge = false;
      }
    }
  }

  checkShowInvalidFilesMessage(
    countInvalidFilesSizeCount: number,
    countInvalidFilesTypeCount: number
  ) {
    if (countInvalidFilesSizeCount > 0 || countInvalidFilesTypeCount > 0) {
      this.isShowWarning = true;
      if (countInvalidFilesTypeCount > 0) {
        this.showFileInvalid = true;
      } else {
        this.showFileInvalid = false;
        this.removeErrorMessageByType(EUploadFileError.FILE_INVALID_TYPE);
      }

      if (countInvalidFilesSizeCount > 0) {
        this.areSomeFilesTooLarge = true;
      } else {
        this.areSomeFilesTooLarge = false;
        this.removeErrorMessageByType(EUploadFileError.FILE_TOO_LARGES);
      }
    } else {
      this.errorMessageArr = [];
      this.isShowWarning = false;
      this.showFileInvalid = false;
      this.areSomeFilesTooLarge = false;
    }
    this.hasErrorMsg.emit(this.showFileInvalid || this.areSomeFilesTooLarge);
  }

  removeErrorMessageByType(errorType: EUploadFileError) {
    this.errorMessageArr = this.errorMessageArr.filter(
      (err) => err.errorType !== errorType
    );
  }

  addErrorMessageByType(errorType: EUploadFileError) {
    if (this.checkIfErrorIsNotExists(errorType)) {
      this.errorMessageArr.push({
        errorMessage:
          errorType === EUploadFileError.FILE_INVALID_TYPE
            ? this.customErrorMsg.fileTypeError
            : this.customErrorMsg.fileSizeError,
        errorType: errorType
      });
    }
  }

  manageCarouselState(isOpen: boolean, fileIndex?: number) {
    if (!isOpen) {
      this.stopCarousel();
    } else {
      const listFileMap = this.listFile.map((file) => ({
        ...file,
        propertyDocumentId: file.fileId,
        fileTypeName: file.fileType,
        extension: this.filesService.getFileExtensionWithoutDot(file.fileName)
      }));
      const fileSelected = listFileMap[fileIndex];
      const extensionFileSelected = fileSelected.extension;
      if (!SUPPORTED_FILE_CAROUSEL.includes(extensionFileSelected)) {
        this.stopCarousel();
        this.filesService.downloadResource(
          fileSelected.mediaLink,
          fileSelected.fileName
        );
      } else {
        this.arrayImageCarousel = listFileMap.filter((file) => {
          return SUPPORTED_FILE_CAROUSEL.includes(file?.extension);
        });
        if (this.arrayImageCarousel.length > 0) {
          this.initialIndex =
            listFileMap.slice(0, fileIndex + 1).filter((file) => {
              return SUPPORTED_FILE_CAROUSEL.includes(file?.extension);
            }).length - 1;
          this.isShowCarousel = isOpen;
        }
      }
    }
  }

  private stopCarousel() {
    this.isShowCarousel = false;
    this.initialIndex = null;
    this.arrayImageCarousel = [];
  }

  async handleUploadFileLocal(event) {
    if (this.disable) return;
    const files = (Object.values(event.target.files) as LocalFile[]) || [];
    event.target.value = '';
    const filesArr = Object.values(files) as LocalFile[];
    for (let index = 0; index < filesArr.length; index++) {
      const file = filesArr[index];
      const fileExtension = this.filesService.getFileExtension(file?.name);
      await processFile(file, fileExtension, this.acceptTypeFile);
    }
    if (this.throwError && !this.checkSupportFileType(files)) {
      this.getListFile.emit([
        {
          errorType: EUploadFileError.FILE_INVALID_TYPE
        }
      ]);
      return;
    }
    if (!this.checkFilesType(files)) {
      this.isShowWarning = true;
      this.showFileInvalid = true;
      this.hasErrorMsg.emit(this.showFileInvalid || this.areSomeFilesTooLarge);
      this.errorMessage = this.customErrorMsg.fileTypeError;
      if (this.enableToast) this.toastService.error('Unsupported file type.');
      if (!this.isIncludeInvalidFile) return;
    }

    if (!this.checkFilesType(files) && this.isFromUserDefineFields) {
      this.isShowWarning = true;
      return;
    }
    let showFiles = [];

    if (filesArr.length) {
      this.areSomeFilesTooLarge = filesArr.some(
        (item) => item?.size / 1024 ** 2 > fileLimit
      );
      if (this.throwError && this.areSomeFilesTooLarge) {
        this.hasErrorMsg.emit(
          this.showFileInvalid || this.areSomeFilesTooLarge
        );
        this.getListFile.emit([
          {
            errorType: EUploadFileError.FILE_TOO_LARGES
          }
        ]);
        return;
      }

      if (this.isIncludeInvalidFile) {
        showFiles = filesArr?.map((file) => {
          if (file?.size / 1024 ** 2 > fileLimit) {
            file.errorType = EUploadFileError.FILE_TOO_LARGES;
            file.error = true;

            this.addErrorMessageByType(EUploadFileError.FILE_TOO_LARGES);
          }

          const fileType = file?.name?.split('.')?.pop();
          if (
            !(
              this.acceptTypeFile.includes(fileType?.toLowerCase()) ||
              this.acceptTypeFile.includes('.' + fileType?.toLowerCase())
            )
          ) {
            file.error = true;

            if (file.errorType === EUploadFileError.FILE_TOO_LARGES) {
              file.errorType =
                EUploadFileError.FILE_TOO_LARGES_AND_INVALID_TYPE;

              this.addErrorMessageByType(EUploadFileError.FILE_INVALID_TYPE);

              this.addErrorMessageByType(EUploadFileError.FILE_TOO_LARGES);
            } else {
              file.errorType = EUploadFileError.FILE_INVALID_TYPE;

              this.addErrorMessageByType(EUploadFileError.FILE_INVALID_TYPE);
            }
          }
          return file;
        });
      } else {
        showFiles = filesArr?.filter(
          (file) => file?.size / 1024 ** 2 <= fileLimit
        );
      }

      if (
        this.maxFiles &&
        this.listFile.length + showFiles.length > this.maxFiles
      ) {
        showFiles = showFiles.slice(0, this.maxFiles - this.listFile.length);
      }
    }
    if (this.areSomeFilesTooLarge) {
      this.isShowWarning = true;
      this.hasErrorMsg.emit(this.showFileInvalid || this.areSomeFilesTooLarge);
      this.errorMessage = this.customErrorMsg.fileSizeError;
      if (this.enableToast)
        this.toastService.error('The file is larger than 25MB.');

      if (!this.isIncludeInvalidFile) return;
    }
    this.showFileInvalid = false;
    this.loadingChange.emit(true);
    this.changeFile.emit();
    this.hasErrorMsg.emit(this.showFileInvalid || this.areSomeFilesTooLarge);

    if (this.isShowFileBeforeUpload) {
      this.handleFileUploadSameTime(showFiles).finally(() => {
        this.loadingChange.emit(false);
      });
    } else {
      this.handleFileUpload(showFiles)
        .then(() => {
          this.filesService.listFileUpload.next(this.listFile);
        })
        .finally(() => {
          this.loadingChange.emit(false);
        });
    }
  }

  checkIfErrorIsNotExists(errorType: EUploadFileError) {
    return (
      this.errorMessageArr.findIndex((err) => err.errorType === errorType) ===
      -1
    );
  }

  handleFileUploadSameTime(files) {
    let promiseArr = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const {
        name,
        type,
        size,
        localThumb,
        isSupportedVideo,
        error,
        errorType
      } = file || {};

      this.listFile.push({
        title: name,
        fileName: name,
        fileSize: size,
        fileType: type,
        mediaLink: '',
        mediaType: this.filesService.getFileTypeSlash(file?.type),
        icon: this.filesService.getFileIcon(file?.name),
        propertyId: this.propertyService.currentPropertyId.value,
        propertyIds: [],
        error,
        errorType,
        localThumb,
        isSupportedVideo,
        createdAt: new Date()
      });

      const indexOfFile = this.listFile.length - 1;

      this.filesService.listFileUpload.next(this.listFile);

      if (!file.error) {
        const promise = this.fileUpload
          .uploadFile2(file, this.propertyService.currentPropertyId.value)
          .then((infoLink) => {
            this.listFile[indexOfFile].mediaLink = infoLink?.Location;
            this.filesService.listFileUpload.next(this.listFile);
          });

        promiseArr.push(promise);
      }
    }

    return Promise.all(promiseArr);
  }

  async handleFileUpload(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { name, type, size, localThumb, isSupportedVideo } = file || {};

      const infoLink = await this.fileUpload.uploadFile2(
        file,
        this.propertyService.currentPropertyId.value
      );
      this.listFile.push({
        title: name,
        fileName: name,
        fileSize: size,
        fileType: type,
        mediaLink: infoLink?.Location,
        mediaType: this.filesService.getFileTypeSlash(file?.type),
        icon: this.filesService.getFileIcon(file?.name),
        propertyId: this.propertyService.currentPropertyId.value,
        propertyIds: [],
        localThumb,
        isSupportedVideo,
        createdAt: new Date()
      });
    }
  }

  checkFileType(file): boolean {
    const type = file.fileName.split('.')?.pop();
    return (
      this.acceptTypeFile.includes(type?.toLowerCase()) ||
      this.acceptTypeFile.includes('.' + type?.toLowerCase())
    );
  }

  checkFilesType(file): boolean {
    const fileTypes = file?.map((file) => file?.name?.split('.')?.pop());
    return fileTypes?.every(
      (type) =>
        this.acceptTypeFile.includes(type?.toLowerCase()) ||
        this.acceptTypeFile.includes('.' + type?.toLowerCase())
    );
  }

  checkSupportFileType(file): boolean {
    const fileTypes = file?.map((file) => file?.name?.split('.')?.pop());
    return fileTypes?.every((type) =>
      this.supportTypeFile.includes(type?.toLowerCase())
    );
  }

  removeFile(index: number) {
    if (!this.disableRemoveButton) {
      this.listFile.splice(index, 1);
      this.filesService.updateListFileUpload = this.listFile;
      this.getListFile.emit(this.listFile);
    }
  }

  updateThumbnail(files) {
    this.listFile = this.listFile.map((item) => {
      const file = files.find((file) => file.mediaLink === item.mediaLink);
      if (!item.thumbMediaLink && file) {
        item.thumbMediaLink = file.thumbMediaLink;
      }
      return item;
    });
    this.filesService.updateListFileUpload = this.listFile;
    this.getListFile.emit(this.listFile);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
