import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  StepDetail,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'preview-email',
  templateUrl: './preview-email.component.html',
  styleUrls: ['./preview-email.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewEmailComponent implements AfterViewChecked {
  @ViewChild('previewEmailFrame') previewEmailFrame: ElementRef;
  @Input() emailSignature: string = '';
  @Input() emailBody: string = '';
  @Input() disabled: boolean = false;
  @Input() currentStep: TrudiStep & StepDetail = null;
  @Output() afterClose = new EventEmitter();

  constructor(protected stepService: StepService) {}

  ngAfterViewChecked(): void {
    const iframe = this.previewEmailFrame.nativeElement as HTMLIFrameElement;
    const bodyScrollHeight =
      iframe?.contentWindow?.document.querySelector('div')?.scrollHeight;

    if (bodyScrollHeight) {
      iframe.style.height = bodyScrollHeight + 'px';
    }
  }

  onCancel() {
    this.afterClose.emit();
  }

  onExecuteStep() {
    this.afterClose.emit(true);
  }

  loadHtmlContent(event) {
    const iframe = event.target as HTMLIFrameElement;
    if (!iframe) return;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<div>${this.emailBody}</div>`);
    doc.close();

    doc.body.id = 'tinymce';
    const style = document.createElement('link');
    style.href = '/assets/styles/tiny-editor.css';
    style.rel = 'stylesheet';
    style.type = 'text/css';
    doc.head.appendChild(style);
    doc.body.style.margin = '0';
  }
}
