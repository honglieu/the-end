import { FileCarousel, IFile } from '@shared/types/file.interface';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';
import { Subject } from 'rxjs';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { ConverationSummaryService } from '@/app/dashboard/modules/inbox/components/conversation-summary/services/converation-summary.service';
import { FilesService } from '@/app/services/files.service';

@Component({
  selector: 'conversation-summary-attachment',
  templateUrl: './conversation-summary-attachment.component.html',
  styleUrl: './conversation-summary-attachment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationSummaryAttachmentComponent
  implements OnDestroy, OnChanges
{
  @Input() file: IFile | FileCarousel;
  private readonly destroy$ = new Subject<void>();
  public EButtonType = EButtonType;
  public EButtonTask = EButtonTask;
  public fileIcon: string;
  constructor(
    private readonly converationSummaryService: ConverationSummaryService,
    private readonly filesService: FilesService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['file']?.currentValue) {
      this.fileIcon = this.filesService.getFileIcon(this.file?.name);
    }
  }

  loadFile(file, selectedFileId) {
    this.converationSummaryService.triggerLoadFileMsgSummary$.next({
      file: file,
      selectedFileId: selectedFileId
    });
  }

  get getBeforeDot(): string {
    const dotIndex = this.file?.name.indexOf('.');
    return dotIndex !== -1
      ? this.file?.name.substring(0, dotIndex)
      : this.file?.name;
  }

  get getAfterDot(): string {
    const dotIndex = this.file?.name.indexOf('.');
    return dotIndex !== -1 ? this.file?.name.substring(dotIndex + 1) : '';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
