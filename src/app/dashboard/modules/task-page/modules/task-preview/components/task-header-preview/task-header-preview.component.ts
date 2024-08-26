import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { TrudiTextFieldComponent } from '@trudi-ui';
import { EConversationType, EPropertyStatus } from '@shared/enum';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { Property } from '@/app/shared/types';

@Component({
  selector: 'task-header-preview',
  templateUrl: './task-header-preview.component.html',
  styleUrls: ['./task-header-preview.component.scss']
})
export class TaskHeaderPreviewComponent implements OnInit, OnChanges {
  @ViewChild('trudiTextField') taskNameInputEl: TrudiTextFieldComponent;
  @Input() titleTaskPreview: string = '';
  @Input() property?: Partial<Property>;
  @Input() taskId: string = '';
  @Input() conversationType: EConversationType;
  @Output() handleChangeTitleTask = new EventEmitter();
  @Output() handleOpenPropertyProfile = new EventEmitter();
  public isEditTitle: boolean = false;
  public isArchiveMailbox: boolean = false;
  public titleBeforeChange: string = '';
  public isConsole: boolean = false;
  public TrudiButtonEnumStatus = TrudiButtonEnumStatus;
  public readonly EPropertyStatus = EPropertyStatus;
  public readonly EButtonType = EButtonType;
  public readonly EButtonTask = EButtonTask;
  private destroy$ = new Subject();
  title = new FormControl(null, [
    Validators.required,
    Validators.pattern(/^(?!^\s+$)^[\s\S]*$/)
  ]);
  constructor(
    private taskService: TaskService,
    private router: Router,
    private agencyService: AgencyService,
    public sharedService: SharedService,
    private inboxService: InboxService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['titleTaskPreview']?.currentValue) {
      this.title.setValue(this.titleTaskPreview);
      this.titleBeforeChange = this.titleTaskPreview;
    }
  }
  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isArchiveMailbox: boolean) =>
          (this.isArchiveMailbox = isArchiveMailbox)
      );
  }

  get taskTitle() {
    return this.title?.value.trim();
  }

  onEditTitle() {
    this.isEditTitle = true;
    if (this.taskNameInputEl) {
      this.taskNameInputEl.inputElem.nativeElement.focus();
    }
  }

  saveEditTitle() {
    this.isEditTitle = false;
    if (!this.title.value || this.title.value === this.titleBeforeChange)
      return;
    this.title.setValue(this.taskTitle);
    this.handleChangeTitleTask.emit({
      taskId: this.taskId,
      title: this.taskTitle
    });
    this.taskService
      .updateTaskTitle(this.taskId, this.taskTitle, this.taskTitle)
      .subscribe((res) => {
        if (res) {
          this.titleBeforeChange = this.taskTitle;
        }
      });
  }

  cancelEditTitle() {
    this.title.setValue(this.titleBeforeChange);
    this.isEditTitle = false;
  }

  navigateToTaskDetail() {
    this.inboxService.setChangeUnreadData(null);
    this.router.navigate(['dashboard', 'inbox', 'detail', this.taskId], {
      queryParams: {
        type: 'TASK',
        conversationType: this.conversationType
      },
      queryParamsHandling: 'merge'
    });
  }

  openPropertyProfile(): void {
    const { id, status } = this.property || {};
    if (status === EPropertyStatus.deleted || !id) return;
    this.handleOpenPropertyProfile.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
