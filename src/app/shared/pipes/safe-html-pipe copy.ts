import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'safeHtml' })
export class SafeHTMLPipe implements PipeTransform {
  constructor(private sanitized: DomSanitizer) {}

  transform(value) {
    return this.sanitized.bypassSecurityTrustHtml(value);
  }
}
