import { Directive, ElementRef, HostListener, Input } from '@angular/core';

const SPACE = ' ';

@Directive({
  selector: '[appLettersOnly]'
})
export class LettersOnlyDirective {
  @Input() appLettersOnly: boolean;
  private navigationKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'Home',
    'End',
    'ArrowLeft',
    'ArrowRight',
    'Clear',
    'Copy',
    'Paste'
  ];
  public validKeys: string[] = [
    ...Array(26)
      .fill(0)
      .map((_, i) => String.fromCharCode(97 + i)),
    ...Array(26)
      .fill(0)
      .map((_, i) => String.fromCharCode(65 + i)),
    SPACE
  ];
  public regex = /[^a-zA-Z\s]/g;
  inputElement: HTMLElement;

  constructor(public el: ElementRef) {
    this.inputElement = el.nativeElement;
  }

  executeHandler(handler: Function) {
    if (this.appLettersOnly) {
      handler();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(e) {
    this.executeHandler(() => {
      const isInvalidKey = !this.validKeys.includes(e.key);

      if (
        this.navigationKeys.indexOf(e.key) > -1 ||
        (e.key === 'a' && e.ctrlKey === true) ||
        (e.key === 'c' && e.ctrlKey === true) ||
        (e.key === 'v' && e.ctrlKey === true) ||
        (e.key === 'x' && e.ctrlKey === true) ||
        (e.key === 'a' && e.metaKey === true) ||
        (e.key === 'c' && e.metaKey === true) ||
        (e.key === 'v' && e.metaKey === true) ||
        (e.key === 'x' && e.metaKey === true)
      ) {
        return;
      }

      if (isInvalidKey) {
        e.preventDefault();
      }
    });
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    this.executeHandler(() => {
      event.preventDefault();
      const pastedInput: string = event.clipboardData
        .getData('text/plain')
        .replace(this.regex, '');
      document.execCommand('insertText', false, pastedInput);
    });
  }

  @HostListener('drop', ['$event'])
  onDrop(event) {
    this.executeHandler(() => {
      event.preventDefault();
      const textData = event.dataTransfer
        .getData('text')
        .replace(this.regex, '');
      this.inputElement.focus();
      document.execCommand('insertText', false, textData);
    });
  }
}
