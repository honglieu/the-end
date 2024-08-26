import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'preview-text',
  standalone: true,
  imports: [CommonModule],
  template: `<p
    class="reply-message"
    [ngClass]="classes"
    [innerHTML]="safeMessage"></p>`,
  styleUrl: './preview-text.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewTextComponent {
  @Input() classes: { [key: string]: boolean } = {};
  @Input() set message(value: string) {
    if (!value) return;
    this.safeMessage = this.sanitizer.bypassSecurityTrustHtml(value);
  }
  safeMessage: SafeHtml;
  private sanitizer = inject(DomSanitizer);
}
