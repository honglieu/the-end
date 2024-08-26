import {
  IComment,
  ICommentQueryParam,
  ICommentRequest,
  ICommentResponse
} from '@/app/task-detail/modules/steps/utils/comment.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { concatMap, exhaustMap, Observable, switchMap, tap } from 'rxjs';
import { CommentsApiService } from './comments-api.service';
import dayjs from 'dayjs';
import { ToastrService } from 'ngx-toastr';

export interface IContextData {
  stepId?: string;
  taskId?: string;
  friendlyId?: string;
  maxId?: string;
  minId?: string;
  type?: ETypeGetComment;
  existNoteAfter?: boolean;
  existNoteBefore?: boolean;
  lastReadFriendlyId?: number;
  navigateFromBell?: boolean;
}

export enum ETypeGetComment {
  AROUND = 'AROUND',
  BEFORE = 'BEFORE',
  AFTER = 'AFTER'
}
export interface CommentsComponentState {
  isLoading: boolean;
  error: string | null;
  commentThreads: IComment[];
  currentUserId: string;
  contextData: IContextData;
  editedCurrentCommentId: string | null;
  isFetching: boolean;
  isCreating: boolean;
  isUpdating: boolean;
}

interface ICommentPostBody {
  payload: ICommentRequest;
  assignedMessage: string;
}

@Injectable()
export class CommentsStore extends ComponentStore<CommentsComponentState> {
  // dependencies
  private commentApiService = inject(CommentsApiService);
  private toastService = inject(ToastrService);

  private isLoading$ = this.select((state) => state.isLoading);
  private error$ = this.select((state) => state.error);
  private commentThreads$ = this.select((state) => state.commentThreads);
  private contextData$ = this.select((state) => state.contextData);
  private currentUserId$ = this.select((state) => state.currentUserId);
  private editedCurrentCommentId$ = this.select(
    (state) => state.editedCurrentCommentId
  );
  private isFetching$ = this.select((state) => state.isFetching);
  private isCreating$ = this.select((state) => state.isCreating);
  private isUpdating$ = this.select((state) => state.isUpdating);

  private isFirstRender = true;

  setIsLoading = this.updater((state) => ({ ...state, isLoading: true }));

  setIsFetching = this.updater((state) => ({ ...state, isFetching: true }));

  setIsCreating = this.updater((state) => ({ ...state, isCreating: true }));

  setIsUpdating = this.updater((state) => ({ ...state, isUpdating: true }));

  setError = this.updater((state, error: HttpErrorResponse) => ({
    ...state,
    isLoading: false,
    isFetching: false,
    isCreating: false,
    isUpdating: false,
    createOrUpdateSuccess: error.message
  }));

  addCommentThreads = this.updater((state, commentThreads: IComment[]) => {
    return {
      ...state,
      isLoading: false,
      isFetching: false,
      isCreating: false,
      isUpdating: false,
      commentThreads: this.sortNotesByFriendlyId(state, commentThreads)
    };
  });

  addCommentThread = this.updater((state, commentThread: IComment) => ({
    ...state,
    isLoading: false,
    isFetching: false,
    isCreating: false,
    isUpdating: false,
    commentThreads: [commentThread, ...state.commentThreads]
  }));

  updateCommentThreads = this.updater((state, commentThread: IComment) => ({
    ...state,
    isLoading: false,
    isFetching: false,
    isCreating: false,
    isUpdating: false,
    commentThreads: state.commentThreads.map((thread) =>
      thread.id === commentThread.id
        ? { ...commentThread, isNewComment: true }
        : thread
    )
  }));

  updateContextData = this.updater((state, contextData: IContextData) => ({
    ...state,
    isLoading: false,
    isFetching: false,
    isCreating: false,
    isUpdating: false,
    contextData: {
      ...state.contextData,
      ...contextData
    }
  }));

  updateCurrentUserId = this.updater((state, currentUserId: string) => ({
    ...state,
    isLoading: false,
    isFetching: false,
    isCreating: false,
    isUpdating: false,
    currentUserId
  }));

  updateEditedCurrentCommentId = this.updater(
    (state, editedCurrentCommentId: string | null) => ({
      ...state,
      isLoading: false,
      isFetching: false,
      isCreating: false,
      isUpdating: false,
      editedCurrentCommentId
    })
  );

  constructor() {
    super({
      isLoading: false,
      error: null,
      commentThreads: [],
      currentUserId: '',
      contextData: {
        stepId: '',
        taskId: '',
        type: null,
        minId: '',
        maxId: '',
        friendlyId: '',
        navigateFromBell: false
      },
      editedCurrentCommentId: null,
      isFetching: false,
      isCreating: false,
      isUpdating: false
    });
  }

  vm$ = this.select({
    isLoading: this.isLoading$,
    error: this.error$,
    commentThreads: this.commentThreads$,
    contextData: this.contextData$,
    currentUserId: this.currentUserId$,
    editedCurrentCommentId: this.editedCurrentCommentId$,
    isFetching: this.isFetching$,
    isCreating: this.isCreating$,
    isUpdating: this.isUpdating$
  });

  setContextData(response) {
    const { previous, next, data, lastReadFriendlyId } = response || {};
    this.patchState((state) => {
      const { maxId, minId } = state.contextData || {};
      const updatedContextData: Partial<IContextData> = {};
      updatedContextData.lastReadFriendlyId = lastReadFriendlyId;

      if (data[0].friendlyId > maxId || !maxId) {
        updatedContextData.maxId = data[0].friendlyId;
        updatedContextData.existNoteAfter = !!next;
      }
      if (data[data.length - 1].friendlyId < minId || !minId) {
        updatedContextData.minId = data[data.length - 1].friendlyId;
        updatedContextData.existNoteBefore = !!previous;
      }

      return {
        contextData: {
          ...state.contextData,
          ...updatedContextData
        }
      };
    });
  }

  sortNotesByFriendlyId(state, commentThreads) {
    return [...state.commentThreads, ...commentThreads].sort(
      (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
    );
  }

  getCommentThreads = this.effect(
    (queryParams$: Observable<ICommentQueryParam>) => {
      return queryParams$.pipe(
        tap(() => {
          if (this.isFirstRender) {
            this.setIsLoading();
            this.isFirstRender = false;
          } else {
            this.setIsFetching();
          }
        }),
        switchMap((queryParams) => {
          return this.commentApiService.getComments(queryParams).pipe(
            tapResponse(
              (res: ICommentResponse) => {
                this.setContextData(res);
                this.addCommentThreads(res.data);
              },
              (error: HttpErrorResponse) => this.setError(error)
            )
          );
        })
      );
    }
  );

  createCommentThread = this.effect(
    (request$: Observable<ICommentPostBody>) => {
      return request$.pipe(
        tap(() => {
          this.setIsCreating();
        }),
        concatMap(({ payload, assignedMessage }) => {
          return this.commentApiService.createComment(payload).pipe(
            tapResponse(
              (thread: IComment) => {
                const comment = {
                  ...thread,
                  isNewComment: true
                };
                this.addCommentThread(comment);
                if (assignedMessage) this.toastService.info(assignedMessage);
              },
              (error: HttpErrorResponse) => this.setError(error)
            )
          );
        })
      );
    }
  );

  updateCommentThread = this.effect(
    (request$: Observable<ICommentPostBody>) => {
      return request$.pipe(
        tap(() => {
          this.setIsUpdating();
        }),
        exhaustMap(({ payload, assignedMessage }) => {
          return this.commentApiService.updateComment(payload).pipe(
            tapResponse(
              (thread: IComment) => {
                this.updateCommentThreads(thread);
                this.updateEditedCurrentCommentId(null);
                if (assignedMessage) this.toastService.info(assignedMessage);
              },
              (error: HttpErrorResponse) => {
                this.setError(error);
                this.updateEditedCurrentCommentId(null);
              }
            )
          );
        })
      );
    }
  );
}
