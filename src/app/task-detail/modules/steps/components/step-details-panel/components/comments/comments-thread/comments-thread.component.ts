import { EPage } from '@/app/shared';
import { CommentsApiService } from '@/app/task-detail/modules/steps/services/comments-api.service';
import { CommentsAttachmentStore } from '@/app/task-detail/modules/steps/services/comments-attachment-store.service';
import { CommentsAttachmentService } from '@/app/task-detail/modules/steps/services/comments-attachment.service';
import { CommentsStore } from '@/app/task-detail/modules/steps/services/comments-store.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ECommentType } from '@/app/task-detail/modules/steps/utils/comment.enum';
import {
  IComment,
  IFileComment,
  IUpdateSyncStatusPayload
} from '@/app/task-detail/modules/steps/utils/comment.interface';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { TrudiConfirmService } from '@trudi-ui';
import { map, Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'comments-thread',
  templateUrl: './comments-thread.component.html',
  styleUrl: './comments-thread.component.scss'
})
export class CommentsThreadComponent implements OnInit, OnDestroy {
  // dependencies
  private commentsStore = inject(CommentsStore);
  private commentsApiService = inject(CommentsApiService);
  private commentsAttachmentService = inject(CommentsAttachmentService);
  private commentsAttachmentStoreService = inject(CommentsAttachmentStore);
  private trudiConfirmService = inject(TrudiConfirmService);
  private stepService = inject(StepService);

  // inputs
  @Input() comment: IComment;
  @Input() commentInNotificationId: number;
  @Input() lastReadFriendlyId: number;

  vm$ = this.commentsStore.vm$;

  uploadedFiles: IFileComment[] = [];

  invalidFile = {
    unSupportFile: false,
    overFileSize: false
  };

  isUploading = false;
  isCancelEdit: boolean = false;

  readonly EPage = EPage;
  readonly ECommentType = ECommentType;

  private destroy$: Subject<void> = new Subject<void>();
  isLoadingComment: boolean;
  navigateFromBell: boolean;

  ngOnInit(): void {
    this.commentsAttachmentStoreService.vm$
      .pipe(
        map((vm) => vm.updateCommentFileUpload),
        takeUntil(this.destroy$)
      )
      .subscribe(({ isUploading, files }) => {
        this.isUploading = isUploading;
        this.updateFiles(files);
      });

    this.commentsStore.vm$
      .pipe(
        map((vm) => vm.isLoading),
        takeUntil(this.destroy$)
      )
      .subscribe((isLoading) => {
        this.isLoadingComment = isLoading;
      });

    this.commentsStore.vm$
      .pipe(
        map((vm) => vm.contextData),
        takeUntil(this.destroy$)
      )
      .subscribe(({ navigateFromBell }) => {
        this.navigateFromBell = navigateFromBell;
      });
  }

  cancelEdit() {
    this.commentsStore.updateEditedCurrentCommentId(null);
    this.commentsAttachmentService.resetTempUpdateFile();
    this.commentsAttachmentStoreService.setUpdateCommentFileUpload({
      files: [],
      isUploading: false,
      isInvalidFiles: false
    });
    this.isCancelEdit = true;
  }

  editComment(commentId: string) {
    this.updateFiles(
      this.comment?.children.map((item) => item.internalNoteFile)
    );
    this.commentsAttachmentService.handleShowFilesForEditComment(
      this.comment?.children.map((item) => item.internalNoteFile)
    );
    this.commentsStore.updateEditedCurrentCommentId(commentId);
  }

  changeSyncStatus = (res: IUpdateSyncStatusPayload) => {
    const foundAttachment = this.comment?.children?.find(
      (item) => item?.internalNoteFile?.id === res?.attachmentId
    )?.internalNoteFile;

    if (foundAttachment) {
      this.comment.children.forEach((comment) => {
        if (foundAttachment?.id === comment.internalNoteFile?.id) {
          comment.internalNoteFile.syncPTStatus = res?.syncPTStatus;
          return;
        }
      });
    }
  };

  confirmDeleteComment(commentId: string) {
    this.stepService.disableTriggerDetailPanel$.next(true);
    const confirmModalConfig = {
      title: `Are you sure you want to delete this comment?`,
      okText: 'Yes, delete',
      cancelText: 'No, keep it',
      subtitle: '',
      colorBtn: 'danger',
      iconName: 'warning',
      closable: false,
      className: 'permanently-delete-modal',
      modelWidth: 510,
      checkboxLabel: '',
      allowCheckbox: false,
      hiddenCancelBtn: false
    };

    this.trudiConfirmService.confirm(confirmModalConfig, (res) => {
      this.stepService.disableTriggerDetailPanel$.next(false);
      if (!!res.result) {
        this.deleteComment(commentId);
      }
    });
  }

  deleteComment(commentId: string) {
    this.commentsApiService.deleteComment(commentId).subscribe((res) => {
      if (res?.messages) {
        this.comment.type = ECommentType.DELETE;
      }
    });
  }

  handleRemoveFile(file) {
    this.commentsAttachmentService.handleRemoveFile(file, 'edit');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateFiles(files: IFileComment[]) {
    this.uploadedFiles = files;
    const invalidFile = this.commentsAttachmentService.validateFiles(files);
    this.invalidFile.unSupportFile = invalidFile.hasUnsupportedFormat;
    this.invalidFile.overFileSize = invalidFile.exceedsMaxSize;
  }
}
