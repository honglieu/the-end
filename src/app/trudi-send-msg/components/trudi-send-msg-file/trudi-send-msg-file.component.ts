import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  FILE_VALID_TYPE,
  MAX_FILE_SIZE,
  listFileDisplayThumbnail
} from '@services/constants';
import { FilesService, LocalFile } from '@services/files.service';
import {
  processFile,
  validateFileExtension
} from '@shared/feature/function.feature';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { PhotoType } from '@shared/types/task.interface';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import uuidv4 from 'uuid4';
import { isEqual } from 'lodash-es';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';

@Component({
  selector: 'trudi-send-msg-file',
  templateUrl: './trudi-send-msg-file.component.html',
  styleUrls: ['./trudi-send-msg-file.component.scss']
})
export class TrudiSendMsgFileComponent implements OnInit, OnDestroy {
  showPopupInvalidFile = false;
  isOverFileSize = false;
  isUnSupportFile = false;
  isOverImageSize = false;
  public listAttachMediaFiles: PhotoType[] = [];
  @Input() isPrefillMediaFiles: boolean = false;
  @Input() maxFileSize: number = MAX_FILE_SIZE;
  @Input() maxImageFilesSize?: number;
  @Input() fileValidType?: string[] = FILE_VALID_TYPE;
  private unsubscribe = new Subject<void>();
  private shouldTrackChange = false;
  private scrollBottomTimeOut: NodeJS.Timeout = null;
  @Input() acceptOnlySupportedFile: string = ACCEPT_ONLY_SUPPORTED_FILE;
  constructor(
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSaveDraftService: TrudiSaveDraftService,
    private filesService: FilesService,
    private cdr: ChangeDetectorRef,
    private trudiSendMsgService: TrudiSendMsgService
  ) {}

  ngOnInit(): void {
    this.listOfFiles.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((files) => {
        if (files?.length > 0) {
          this.handleScrollToBottom();
          this.validateFile(files);
          this.handleUploadFiles();
        } else {
          this.trackChangeFile();
        }
      });
    if (this.listOfFiles.value?.length > 0) {
      this.listOfFiles.setValue(this.configFiles(this.listOfFiles.value));
    }
    if (this.attachMediaFiles.value?.length > 0) {
      this.attachMediaFiles.setValue(
        this.configFiles(this.attachMediaFiles.value)
      );
    }
    this.listAttachMediaFiles = this.attachMediaFiles.value;
    this.listAttachMediaFiles.map((item) => (item.checked = true));
  }

  handleScrollToBottom() {
    const element = document.querySelector('#sendMsgBody') as HTMLElement;
    if (element) {
      clearTimeout(this.scrollBottomTimeOut);
      this.scrollBottomTimeOut = setTimeout(() => {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      }, 0);
    }
  }

  trackChangeFile() {
    if (
      !this.shouldTrackChange &&
      this.trudiSendMsgService.configs?.value?.body?.draftMessageId
    ) {
      return;
    }

    if (
      !isEqual(
        this.trudiSaveDraftService.cacheListAttachment,
        this.listOfFiles.value
      ) &&
      this.listOfFiles.value
    ) {
      this.trudiSaveDraftService.triggerControlChange$.next(true);
      this.trudiSaveDraftService.cacheListAttachment = this.listOfFiles.value;
    }
  }

  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get listOfFiles() {
    return this.sendMsgForm?.get('listOfFiles');
  }

  get attachMediaFiles(): AbstractControl {
    return this.sendMsgForm?.get('attachMediaFiles');
  }

  getFileIcon(name: string) {
    return this.filesService.getFileIcon(name);
  }

  mapFilesUpload(filesUpload: LocalFile[]) {
    return filesUpload.map((fileUpload) => {
      const fileExtension = this.filesService.getFileExtension(
        fileUpload?.name
      );
      if (fileUpload?.type?.indexOf('video') > -1) {
        fileUpload.isSupportedVideo =
          listFileDisplayThumbnail.includes(fileExtension);
      }
      return {
        '0': fileUpload,
        icon: this.filesService.getFileIcon(fileUpload?.name)
      };
    });
  }

  configFiles(files: LocalFile[] | PhotoType[]) {
    let filesToCheck = files?.map((file) => {
      const updatedFile = file[0] ? file[0] : file;

      const {
        fileTypeDot,
        fileType,
        thumbMediaLink,
        mediaLink,
        thumbnail,
        isAttachmentWidget,
        localThumb,
        isSupportedVideo
      } = updatedFile || {};

      const mappedFileType =
        (typeof updatedFile.fileType === 'object' &&
        Object.keys(updatedFile.fileType).length > 0
          ? updatedFile.fileType.name
          : updatedFile.fileType) || '';

      const sourceThumbnail =
        (((fileTypeDot || fileType) === 'video' ||
          mappedFileType.indexOf('video') > -1) &&
          thumbMediaLink) ||
        ((fileTypeDot || fileType) === 'photo' ||
        mappedFileType.indexOf('image') > -1
          ? mediaLink || thumbnail
          : null);

      updatedFile.localThumb = isAttachmentWidget
        ? sourceThumbnail
        : localThumb || sourceThumbnail;

      updatedFile.isSupportedVideo = isSupportedVideo || !!thumbMediaLink;
      return updatedFile;
    });

    this.validateFile(filesToCheck);

    return filesToCheck;
  }

  validateFile(files: LocalFile[] | PhotoType[]) {
    if (!files?.length) {
      this.trudiSendMsgFormService.isFilesValidate = true;
      this.isUnSupportFile = false;
      this.isOverFileSize = false;
      return;
    }
    this.isUnSupportFile = files?.some(
      (item) => !validateFileExtension(item[0] || item, this.fileValidType)
    );
    this.isOverFileSize = files?.some(
      (item) => (item[0]?.size || item.size) / 1024 ** 2 > this.maxFileSize
    );

    const isHasImageOverSize = this.listOfFiles.value.some((item) => {
      const file = item[0] || item;
      const mediaType =
        file.mediaType ||
        this.filesService.getFileTypeSlash(file?.fileType?.name || file.type);
      const isImage = mediaType === 'image' || mediaType === 'photo';
      return isImage && file.size / 1024 ** 2 > this.maxImageFilesSize;
    });
    this.isOverImageSize = isHasImageOverSize;
    this.trudiSendMsgFormService.isFilesValidate = !(
      this.isUnSupportFile ||
      this.isOverFileSize ||
      isHasImageOverSize
    );
  }

  async handleUploadFileLocal(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;
    if (!files) return;
    const filesArr = Object.values(files) as LocalFile[];
    for (let index = 0; index < filesArr.length; index++) {
      const file = filesArr[index];
      const fileExtension = this.filesService.getFileExtension(file?.name);
      await processFile(file, fileExtension);
    }
    let filesUpload = [
      ...this.listOfFiles.value,
      ...this.mapFilesUpload(filesArr)
    ];
    this.listOfFiles.setValue(this.configFiles(filesUpload));
    this.cdr.markForCheck();
  }

  async handleUploadFiles() {
    this.listOfFiles.value?.forEach((file) => {
      if (!file.localId) {
        file.localId = uuidv4();
      }
      if (!file.uploaded) {
        file.uploaded = false;
      }
      const fileCheck = file[0] ? file[0] : file;
      file.mediaType = file.mediaType
        ? file.mediaType
        : this.filesService.getFileTypeSlash(
            fileCheck?.fileType?.name || fileCheck.type
          );
      const isImage = file.mediaType === 'image' || file.mediaType === 'photo';
      const isOverImageSize =
        this.maxImageFilesSize &&
        isImage &&
        fileCheck.size / 1024 ** 2 > this.maxImageFilesSize;
      file.canUpload = fileCheck?.canUpload
        ? true
        : validateFileExtension(fileCheck, this.fileValidType) &&
          (fileCheck.size || fileCheck?.fileSize) / 1024 ** 2 <=
            this.maxFileSize &&
          !isOverImageSize;
    });
    const listFileUpload = this.listOfFiles.value?.filter(
      (file) => !file.uploaded && file.canUpload && !file.ignoreUpload
    );
    if (listFileUpload.length) {
      this.trudiSaveDraftService.isLoadingUploadFile = true;
      const listFileUploaded = await this.trudiSendMsgService.formatFiles(
        listFileUpload
      );
      listFileUploaded.forEach((image) => {
        if (!image.fileType.includes('image')) return;
        this.preloadImage(image.mediaLink);
      });
      const currentFileUploaded =
        this.trudiSaveDraftService.getListFileUploaded() || [];
      const newUploadedFile = listFileUploaded.filter(
        (one) =>
          !currentFileUploaded.some(
            (item) => item.localId === one.localId && item.mediaLink
          )
      );
      this.trudiSaveDraftService.setListFileUploaded([
        ...currentFileUploaded,
        ...(newUploadedFile || [])
      ]);
      this.listOfFiles.value?.forEach(
        (file) =>
          listFileUpload.some((item) => item.localId === file.localId) &&
          (file.uploaded = true)
      );
      const isUploading = this.listOfFiles.value?.some(
        (file) => !file.uploaded && file.canUpload
      );
      this.trudiSaveDraftService.isLoadingUploadFile = isUploading;
      this.shouldTrackChange = true;
      this.cdr.detectChanges();
    }
    if (listFileUpload.length === 0) return;
    this.trackChangeFile();
  }

  trackByItems(index: number, item: LocalFile) {
    return item?.lastModified;
  }

  removeFile(index: number) {
    const filesUpload = this.listOfFiles.value;
    const itemToRemove = filesUpload[index];
    this.trudiSaveDraftService.isLoadingUploadFile = true;
    filesUpload.splice(index, 1);
    if (itemToRemove) {
      const currentFileUploaded =
        this.trudiSaveDraftService.getListFileUploaded();
      const newUploadedFile = currentFileUploaded.filter(
        (one) => one.localId !== itemToRemove.localId
      );
      this.trudiSaveDraftService.setListFileUploaded(newUploadedFile);
    }
    this.listOfFiles.setValue(filesUpload);
    this.trudiSaveDraftService.isLoadingUploadFile = false;
    this.validateFile(filesUpload);
    if (itemToRemove.canUpload) {
      this.trudiSaveDraftService.triggerControlChange$.next(true);
    }
  }

  removeMediaFiles(index: number) {
    const filesUpload = this.listAttachMediaFiles;
    filesUpload.splice(index, 1);
    this.attachMediaFiles.setValue(filesUpload);
    this.validateFile(filesUpload);
  }

  preloadImage(url: string) {
    const img = new Image();
    img.src = url;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    clearTimeout(this.scrollBottomTimeOut);
  }
}
