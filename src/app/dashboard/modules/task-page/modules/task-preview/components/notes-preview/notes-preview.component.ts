import { mapUsersToName } from '@core';
import {
  Component,
  OnInit,
  OnChanges,
  Input,
  SimpleChanges
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { displayName } from '@shared/feature/function.feature';
import { ITaskPreview } from '@shared/types/task.interface';
import { IUserParticipant } from '@shared/types/user.interface';
import { ENoteType } from '@/app/task-detail/modules/internal-note/utils/internal-note.enum';
@Component({
  selector: 'notes-preview',
  templateUrl: './notes-preview.component.html',
  styleUrls: ['./notes-preview.component.scss']
})
export class NotesPreviewComponent implements OnInit, OnChanges {
  private destroy$ = new Subject<void>();
  @Input() taskPreview: ITaskPreview;
  public noteMessage: string;
  public joinedPmNames: string;
  public currentTaskId: string;
  public ENoteType = ENoteType;
  constructor(private router: Router, private activeRouter: ActivatedRoute) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.['taskPreview']) {
      this.handleMapDataOfNote();
    }
  }

  ngOnInit(): void {
    this.activeRouter.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.currentTaskId = res?.[ETaskQueryParams.TASK_ID];
      });
  }

  handleMapDataOfNote() {
    let contentMessage: string;
    if (
      this.taskPreview?.internalNotes?.latestNoteData?.type === ENoteType.CARD
    ) {
      const { firstName, lastName } = this.taskPreview?.internalNotes
        ?.latestNoteData?.contentData as IUserParticipant;
      contentMessage = [firstName, lastName].filter(Boolean).join(' ');
    } else {
      contentMessage = this.taskPreview?.internalNotes?.latestNoteData
        ?.contentData as string;
    }
    this.noteMessage = mapUsersToName(
      contentMessage,
      this.taskPreview?.internalNotes?.latestNoteData?.mentionsUsers
    );

    if (this.taskPreview?.internalNotes) {
      this.taskPreview.internalNotes.totalAttachments = parseInt(
        (this.taskPreview.internalNotes?.totalAttachments as string) || ''
      );
    }

    this.joinedPmNames = this.taskPreview.internalNotes?.noteParticipants
      .map((user) => {
        return displayName(user.firstName, user.lastName).trim();
      })
      .join(', ');
  }

  handleNavigateTaskDetail() {
    this.router.navigate(
      ['dashboard', 'inbox', 'detail', this.taskPreview.id, 'internal-note'],
      {
        queryParams: {
          type: 'TASK'
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
