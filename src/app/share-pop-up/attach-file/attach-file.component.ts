import { FilesService } from '@services/files.service';
import { IFile } from '@shared/types/file.interface';
import { ENoteType } from '@/app/task-detail/modules/internal-note/utils/internal-note.enum';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';

@Component({
  selector: 'attach-file',
  templateUrl: './attach-file.component.html',
  styleUrls: ['./attach-file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttachFileComponent implements OnChanges {
  @Input() files: IFile[] = [];
  @Input() cards: ISelectedReceivers[];
  @Input() overFileSize: boolean = false;
  @Input() isShowPreviewAttachment: boolean = false;
  @Input() fromCheckListStep: boolean = false;
  @Input() isUnSupportFile: boolean = false;
  @Output() onRemoveFile = new EventEmitter();
  @Output() clearCard = new EventEmitter();
  @Input() isPolicy: boolean = false;
  @Input() isAddCustomPolicy: boolean = false;
  public readonly ENoteType = ENoteType;
  constructor(private fileService: FilesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cards']) {
      this.cards = changes['cards'].currentValue;
    }
    if (changes['files']) {
      if (!this.files?.length) return;
      this.files = this.files.map((file) => ({
        ...file,
        mediaType: this.fileService.getFileTypeDot(file?.fileName)
      }));
    }
  }

  onClearContact(cardId: string) {
    this.clearCard.emit(cardId);
  }

  removeFile(event: Event, index: number) {
    this.onRemoveFile.emit(index);
  }
}
