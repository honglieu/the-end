import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { TaskService } from '@services/task.service';
import { TaskItem } from '@shared/types/task.interface';
import { UserService } from '@services/user.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { TIME_FORMAT } from '@services/constants';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Component({
  selector: 'task-ticket',
  templateUrl: './task-ticket.component.html',
  styleUrls: ['./task-ticket.component.scss']
})
export class TaskTicketComponent implements OnInit, OnChanges {
  @Input() item: any;
  @Input() openFrom: 'task-area' | 'trudi-area';
  @Input() changeText: boolean;
  @Output() forward = new EventEmitter<{ status: boolean; item: TaskItem }>();
  @Output() textTicket = new EventEmitter<string>(null);

  public description: string = '';
  public isEditing = false;
  public ticketEditForm: FormGroup;

  TIME_FORMAT = TIME_FORMAT;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;

  constructor(
    public taskService: TaskService,
    public userService: UserService,
    private filesService: FilesService,
    private conversationService: ConversationService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.isEditing = false;
    if (!changes['item']?.currentValue) return;
    if (this.item && this.item?.options) {
      if (this.openFrom === 'task-area') {
        this.description = JSON.parse(this.item?.options)?.text;
      } else if (this.openFrom === 'trudi-area') {
        this.description = this.item?.options?.text;
      }
    } else {
      this.description = this.item?.message;
    }
    this.item.type = this.item?.type?.toUpperCase();
  }

  ngOnInit(): void {
    this.ticketEditForm = new FormGroup({
      description: new FormControl('', Validators.required)
    });
  }

  showSelectPeople(status: boolean, item: TaskItem) {
    this.forward.emit({ status, item });
  }

  openEdit() {
    this.isEditing = true;
    this.setDescriptionValue(this.description);
  }

  onSaveEdit() {
    if (this.changeText) {
      const bodyEdit = {
        conversationId:
          this.conversationService.trudiResponseConversation.getValue().id,
        note: this.getDescription.value
      };
      this.conversationService.editTicketNote(bodyEdit).subscribe((res) => {
        this.conversationService.trudiResponseConversation.next({
          ...this.conversationService.trudiResponseConversation.getValue(),
          trudiResponse: res
        });
        this.description = this.getDescription.value;
        this.isEditing = false;
      });
    } else {
      this.description = this.getDescription.value;
      this.isEditing = false;
      this.textTicket.emit(this.getDescription.value);
    }
  }

  onCancelEdit() {
    this.isEditing = false;
  }

  setDescriptionValue(value): void {
    this.ticketEditForm.get('description').setValue(value);
  }

  get getDescription() {
    return this.ticketEditForm.get('description');
  }
}
