import { Component, Input } from '@angular/core';
import {
  FILE_VALID_TYPE,
  ACCEPT_ONLY_SUPPORTED_FILE
} from '@services/constants';
import { Subject } from 'rxjs';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TinyEditorFileControlService } from '@services/tiny-editor-file-control.service';
import { IFile } from '@shared/types/file.interface';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiAddContactCardService } from '@shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';

@Component({
  selector: 'internal-note-attachment',
  templateUrl: './internal-note-attachment.component.html',
  styleUrls: ['./internal-note-attachment.component.scss']
})
export class InternalNoteAttachmentComponent {
  @Input() selectedContactCard: ISelectedReceivers[] = [];
  @Input() listOfFiles: IFile[] = [];
  @Input() noteId: string;
  @Input() unSupportFile: boolean;
  @Input() overFileSize: boolean;

  readonly FILE_VALID_TYPE = FILE_VALID_TYPE;
  readonly ACCEPT_ONLY_SUPPORTED_FILE = ACCEPT_ONLY_SUPPORTED_FILE;
  private unsubscribe$ = new Subject<void>();

  constructor(
    private tinyEditorFileControlService: TinyEditorFileControlService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiAddContactCardService: TrudiAddContactCardService
  ) {}

  onClearContact(indexContact: number) {
    if (this.selectedContactCard.length > 0) {
      const selectedContactCard = this.selectedContactCard.filter(
        (_it, index) => index !== indexContact
      );
      this.trudiSendMsgFormService.sendMsgForm
        .get('selectedContactCard')
        ?.setValue(selectedContactCard);
      this.trudiAddContactCardService.setSelectedContactCard(
        selectedContactCard
      );
    }
  }

  removeFile(e: Event, index: number) {
    e.stopPropagation();
    const newList = this.listOfFiles.filter((_, i) => i !== index);
    this.tinyEditorFileControlService.setListOfFiles(newList);
    const input = document.querySelector(
      `#upload-internal-note-${this.noteId}`
    ) as HTMLInputElement;
    input.value = null;
    this.tinyEditorFileControlService.validateFileSize();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
