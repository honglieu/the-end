import { InternalNoteApiService } from '@/app/task-detail/modules/internal-note/services/internal-note-api.service';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { SharedService } from '@services/shared.service';
import {
  IEditNoteConfig,
  IInternalNote
} from '@/app/task-detail/modules/internal-note/utils/internal-note.interface';
import {
  replaceUrlWithAnchorTag,
  shortenLinkText
} from '@shared/feature/function.feature';
import { InternalNoteService } from '@/app/task-detail/modules/internal-note/services/internal-note.service';
import { FormControl } from '@angular/forms';
import { TIME_FORMAT } from '@services/constants';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { map } from 'rxjs';
import { ChatNoteComponent } from '@/app/task-detail/modules/internal-note/modules/chat-note/chat-note.component';
import { ToastrService } from 'ngx-toastr';
import { mapUsersToName } from '@core';

@Component({
  selector: 'message-note',
  templateUrl: './message-note.component.html',
  styleUrls: ['./message-note.component.scss']
})
export class MessageNoteComponent implements OnInit {
  @Input() messageNote: IInternalNote;
  @Output() editStatusChange = new EventEmitter<{
    id: string;
    editing: boolean;
  }>();
  @ViewChild('textContain') private textContain: ElementRef;
  @ViewChild('chatNote', { static: false }) chatNote: ChatNoteComponent;
  @ViewChild('messageContent') messageContent: ElementRef;
  TIME_FORMAT = TIME_FORMAT;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$.pipe(
    map((format) => TIME_FORMAT + ' ' + format)
  );
  public noteForm = new FormControl();
  public isEditMode: boolean = false;
  public textMessage: string;
  public editNoteConfig: IEditNoteConfig = {
    toolbar: false,
    character: false,
    height: '',
    width: '',
    focusOnInit: true
  };

  constructor(
    private sharedService: SharedService,
    private internalNoteService: InternalNoteService,
    private internalNoteApiService: InternalNoteApiService,
    private agencyDateFormatService: AgencyDateFormatService,
    private toastrService: ToastrService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.textMessage = this.messageNote.text;
  }

  ngAfterViewInit() {
    this._convertTextToHyperlink();
    this.internalNoteService.addEventForImage(this.elementRef);
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['messageNote']?.currentValue) {
      const { firstName, lastName } = this.messageNote.createdBy || {};
      this.messageNote = {
        ...this.messageNote,
        createdBy: {
          ...this.messageNote.createdBy,
          displayName: this.sharedService.displayName(firstName, lastName)
        }
      };
      this.isEditMode = this.messageNote.isEditing;
    }
  }

  private _convertTextToHyperlink() {
    if (this.textContain && this.textContain.nativeElement) {
      const paragraph = this.textContain.nativeElement as HTMLParagraphElement;

      paragraph.innerHTML = replaceUrlWithAnchorTag(paragraph.innerHTML);
      paragraph.innerHTML = shortenLinkText(paragraph.innerHTML);

      const anchors = paragraph.querySelectorAll('a');
      anchors.forEach((anchor: HTMLAnchorElement) => {
        if (!anchor.getAttribute('target')) {
          anchor.setAttribute('target', '_blank');
        }
      });
    }
  }

  editMessage(messageNote: IInternalNote) {
    this.editStatusChange.emit({ id: messageNote.id, editing: true });
    if (!this.isEditMode) {
      const messageContentEl = this.messageContent.nativeElement as HTMLElement;
      const messageContentHeight = messageContentEl.offsetHeight;
      this.editNoteConfig.height = `${messageContentHeight + 24}px`;
      const messageContentWidth = messageContentEl.offsetWidth;
      this.isEditMode = true;
    }
    this.noteForm.setValue(this.messageNote.text);
  }

  onCancel() {
    this.isEditMode = false;
    this.messageNote.text = this.textMessage;
    this.editStatusChange.emit({ id: this.messageNote.id, editing: false });
  }

  async onSave() {
    const newAssignedUsersName = this.chatNote.getNewAssignedUsers();
    const { mentionUserIds, taskId, text } = await this.chatNote.getPayload();
    const data = { id: this.messageNote.id, mentionUserIds, taskId, text };
    this.internalNoteApiService.sendEditInternalNote(data).subscribe((data) => {
      this.messageNote.text = mapUsersToName(data.text, data.mentionUsers);
      this.textMessage = data.text;
      this.messageNote.editAt = data.editAt;
      if (newAssignedUsersName) {
        this.toastrService.info(newAssignedUsersName);
      }
      this.isEditMode = false;
      this.editStatusChange.emit({ id: this.messageNote.id, editing: false });
    });
  }
  ngOnDestroy() {
    this.internalNoteService.removeEventForImage(this.elementRef);
  }
}
