import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { TaskService } from '@services/task.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { UserConversation } from '@shared/types/conversation.interface';
import { TaskItem, TaskList } from '@shared/types/task.interface';
import { ToastrService } from 'ngx-toastr';
import { AgencyService } from '@services/agency.service';
import { MESSAGE_MOVED_TO_TASK } from '@services/messages.constants';
import { stringFormat } from '@core';
import { AppRoute } from '@/app/app.route';

@Component({
  selector: 'app-move-mess-to-different-task',
  templateUrl: './move-mess-to-different-task.component.html',
  styleUrls: ['./move-mess-to-different-task.component.scss']
})
export class MoveMessToDifferentComponent implements OnInit {
  @ViewChild('options') private options: ElementRef;
  @Input() show: boolean;
  @Input() items: TaskList;
  @Input() isUnHappyPath: boolean;
  @Input() conversationId: string;
  @Input() isShowAddress: boolean = false;
  @Output() isQuitModal = new EventEmitter<boolean>();

  private unsubscribe = new Subject<void>();
  public currentConversation: UserConversation;
  public disabledMoveToTaskBtn: boolean = false;
  public currentProperty: any = {};
  selectedTask: string;
  isMissingRequiredField: boolean = false;
  isSupplierOrOther = false;
  public propertyType = EUserPropertyType;

  constructor(
    private taskService: TaskService,
    private conversationService: ConversationService,
    private readonly elr: ElementRef,
    public propertiesService: PropertiesService,
    private route: ActivatedRoute,
    private toastService: ToastrService,
    private router: Router,
    private agencyService: AgencyService
  ) {}

  ngOnInit(): void {
    this.conversationService.currentConversation.subscribe((res) => {
      if (res) this.currentConversation = res;
      this.isSupplierOrOther =
        res?.propertyType === EUserPropertyType.SUPPLIER ||
        res?.propertyType === EUserPropertyType.OTHER;
    });
    this.propertiesService.newCurrentProperty.subscribe((res) => {
      if (res) this.currentProperty = res;
    });
  }

  ngOnChanges() {
    if (this.items && this.conversationId) {
      const searchInput = this.elr.nativeElement.querySelector(
        '.move-select#task-select ng-select input'
      );
      if (searchInput) searchInput.value = '';
    }
  }

  onSubmit() {
    if (this.selectedTask) {
      this.disabledMoveToTaskBtn = true;
      this.isMissingRequiredField = false;
      this.taskService
        .moveMessToDifferentTask(
          this.taskService.currentTaskId$.getValue(),
          this.selectedTask,
          this.conversationService.currentConversation.getValue().id,
          this.isUnHappyPath
        )
        .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res) {
            this.disabledMoveToTaskBtn = false;
            this.taskService.updateTaskItems$.next({
              listTaskId: [
                this.taskService.currentTaskId$.getValue(),
                this.selectedTask
              ]
            });
            this.router.navigate([
              stringFormat(AppRoute.TASK_DETAIL, this.selectedTask)
            ]);
            this.toastService.success(MESSAGE_MOVED_TO_TASK);
            this.onQuitModal();
          }
        });
    } else {
      this.isMissingRequiredField = true;
    }
  }

  onItemChange(event: TaskItem) {
    this.selectedTask = event?.id;
  }

  onQuitModal(e?: Event) {
    e?.stopPropagation();
    this.isQuitModal.emit();
    this.selectedTask = null;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
