import { Injectable } from '@angular/core';
import { FilesService } from './files.service';
import {
  getThumbnailForVideo,
  validateFileExtension
} from '@shared/feature/function.feature';
import { EAvailableFileIcon, IFile } from '@shared/types/file.interface';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  ALLOWED_TYPES,
  FILE_VALID_TYPE,
  listFileDisplayThumbnail,
  MAX_FILE_SIZE
} from './constants';
import { fileLimit } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';

interface IInvalidFile {
  unSupportFile: boolean;
  overFileSize: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TinyEditorFileControlService {
  private selectedFile: BehaviorSubject<FileList | File[]> =
    new BehaviorSubject<FileList | File[]>(null);
  private listFileUpload: BehaviorSubject<
    { title: string; listFile: any[] }[]
  > = new BehaviorSubject([]);
  private listOfFiles: BehaviorSubject<IFile[]> = new BehaviorSubject<IFile[]>(
    []
  );
  private showPopupInvalidFile: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  private invalidFile: BehaviorSubject<IInvalidFile> =
    new BehaviorSubject<IInvalidFile>({
      unSupportFile: false,
      overFileSize: false
    });

  public selectedFile$ = this.selectedFile.asObservable();
  public listFileUpload$ = this.listFileUpload.asObservable();
  public listOfFiles$ = this.listOfFiles.asObservable();
  public showPopupInvalidFile$ = this.showPopupInvalidFile.asObservable();
  public invalidFile$ = this.invalidFile.asObservable();
  public FILE_VALID_TYPE = FILE_VALID_TYPE;

  constructor(
    private filesService: FilesService,
    private trudiSendMsgService: TrudiSendMsgService
  ) {}

  get selectedFileValue() {
    return this.selectedFile.value;
  }

  get listFileUploadValue() {
    return this.listFileUpload.value;
  }

  get listOfFilesValue() {
    return this.listOfFiles.value;
  }

  get showPopupInvalidFileValue() {
    return this.showPopupInvalidFile.value;
  }

  setListOfFiles(value: IFile[]) {
    this.listOfFiles.next(value);
  }

  setInvalidFile(unSupportFile: boolean, overFileSize: boolean) {
    this.invalidFile.next({
      unSupportFile,
      overFileSize
    });
  }

  async fileBrowseHandler(event) {
    const [file] = event.target?.files || [];
    this.setInvalidFile(false, false);
    this.selectedFile.next(null);
    if (!file) return;
    let files: File[] = [];
    const length = event.target.files.length;
    for (let index = 0; index < length; index++) {
      const file = event.target.files[index];
      const processedFile = await this.processFile(file);
      if (processedFile) {
        files.push(processedFile);
      }
    }
    this.prepareFilesList(files);
    this.trudiSendMsgService.setListFilesReiForm(files);
    this.handleOnSubmitUploadAttachments();
    event.target.value = null;
  }

  async processFile(file) {
    const fileExtension = this.filesService.getFileExtension(file.name);
    if (ACCEPT_ONLY_SUPPORTED_FILE.includes(fileExtension)) {
      if (
        file.type.indexOf('video') > -1 &&
        listFileDisplayThumbnail.includes(fileExtension)
      ) {
        const fileUrl = URL.createObjectURL(file);
        file.localThumb = await getThumbnailForVideo(fileUrl);
        file.isSupportedVideo = true;
      } else if (file.type.indexOf('video') > -1) {
        file.localThumb = 'assets/images/icons/video.svg';
      }

      if (file.type.indexOf('image') > -1) {
        file.localThumb = URL.createObjectURL(file);
      }
    }
    return file;
  }

  prepareFilesList(file: FileList | File[]) {
    this.selectedFile.next(file);
    this.mapInfoListFile(this.selectedFileValue);
    this.listFileUpload.next([]);
    for (let index = 0; index < this.selectedFileValue.length; index++) {
      this.listFileUpload.next([
        ...this.listFileUploadValue,
        {
          title: ``,
          listFile: [this.selectedFileValue[index]]
        }
      ]);
    }
  }

  mapInfoListFile(fileList) {
    if (!fileList) return;
    for (let index = 0; index < fileList.length; index++) {
      if (!fileList[index]) return;
      fileList[index].icon = fileList[index].fileType
        ? fileList[index].fileType.icon
        : this.filesService.getFileIcon(fileList[index].name);
      fileList[index].fileName = this.filesService.getFileName(
        fileList[index].name
      );
      fileList[index].extension = this.filesService.getFileExtension(
        fileList[index].name
      );
      if (fileList[index].isFromAttachmentWidget) {
        fileList[index].isSupportedVideo = !!fileList[index].thumbMediaLink;
      } else {
        fileList[index].isSupportedVideo =
          (fileList[index].fileType?.name || fileList[index].type)?.indexOf(
            'video'
          ) > -1 &&
          listFileDisplayThumbnail.includes(fileList[index].extension);
      }
    }
  }

  handleOnSubmitUploadAttachments() {
    let additionalFiles = this.listFileUploadValue.flatMap(
      (item) => item.listFile
    );
    additionalFiles = additionalFiles.map((item) => {
      return {
        '0': item,
        icon:
          item.icon === EAvailableFileIcon.Audio
            ? EAvailableFileIcon.voiceMailAudio
            : item.icon
      };
    });
    this.listOfFiles.next([...this.listOfFilesValue, ...additionalFiles]);
    this.listFileUpload.next([]);
    this.validateFileSize();
  }

  validateFileSize() {
    if (!this.listOfFilesValue?.length) {
      this.setInvalidFile(false, false);
      return;
    }
    const unsupportFile = this.listOfFilesValue.some(
      (item) => !validateFileExtension(item[0] || item, this.FILE_VALID_TYPE)
    );
    const overFileSize = this.listOfFilesValue.some(
      (item) => (item[0]?.size || item.size) / 1024 ** 2 > MAX_FILE_SIZE
    );
    this.setInvalidFile(unsupportFile, overFileSize);
  }

  isImage(file) {
    if (
      ((file[0]?.type && file[0].type?.includes('image')) ||
        file[0]?.fileTypeDot === 'photo') &&
      validateFileExtension(file[0], FILE_VALID_TYPE)
    ) {
      return true;
    }

    return false;
  }

  isVideo(file) {
    if (
      ((file[0]?.type && file[0].type?.includes('video')) ||
        file[0]?.fileTypeDot === 'video') &&
      validateFileExtension(file[0], FILE_VALID_TYPE)
    ) {
      return true;
    }

    return false;
  }

  isInvalidFile(file) {
    const fileCheck = file[0] ? file[0] : file;
    return (
      !validateFileExtension(fileCheck, FILE_VALID_TYPE) ||
      fileCheck?.size / 1024 ** 2 > fileLimit
    );
  }

  async previewFileAttachment(files) {
    let validFiles = [];
    const filesAttachment = files?.map((file) => (file[0] ? file[0] : file));
    this.prepareFilesList(filesAttachment);
    for (let i = 0; i < filesAttachment.length; i++) {
      // skip svg
      if (filesAttachment[i].type.indexOf('svg') > -1) return;
      if (ALLOWED_TYPES.indexOf(filesAttachment[i].type) > -1) {
        if (
          filesAttachment[i].type.indexOf('video') > -1 &&
          listFileDisplayThumbnail.includes(
            filesAttachment[i].extension ||
              this.filesService.getFileExtension(filesAttachment[i].name)
          )
        ) {
          const fileUrl = URL.createObjectURL(filesAttachment[i]);
          filesAttachment[i].localThumb = await getThumbnailForVideo(fileUrl);
          filesAttachment[i].isSupportedVideo = true;
        } else if (filesAttachment[i].type.indexOf('video') > -1) {
          filesAttachment[i].localThumb = 'assets/images/icons/video.svg';
        }
        if (filesAttachment[i].type.indexOf('image') > -1) {
          filesAttachment[i].localThumb = URL.createObjectURL(
            filesAttachment[i]
          );
        }
        validFiles.push(filesAttachment[i]);
      }
    }

    this.handleOnSubmitUploadAttachments();
    // this.dropFile.emit([...this.listOfFiles].slice(-validFiles?.length));
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
  getListFileType(fileTypes) {
    const listFileType = localStorage.getItem('listFileType');
    if (listFileType) {
      fileTypes = JSON.parse(listFileType);
    } else {
      this.filesService.getListFileTye().subscribe((res) => {
        fileTypes = res;
        localStorage.setItem('listFileType', JSON.stringify(res));
      });
    }
  }

  handleCheckValidateFilesDrop(files) {
    const filesUpload = files?.map((file) => (file[0] ? file[0] : file));
    const filesValid = filesUpload.filter((file) => !this.isInvalidFile(file));
    this.showPopupInvalidFile.next(filesValid.length < files.length);
    return filesValid;
  }

  resetAllValue() {
    this.listFileUpload.next([]);
    this.selectedFile.next([]);
    this.listOfFiles.next([]);
    this.showPopupInvalidFile.next(false);
  }
}
