import { TaskService } from '@/app/services';
import { UserService } from '@/app/services/user.service';
import { CommentsAttachmentService } from '@/app/task-detail/modules/steps/services/comments-attachment.service';
import {
  CommentsStore,
  ETypeGetComment
} from '@/app/task-detail/modules/steps/services/comments-store.service';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, map, Subject, takeUntil } from 'rxjs';
import { CommentsAttachmentStore } from '@/app/task-detail/modules/steps/services/comments-attachment-store.service';
import { ActivatedRoute } from '@angular/router';
import { IFileComment } from '@/app/task-detail/modules/steps/utils/comment.interface';

@Component({
  selector: 'comments',
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.scss',
  providers: [CommentsStore, CommentsAttachmentService, CommentsAttachmentStore]
})
export class CommentsComponent implements OnInit, OnDestroy {
  private commentsStoreService = inject(CommentsStore);
  private commentsAttachmentStoreService = inject(CommentsAttachmentStore);
  private userService = inject(UserService);
  private commentsAttachmentService = inject(CommentsAttachmentService);
  private taskService = inject(TaskService);
  private activatedRoute = inject(ActivatedRoute);

  // inputs
  @Input() stepId: string = '';

  uploadedFiles: IFileComment[] = [];

  invalidFile = {
    unSupportFile: false,
    overFileSize: false
  };

  isUploading = false;

  isCreating$ = this.commentsStoreService.vm$.pipe(map((vm) => vm.isCreating));

  private destroy$: Subject<void> = new Subject<void>();

  ngOnInit(): void {
    combineLatest([
      this.activatedRoute.queryParams,
      this.taskService.currentTask$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, task]) => {
        const { id } = task || {};
        const friendlyId = params['friendlyId'] || null;
        this.commentsStoreService.updateContextData({
          stepId: this.stepId,
          taskId: id,
          friendlyId,
          type: ETypeGetComment.AROUND,
          ...(!!friendlyId && { navigateFromBell: true })
        });
      });

    this.userService.userInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.commentsStoreService.updateCurrentUserId(user.id);
      });

    this.commentsAttachmentStoreService.vm$
      .pipe(
        map((vm) => vm.newCommentFileUpload),
        takeUntil(this.destroy$)
      )
      .subscribe(({ isUploading, files }) => {
        this.isUploading = isUploading;
        this.updateFiles(files);
      });
  }

  handleRemoveFile(file) {
    this.commentsAttachmentService.handleRemoveFile(file, 'create');
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
