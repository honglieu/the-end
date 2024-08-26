import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  FILE_VALID_TYPE,
  listFileDisplayThumbnail,
  MAX_FILE_SIZE
} from '@/app/services/constants';
import { Component, OnInit, ViewChild } from '@angular/core';
import { WidgetType } from '@shared/enum/widget.enum';
import { FilesComponent } from '@/app/task-detail/modules/sidebar-right/components/files/files.component';
import {
  getThumbnailForVideo,
  validateFileExtension
} from '@/app/shared/feature/function.feature';
import { FilesService } from '@/app/services/files.service';
import uuid4 from 'uuid4';
import { FileUploadService } from '@/app/services/fileUpload.service';
import { TaskService } from '@/app/services/task.service';
import { WidgetAttachmentApiService } from './services/widget-attachment-api.service';
export interface IFile extends File {
  id: string;
  canUpload: boolean;
  uploaded: boolean;
  invalidFile: boolean;
  overFileSize: boolean;
  mediaLink: string;
  localThumb: string;
  isSupportedVideo: boolean;
  propertyId: string;
}
@Component({
  selector: 'widget-attachments',
  templateUrl: './widget-attachments.component.html',
  styleUrls: ['./widget-attachments.component.scss'],
  providers: [WidgetAttachmentApiService]
})
export class WidgetAttachmentsComponent implements OnInit {
  @ViewChild('filePanel') filePanel: FilesComponent;
  public isExpandAttachments: boolean = true;

  public widgetType = WidgetType;
  public itemsCounts = 0;

  public paragraph: object = { rows: 0 };
  public isLoading: boolean = false;
  public isStopAudio: boolean;
  public ACCEPT_ONLY_SUPPORTED_FILE = ACCEPT_ONLY_SUPPORTED_FILE;

  constructor(
    private filesService: FilesService,
    private fileUploadService: FileUploadService,
    private widgetAttachmentApiService: WidgetAttachmentApiService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {}

  async fileBrowseHandler(event) {
    const { property, id } = this.taskService.currentTask$.getValue() || {};
    if (!event.target?.files) return;
    const length = event.target.files.length;
    let files: IFile[] = [];
    for (let index = 0; index < length; index++) {
      const file = event.target.files[index];
      const processedFile: IFile = await this.processFile(file);
      if (processedFile) {
        const validFileType = validateFileExtension(
          processedFile,
          FILE_VALID_TYPE
        );
        const isOverFileSize = processedFile.size / 1024 ** 2 > MAX_FILE_SIZE;
        processedFile.id = uuid4();
        processedFile.propertyId = property?.id;
        processedFile.uploaded = false;
        processedFile.canUpload = !isOverFileSize && validFileType;
        processedFile.invalidFile = !validFileType;
        processedFile.overFileSize = isOverFileSize;
        files.push(processedFile);
      }
    }
    this.filePanel.addAttachmentsToTask(files);
    const afterUploadedFilesToS3 = await this.handleUploadFileToS3(
      [...files.filter((f) => f.canUpload)],
      property?.id
    );

    if (afterUploadedFilesToS3.length) {
      this.widgetAttachmentApiService
        .linkAttachmentToTask(
          this.getUploadFilePayload(afterUploadedFilesToS3),
          id,
          this.taskService.currentTask$.getValue().property.id
        )
        .subscribe(() => {
          this.filesService.reloadAttachments.next(true);
        });
    }
    event.target.value = null;
  }

  getUploadFilePayload(files) {
    return files.map((f) => {
      return {
        title: f.name,
        fileName: f.name,
        fileType: f.type,
        fileSize: f.size,
        mediaLink: f.mediaLink
      };
    });
  }

  async handleUploadFileToS3(files: IFile[], propertyId) {
    const newFiles: IFile[] = [];
    for (let index = 0; index < files.length; index++) {
      const newFile = files[index];
      const data = await this.fileUploadService.uploadFile2(
        newFile,
        propertyId
      );
      newFile.canUpload = true;
      newFile.uploaded = true;
      newFile.mediaLink = data.Location;
      newFiles.push(newFile);
    }
    return newFiles;
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

  onLoadingFilePanel(value: boolean) {
    this.isLoading = value;
  }

  onActiveChange(event) {
    this.isStopAudio = event;
  }
}
