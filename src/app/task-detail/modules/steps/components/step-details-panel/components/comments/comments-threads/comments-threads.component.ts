import {
  CommentsStore,
  ETypeGetComment
} from '@/app/task-detail/modules/steps/services/comments-store.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ICommentQueryParam } from '@/app/task-detail/modules/steps/utils/comment.interface';
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, map, Subject, switchMap, tap } from 'rxjs';

enum EScrollDirection {
  UP = 'UP',
  DOWN = 'DOWN'
}

@Component({
  selector: 'comments-threads',
  templateUrl: './comments-threads.component.html',
  styleUrl: './comments-threads.component.scss'
})
export class CommentsThreadsComponent implements OnInit, OnDestroy {
  @ViewChild('commentThreadsElement') commentThreadsElement: ElementRef;

  // dependencies
  private commentsStore = inject(CommentsStore);
  private stepService = inject(StepService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  // properties
  contextData = {
    minId: '',
    maxId: '',
    existNoteAfter: false,
    existNoteBefore: false,
    stepId: '',
    taskId: '',
    lastReadFriendlyId: 0
  };

  queryParams: ICommentQueryParam = {
    limit: 20,
    stepId: '',
    taskId: ''
  };

  skeletonArray = Array(5).fill(0);

  EScrollDirection = EScrollDirection;
  scrollDirection: EScrollDirection = EScrollDirection.DOWN;

  vm$ = this.commentsStore.vm$;

  private destroy$ = new Subject<void>();
  isLoading: boolean;
  commentInNotificationId: number;
  // Using isFirstRender to check and auto-scroll only on the first render
  isFirstRender: boolean = true;
  private timeoutIds: NodeJS.Timeout[] = [];

  ngOnInit(): void {
    this.vm$
      .pipe(
        map((vm) => vm.contextData),
        tap(
          ({
            stepId,
            taskId,
            type,
            friendlyId,
            minId,
            maxId,
            existNoteAfter,
            existNoteBefore,
            lastReadFriendlyId
          }) => {
            this.queryParams = {
              ...this.queryParams,
              stepId,
              taskId,
              type,
              friendlyId
            };

            this.contextData = {
              minId,
              maxId,
              existNoteAfter,
              existNoteBefore,
              stepId,
              taskId,
              lastReadFriendlyId
            };
          }
        )
      )
      .subscribe();

    this.commentsStore.getCommentThreads(this.queryParams);
    this.vm$
      .pipe(
        map((vm) => vm.isLoading),
        switchMap((isLoading) => {
          if (isLoading) return EMPTY;
          return this.activatedRoute.queryParams;
        })
      )
      .subscribe((params) => {
        this.handleScrollToComment(
          params['friendlyId'] || this.contextData.lastReadFriendlyId
        );
        this.commentInNotificationId = +params['friendlyId'];
      });
  }

  removeStepIdAfterNavigate() {
    // delay 3 seconds to display the highlight and then remove it from the URL.
    const id = setTimeout(() => {
      this.router.navigate([], {
        queryParams: {
          stepId: null,
          friendlyId: null
        },
        queryParamsHandling: 'merge'
      });
    }, 3000);
    this.timeoutIds.push(id);
  }

  handleScrollToComment(currentNoteViewed) {
    const id = setTimeout(() => {
      const currentNoteViewedEle =
        this.getCurrentNoteViewedElement(currentNoteViewed);
      if (!currentNoteViewedEle || !this.isFirstRender) return;
      currentNoteViewedEle.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
      this.isFirstRender = false;
      this.removeStepIdAfterNavigate();
    }, 0);
    this.timeoutIds.push(id);
  }

  getCurrentNoteViewedElement(currentNoteViewed) {
    return this.commentThreadsElement.nativeElement?.querySelector(
      `#${'item_' + currentNoteViewed}`
    );
  }

  onScroll() {
    // Set the collapse summary state based on the scroll position
    // If scrolled to the top, show the summary (set to true)
    // If not scrolled to the top, hide the summary (set to false)
    this.stepService.setCollapseSummary(
      this.commentThreadsElement.nativeElement?.scrollTop === 0
    );
  }

  onScrollDown() {
    if (this.contextData.existNoteBefore) {
      this.commentsStore.updateContextData({
        friendlyId: this.contextData.minId,
        type: ETypeGetComment.BEFORE,
        ...this.contextData
      });
      this.scrollDirection = EScrollDirection.DOWN;
      this.commentsStore.getCommentThreads(this.queryParams);
    }
  }

  onScrollToUp() {
    if (this.contextData.existNoteAfter) {
      this.commentsStore.updateContextData({
        friendlyId: this.contextData.maxId,
        type: ETypeGetComment.AFTER,
        ...this.contextData
      });
      this.scrollDirection = EScrollDirection.UP;
      this.commentsStore.getCommentThreads(this.queryParams);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timeoutIds.forEach((id) => clearTimeout(id));
  }
}
