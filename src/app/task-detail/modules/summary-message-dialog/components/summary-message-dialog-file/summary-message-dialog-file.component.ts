import { FileCarousel, IFile } from '@shared/types/file.interface';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Subject } from 'rxjs';
import { SummaryMessageDialogService } from '@/app/task-detail/modules/summary-message-dialog/services/summary-message-dialog.service';
import { EButtonTask, EButtonType } from '@trudi-ui';

@Component({
  selector: 'summary-message-dialog-file',
  templateUrl: './summary-message-dialog-file.component.html',
  styleUrls: ['./summary-message-dialog-file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryMessageDialogFileComponent implements OnInit, OnDestroy {
  @Input() file: IFile | FileCarousel;
  private readonly destroy$ = new Subject<void>();
  public EButtonType = EButtonType;
  public EButtonTask = EButtonTask;
  constructor(
    private summaryMessageDialogService: SummaryMessageDialogService
  ) {}

  ngOnInit(): void {}

  loadFile(file, selectedFileId) {
    this.summaryMessageDialogService.triggerLoadFileMsgSummary$.next({
      file: file,
      selectedFileId: selectedFileId
    });
  }

  getBeforeDot(text: string): string {
    const dotIndex = text.indexOf('.');
    return dotIndex !== -1 ? text.substring(0, dotIndex) : text;
  }

  getAfterDot(text: string): string {
    const dotIndex = text.indexOf('.');
    return dotIndex !== -1 ? text.substring(dotIndex + 1) : '';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
