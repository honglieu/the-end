import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'generatedContent',
  standalone: true
})
export class GeneratedContentPipe implements PipeTransform {
  constructor(private domSanitizer: DomSanitizer) {}
  transform(value: string, ...args: any[]) {
    return this.domSanitizer.sanitize(SecurityContext.HTML, value);
  }
}
