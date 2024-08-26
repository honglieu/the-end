import { IFile } from '@/app/shared';
import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { IFileComment } from '../utils/comment.interface';

interface IUploadingFiles {
  isUploading: boolean;
  files: IFileComment[];
  isInvalidFiles: boolean;
}
export interface CommentsAttachmentStoreState {
  newCommentFileUpload: IUploadingFiles;
  updateCommentFileUpload: IUploadingFiles;
}

@Injectable()
export class CommentsAttachmentStore extends ComponentStore<CommentsAttachmentStoreState> {
  private newCommentFileUpload$ = this.select(
    (state) => state.newCommentFileUpload
  );
  private updateCommentFileUpload$ = this.select(
    (state) => state.updateCommentFileUpload
  );

  setNewCommentFileUpload = this.updater(
    (state, fileUpload: IUploadingFiles) => ({
      ...state,

      newCommentFileUpload: {
        isUploading: fileUpload.isUploading,
        files: fileUpload.files,
        isInvalidFiles: fileUpload.isInvalidFiles
      }
    })
  );

  setUpdateCommentFileUpload = this.updater(
    (state, fileUpload: IUploadingFiles) => ({
      ...state,

      updateCommentFileUpload: {
        isUploading: fileUpload.isUploading,
        files: fileUpload.files,
        isInvalidFiles: fileUpload.isInvalidFiles
      }
    })
  );

  constructor() {
    super({
      newCommentFileUpload: {
        files: [],
        isUploading: false,
        isInvalidFiles: false
      },
      updateCommentFileUpload: {
        files: [],
        isUploading: false,
        isInvalidFiles: false
      }
    });
  }

  vm$ = this.select({
    newCommentFileUpload: this.newCommentFileUpload$,
    updateCommentFileUpload: this.updateCommentFileUpload$
  });
}
