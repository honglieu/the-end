import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, switchMap } from 'rxjs';
import {
  AgentFileProp,
  IAttachDocument
} from '@shared/types/user-file.interface';
import {
  conversations,
  properties,
  urlDownloadEnv
} from 'src/environments/environment';
import { EAvailableFileIcon, FileType } from '@shared/types/file.interface';
import { FileUploadProp } from '@shared/types/share.model';
import { IHistoryNoteFile } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { ApiService } from './api.service';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  FILE_VALID_TYPE,
  MIME_TYPE_MAPPING,
  listAudioTypeDot,
  listAudioTypeSlash,
  listCalendarTypeDot,
  listFileDisplayThumbnail,
  listImageTypeDot,
  listImageTypeSlash,
  listVideoTypeDot,
  listVideoTypeSlash
} from './constants';
import { EUploadFileError } from '@/app/console-setting/promotions/utils/type';
import { getThumbnailForVideo } from '@shared/feature/function.feature';

export enum FileTypes {
  active = 'ACTIVE',
  archive = 'ARCHIVE'
}

export enum FileTabTypes {
  appUser,
  agent
}

export interface LocalFile extends File {
  lastModifiedDate?: Date;
  lastModified: number;
  checked?: boolean;
  id?: string;
  name: string;
  size: number;
  type: string;
  localThumb?: string;
  isSupportedVideo?: boolean;
  error?: boolean;
  errorType?: EUploadFileError;
  mediaLink?: string;
  thumbMediaLink?: string;
  extension?: string;
  fileType?: {
    name: string;
  };
  uploaded?: boolean;
  canUpload?: boolean;
  localId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  fileList = new BehaviorSubject<AgentFileProp[]>([]);
  private dragDropFileTrigger = new BehaviorSubject<string[]>(['']);
  public dragDropFileTrigger$ = this.dragDropFileTrigger.asObservable();
  public fileTabList = FileTabTypes;
  public listofActiveFiles: BehaviorSubject<any> = new BehaviorSubject(null);
  public currentFileTab: BehaviorSubject<any> = new BehaviorSubject(
    this.fileTabList.appUser
  );
  public documentTypeId: BehaviorSubject<any> = new BehaviorSubject(null);
  public documentTitle: BehaviorSubject<string> = new BehaviorSubject(null);
  public viewDetailFile: BehaviorSubject<any> = new BehaviorSubject(null);
  public reloadTab: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public originalLocalFiles: BehaviorSubject<LocalFile[]> = new BehaviorSubject(
    []
  );
  public dragDropFile: Subject<Event | CdkDragDrop<AgentFileProp[]>> =
    new Subject();
  public listFileUpload = new BehaviorSubject<
    FileUploadProp[] | IHistoryNoteFile[]
  >([]);
  public reloadAttachments: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );

  private attachments$ = new BehaviorSubject<IAttachDocument[]>([]);
  private callFiles$ = new BehaviorSubject<any[]>(null);
  private isSyncWidget = new BehaviorSubject<string | null>(null);

  constructor(private apiService: ApiService) {}

  setSyncedWidget(fileId: string) {
    this.isSyncWidget.next(fileId);
  }

  get getSyncedWidget() {
    return this.isSyncWidget.asObservable();
  }

  get getListFileUpload() {
    return this.listFileUpload;
  }

  set updateListFileUpload(data: FileUploadProp[]) {
    this.listFileUpload.next(data);
  }

  getAttachmentFilesDocument() {
    return this.attachments$.asObservable();
  }

  setAttachmentFilesDocument(data) {
    this.attachments$.next(data?.documents);
  }

  getCallFiles() {
    return this.callFiles$.asObservable();
  }

  setCallFiles(files) {
    this.callFiles$.next(files);
  }

  onFileDragging(currentFileProp: string[]): void {
    this.dragDropFileTrigger.next(currentFileProp);
  }

  convertBase64ToFile = (url: string, name: string, type?: string) => {
    let arr = url.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], name, { type: type || mime });
  };

  updateFileList(propertyId: string, userId: string = null) {
    return this.apiService
      .postAPI(properties, 'list-of-documents', {
        propertyId,
        userId
      })
      .subscribe((res) => {
        if (res) {
          this.listofActiveFiles.next(res);
        }
      });
  }

  syncToPropertyTree({ conversationId, propertyDocumentId, agencyId, taskId }) {
    return this.apiService.postAPI(
      conversations,
      `document/sync-document-to-property-tree`,
      {
        taskId,
        conversationId,
        propertyDocumentId,
        agencyId
      }
    );
  }
  getThumbnailDocument(propertyDocumentIds: string[], mediaLinks) {
    return this.apiService.postAPI(
      conversations,
      `task/generator-preview-of-attachment`,
      {
        propertyDocumentIds,
        mediaLinks
      }
    );
  }
  syncToRentManager({ conversationId, propertyDocumentId, agencyId, taskId }) {
    return this.apiService.postAPI(
      conversations,
      `document/sync-document-to-rm`,
      {
        conversationId,
        taskId,
        propertyDocumentId,
        agencyId
      }
    );
  }

  getFileListInConversation(conversationId: string) {
    return this.apiService.getAPI(
      conversations,
      'property-document-in-histories/' + conversationId
    );
  }

  getListFileConversation(conversationId: string) {
    return this.apiService.getAPI(conversations, 'documents/' + conversationId);
  }

  getFilesByTask(taskId: string) {
    return this.reloadTab
      .asObservable()
      .pipe(
        switchMap(() =>
          this.apiService.getAPI(conversations, 'v2/documents/' + taskId)
        )
      );
  }

  getAttacmentsByTask(taskId: string) {
    return this.apiService.getAPI(conversations, `v2/documents/${taskId}`);
  }

  getConversationCallDocuments(taksId: string) {
    return this.apiService.getAPI(conversations, `v2/call-documents/${taksId}`);
  }

  getFilesTenantReply(taskId: string) {
    return this.apiService.getAPI(
      conversations,
      'pm-portal/get-files-tenant-reply?taskId=' + taskId
    );
  }

  forceDownload(blob, filename) {
    const a = document.createElement('a');
    a.download = filename;
    a.href = blob;
    a.id = 'forceDownload';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  downloadResource(url: string, filename) {
    const splitUrl = url.split('/');
    splitUrl[2] = urlDownloadEnv;
    const downloadUrl = splitUrl.join('/');
    fetch(downloadUrl, {
      headers: new Headers({
        Origin: location.origin
      }),
      mode: 'cors'
    })
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        this.forceDownload(blobUrl, filename);
      })
      .catch((e) => console.error(e));
  }

  updatePropertyDocument(body) {
    return this.apiService.putAPI(
      properties,
      'update-property-document/',
      body
    );
  }

  /*updateListDocument(propertyId, body) {
    return this.apiService.postAPI(properties, 'update-list-of-documents/' + propertyId, body);
  }*/

  getListFileTye() {
    return this.apiService.getAPI(properties, 'list-of-filetype');
  }

  getListPeopleHasFilePermission(propertyDocumentId) {
    return this.apiService.getAPI(
      properties,
      'get-user-property-group-and-file-permission/' + propertyDocumentId
    );
  }

  deleteDocument(propertyDocumentId: string) {
    return this.apiService.deleteAPI(
      properties,
      'delete-document/' + propertyDocumentId
    );
  }

  changeTab(tab: FileTypes) {
    this.currentFileTab.next(tab);
  }

  getFileName(name: string): any {
    const dotPosition = name?.lastIndexOf('.');
    if (dotPosition > -1) {
      return name?.substring(0, dotPosition);
    }
  }

  getFileExtension(name: string): any {
    const dotPosition = name?.lastIndexOf('.');
    if (dotPosition > -1) {
      return name?.substring(dotPosition).toLowerCase();
    }
  }

  getFileExtensionWithoutDot(name: string): any {
    const dotPosition = name?.lastIndexOf('.');
    if (dotPosition > -1) {
      return name?.substring(dotPosition + 1).toLowerCase();
    }
  }

  generateThumbnailVideoName(name: string) {
    const lastDotIndex = name?.lastIndexOf('.');
    const nameBlob = name?.slice(0, lastDotIndex) + '_thumbnail.png';
    return nameBlob || name;
  }

  getFileTypeDot(fileName: string) {
    const fileExtension = this.getFileExtensionWithoutDot(fileName);
    const typeName = this.removeAllDot(listImageTypeDot).includes(fileExtension)
      ? 'photo'
      : this.removeAllDot(listVideoTypeDot).includes(fileExtension)
      ? 'video'
      : this.removeAllDot(listAudioTypeDot).includes(fileExtension)
      ? 'audio'
      : this.removeAllDot(listCalendarTypeDot).includes(fileExtension)
      ? 'calendar'
      : 'file';

    return typeName;
  }

  getFileTypeSlash(typeName: string) {
    if (
      listImageTypeSlash.some((type) => typeName?.toLowerCase().includes(type))
    ) {
      return 'photo';
    }

    if (
      listVideoTypeSlash.some((type) => typeName?.toLowerCase().includes(type))
    ) {
      return 'video';
    }

    if (
      listAudioTypeSlash.some((type) => typeName?.toLowerCase().includes(type))
    ) {
      return 'audio';
    }

    return 'file';
  }

  removeAllDot(data: string[]) {
    return data?.map((item) => item.replace(/\./g, ''));
  }

  generateThumbnailVideo(mediaLink: string) {
    return mediaLink + '#t=5';
  }

  getFileIcon(fileName: string): EAvailableFileIcon | string {
    const fileExtension = this.getFileExtensionWithoutDot(fileName);
    if (fileExtension) {
      if (this.removeAllDot(listImageTypeDot).includes(fileExtension)) {
        return EAvailableFileIcon.Image;
      }

      if (this.removeAllDot(listVideoTypeDot).includes(fileExtension)) {
        return EAvailableFileIcon.Video;
      }

      if (this.removeAllDot(listAudioTypeDot).includes(fileExtension)) {
        return EAvailableFileIcon.voiceMailAudio;
      }

      if (fileExtension === 'pdf') {
        return EAvailableFileIcon.PDF;
      }

      if (fileExtension === 'doc' || fileExtension === 'docx') {
        return EAvailableFileIcon.Doc;
      }

      if (['xls', 'xlsx', 'xlsm'].includes(fileExtension)) {
        return EAvailableFileIcon.Excel;
      }

      if (['ics', 'ical'].includes(fileExtension)) {
        return EAvailableFileIcon.Calendar;
      }
    }

    return EAvailableFileIcon.Other;
  }

  getFileTrudiIcon(fileName: string) {
    switch (this.getFileIcon(fileName)) {
      case EAvailableFileIcon.PDF:
        return 'iconPdf';
      case EAvailableFileIcon.Doc:
        return 'doc';
      case EAvailableFileIcon.Image:
        return 'iconImage';
      case EAvailableFileIcon.Video:
        return 'video';
      default:
        return '';
    }
  }

  getFileType(fileType: string) {
    if (!fileType) {
      return 'other';
    }
    if (fileType.includes('/pdf')) {
      return 'pdf';
    }
    if (fileType.includes('/mp4')) {
      return 'mp4';
    }
    if (fileType.includes('image/')) {
      return 'image';
    }
    if (fileType.includes('video/')) {
      return 'video';
    }
    return 'other';
  }

  getThumbnail(file: any): string {
    if (file.fileTypeDot == 'audio') {
      return '/assets/images/icons/voice-mail.svg';
    }
    if (file.fileTypeDot === 'photo') {
      return file.mediaLink;
    }
    if (file.thumbMediaLink) {
      return file.thumbMediaLink;
    }
    if (file.fileType?.icon) {
      const spl = file.name.split('.');
      const extension = spl[spl.length - 1];
      if (FILE_VALID_TYPE.includes(extension.toLowerCase())) {
        return 'assets/images/icons/' + file.fileType?.icon;
      }
    }
    return '/assets/icon/question-mark.svg';
  }

  filterFileByType(fileTypes: string[], files) {
    if (files?.length) {
      return files?.filter((file) => {
        let fileExtension = file.fileType as string;
        if (file.fileType && typeof file.fileType !== 'string') {
          fileExtension = (file.fileType as FileType).name;
        }
        const mediaType = this.getFileTypeSlash(fileExtension);
        return fileTypes.includes(mediaType);
      });
    } else {
      return [];
    }
  }

  // since File object is read-only so we cloned its properties to normal obj and we can modify those
  getClonedFileArr() {
    return this.originalLocalFiles.value.map((file) => {
      return {
        lastModified: file.lastModified,
        lastModifiedDate: file.lastModifiedDate,
        name: file.name,
        size: file.size,
        type: file.type,
        webkitRelativePath: file.webkitRelativePath,
        icon: this.getFileIcon(file.name),
        checked: !!file.checked,
        id: file.id,
        localThumb: file.localThumb,
        isSupportedVideo: Boolean(file.isSupportedVideo)
      };
    });
  }

  mapFilesUpload(filesUpload: LocalFile[], isHideRemoveIcon = true) {
    return filesUpload.map((fileUpload) => {
      const file =
        fileUpload.lastModified &&
        this.originalLocalFiles.value?.find(
          (localFile) => localFile.lastModified === fileUpload.lastModified
        );
      return {
        '0': file || fileUpload,
        icon: this.getFileIcon(fileUpload?.name || fileUpload?.['fileName']),
        isHideRemoveIcon
      };
    });
  }

  generateThumbnail(videoFile) {
    return new Promise((resolve, reject) => {
      if (this.isNotVideoSupported(videoFile)) resolve(null);
      if (videoFile && videoFile.type.includes('video')) {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const reader = new FileReader();
        reader.onload = function (event) {
          video.src = (event.target.result + '#t=1') as string;
          video.onloadeddata = function () {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(function (blob) {
              const thumbnailFile = new File([blob], 'thumbnail.jpeg', {
                type: 'image/jpeg'
              });
              resolve(thumbnailFile);
            }, 'image/jpeg');
          };
        };
        reader.readAsDataURL(videoFile);
      } else {
        console.error('Please select a video file.');
      }
    });
  }

  isNotVideoSupported(videoFile) {
    return [
      MIME_TYPE_MAPPING['avi'],
      MIME_TYPE_MAPPING['wmv'],
      MIME_TYPE_MAPPING['mov']
    ].find((type) => videoFile.type === type);
  }

  mapInfoListFile(fileList) {
    if (!fileList) return;
    for (let index = 0; index < fileList.length; index++) {
      if (!fileList[index]) return;
      fileList[index].icon = fileList[index].fileType
        ? fileList[index].fileType.icon
        : this.getFileIcon(fileList[index].name);
      fileList[index].fileName = this.getFileName(fileList[index].name);
      fileList[index].extension = this.getFileExtension(fileList[index].name);
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

  async handleProcessingFile(file) {
    const fileExtension = this.getFileExtension(file.name);
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

  mapFileMessageToMessage(currentMess, fileMess) {
    if (fileMess.file && fileMess.file?.fileType && fileMess.isShowFile) {
      switch (this.getFileTypeSlash(fileMess.file?.fileType?.name)) {
        case 'video':
        case 'photo':
        case 'audio':
          currentMess?.files?.mediaList.push({
            ...fileMess.file,
            isShowFile: fileMess.isShowFile,
            messageId: fileMess.id,
            createdAt: fileMess.createdAt
          });
          break;
        case 'file':
          currentMess?.files?.fileList.push({
            ...fileMess.file,
            isShowFile: fileMess.isShowFile,
            messageId: fileMess.id,
            createdAt: fileMess.createdAt
          });
          break;
      }
    } else if (!fileMess.file?.fileType || !fileMess.isShowFile) {
      currentMess?.files?.unSupportedList.push({
        ...fileMess.file,
        isShowFile: true,
        messageId: fileMess.id,
        createdAt: fileMess.createdAt
      });
    }
  }
}
