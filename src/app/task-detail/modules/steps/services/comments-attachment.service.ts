import { FILE_VALID_TYPE, MAX_FILE_SIZE } from '@/app/services/constants';
import { FilesService } from '@/app/services/files.service';
import { FileUploadService } from '@/app/services/fileUpload.service';
import { PropertiesService } from '@/app/services/properties.service';
import { validateFileExtension } from '@/app/shared';
import { inject, Injectable } from '@angular/core';
import uuid4 from 'uuid4';
import { IFileComment } from '../utils/comment.interface';
import { CommentsAttachmentStore } from './comments-attachment-store.service';
import { uniq } from 'lodash-es';

const BYTES_PER_MB = 1024 ** 2;

@Injectable()
export class CommentsAttachmentService {
  // inject dependencies
  private filesService = inject(FilesService);
  private fileUpload = inject(FileUploadService);
  private propertyService = inject(PropertiesService);
  private commentsAttachmentStoreService = inject(CommentsAttachmentStore);

  private tempCreatedFiles: IFileComment[] = [];
  private fileLoadingSelection: IFileComment[] = [];
  private tempUpdatedFiles: IFileComment[] = [];

  public resetTempUpdateFile() {
    this.tempUpdatedFiles = [];
  }

  public resetTempCreatedFiles() {
    this.tempCreatedFiles = [];
  }

  async handleFileSelection(fileList: FileList, action: 'create' | 'edit') {
    const initialFiles = this.prepareFiles(fileList);

    // in case uploading invalid file(s) => update tempFiles so the user can remove
    // the invalid file right away instead of waiting for it to be uploaded
    if (initialFiles.some((file) => file?.isInvalidFile)) {
      if (action === 'create') {
        this.tempCreatedFiles = this.getUniqueFiles(initialFiles, action);
      } else {
        this.tempUpdatedFiles = this.getUniqueFiles(initialFiles, action);
      }
    }

    this.fileLoadingSelection = [...this.fileLoadingSelection, ...initialFiles];
    // show loading before upload
    this.updateUIFiles(
      this.getUniqueFiles(this.fileLoadingSelection, action),
      action
    );

    // upload files to server
    const uploadedFiles = await this.handleUploadFileToS3(
      initialFiles,
      this.propertyService.currentPropertyId.value
    );

    const modifiedFiles = initialFiles.some((file) => file?.isInvalidFile)
      ? // in case invalid file(s) above => since the tempFiles is set before the uploading is completed
        // we need to get the newest fields value (uploaded, canUpload) from uploadedFiles
        // with invalid file(s) => keep its current value
        this.getFiles(action).map((file) => {
          const foundElement = uploadedFiles.find(
            (uploadedFile) =>
              uploadedFile?.localId === file?.localId && !file?.isInvalidFile
          );
          return foundElement ?? file;
        })
      : uploadedFiles;

    // update files after upload
    this.handleFilesAfterUploadFiles(modifiedFiles, action);
  }

  async handleShowFilesForEditComment(files) {
    this.resetTempUpdateFile();
    const initialFiles = this.prepareFiles(files, true);
    this.tempUpdatedFiles = [...this.getFiles('edit'), ...initialFiles];
    this.commentsAttachmentStoreService.setUpdateCommentFileUpload({
      isUploading: false,
      files: this.tempUpdatedFiles,
      isInvalidFiles:
        this.containsOversizedFile(files) ||
        this.containsUnsupportedFileFormat(files)
    });
  }

  handleRemoveFile(file: IFileComment, action: 'create' | 'edit') {
    const updatedFiles = this.getFiles(action).filter(
      (f) =>
        (file?.localId && f?.localId !== file?.localId) || f?.id !== file?.id
    );
    if (this.fileLoadingSelection?.length) {
      this.handleUpdateLoadingFile(updatedFiles, action);
      return;
    }
    this.updateFiles(updatedFiles, action);
  }

  handleUpdateLoadingFile(updatedFiles, action: 'create' | 'edit') {
    const tempFiles = updatedFiles;
    if (action === 'create') {
      this.tempCreatedFiles = updatedFiles;
    } else {
      this.tempUpdatedFiles = updatedFiles;
    }
    this.fileLoadingSelection = updatedFiles;
    this.updateUIFiles(tempFiles, action);
  }

  validateFiles(files: IFileComment[]) {
    if (!files.length) {
      return { hasUnsupportedFormat: false, exceedsMaxSize: false };
    }
    const hasUnsupportedFormat = this.containsUnsupportedFileFormat(files);
    const exceedsMaxSize = this.containsOversizedFile(files);
    return { hasUnsupportedFormat, exceedsMaxSize };
  }

  private getFiles(action: 'create' | 'edit'): IFileComment[] {
    return action === 'create' ? this.tempCreatedFiles : this.tempUpdatedFiles;
  }

  private updateFiles(files: IFileComment[], action: 'create' | 'edit') {
    if (action === 'create') {
      this.tempCreatedFiles = files;
      this.commentsAttachmentStoreService.setNewCommentFileUpload({
        isUploading: false,
        files,
        isInvalidFiles:
          this.containsOversizedFile(files) ||
          this.containsUnsupportedFileFormat(files)
      });
    } else {
      this.tempUpdatedFiles = files;
      this.commentsAttachmentStoreService.setUpdateCommentFileUpload({
        isUploading: false,
        files,
        isInvalidFiles:
          this.containsOversizedFile(files) ||
          this.containsUnsupportedFileFormat(files)
      });
    }
  }

  // Update UI with temporary data without saving to state variables
  private updateUIFiles(files: IFileComment[], action: 'create' | 'edit') {
    if (action === 'create') {
      this.commentsAttachmentStoreService.setNewCommentFileUpload({
        isUploading: true,
        files,
        isInvalidFiles:
          this.containsOversizedFile(files) ||
          this.containsUnsupportedFileFormat(files)
      });
    } else {
      this.commentsAttachmentStoreService.setUpdateCommentFileUpload({
        isUploading: true,
        files,
        isInvalidFiles:
          this.containsOversizedFile(files) ||
          this.containsUnsupportedFileFormat(files)
      });
    }
  }

  private isFileUploadable(file) {
    const isValidFileExtension = validateFileExtension(file, FILE_VALID_TYPE);
    const isValidFileSize = file.size / BYTES_PER_MB <= MAX_FILE_SIZE;
    return isValidFileExtension && isValidFileSize;
  }

  private prepareFiles(
    files: FileList,
    isUploaded: boolean = false
  ): IFileComment[] {
    return Array.from(files).map((file) => ({
      file,
      size: file.size,
      type: file.type,
      name: file.name,
      id: file?.['id'],
      localId: uuid4(),
      uploaded: isUploaded,
      mediaLink: file?.['mediaLink'],
      syncPTStatus: file?.['syncPTStatus'],
      canUpload: this.isFileUploadable(file),
      mediaType: this.filesService.getFileTypeSlash(file.type),
      fileName: file.name,
      isInvalidFile:
        this.containsOversizedFile([file as unknown as IFileComment]) ||
        this.containsUnsupportedFileFormat([file as unknown as IFileComment])
    }));
  }

  private containsUnsupportedFileFormat(files: IFileComment[]) {
    return files?.some(
      (item) =>
        !validateFileExtension(item?.file || item[0] || item, FILE_VALID_TYPE)
    );
  }

  private containsOversizedFile(files: IFileComment[]) {
    return files?.some(
      (item) => (item[0]?.size || item.size) / BYTES_PER_MB > MAX_FILE_SIZE
    );
  }

  private async handleUploadFileToS3(
    files: IFileComment[],
    propertyId: string
  ) {
    const newFiles: IFileComment[] = await Promise.all(
      files.map((file) => this.uploadFile(file, propertyId))
    );

    return newFiles;
  }

  private async uploadFile(file: IFileComment, propertyId: string) {
    if (file.mediaLink || !file.canUpload || file.uploaded) {
      return file;
    }

    const { Location } = await this.fileUpload.uploadFile2(
      file.file,
      propertyId
    );

    return {
      ...file,
      canUpload: true,
      uploaded: true,
      mediaLink: Location
    };
  }

  private handleFilesAfterUploadFiles(
    uploadedFileList: IFileComment[],
    action: 'create' | 'edit'
  ) {
    this.fileLoadingSelection = this.fileLoadingSelection.filter(
      (file) =>
        !uploadedFileList.some(
          (fileUploaded) => fileUploaded.localId === file.localId
        )
    );
    if (this.fileLoadingSelection.length) {
      // update files after upload
      this.updateFiles(this.getUniqueFiles(uploadedFileList, action), action);

      // update files still loading
      this.updateUIFiles(
        this.getUniqueFiles(this.fileLoadingSelection, action),
        action
      );
      return;
    }
    // update files after upload
    this.updateFiles(this.getUniqueFiles(uploadedFileList, action), action);
  }

  private getUniqueFiles = (
    targetFileList: IFileComment[],
    action: 'create' | 'edit'
  ) => {
    return uniq(
      [...this.getFiles(action), ...targetFileList].map((defaultFile) => {
        const foundElement = targetFileList.find(
          (targetFile) =>
            targetFile?.localId === defaultFile?.localId &&
            targetFile?.canUpload &&
            targetFile?.uploaded
        );
        return foundElement ?? defaultFile;
      })
    );
  };
}
