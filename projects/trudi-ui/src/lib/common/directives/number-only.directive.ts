import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appNumberOnly]',
  standalone: true
})
export class NumberOnlyDirective {
  @Input() maxCharacter: number;
  @Input() isNumeric: boolean = false;
  @Input() disableDotKey: boolean = false;
  @Input() isContactFormNewTenant: boolean = false;
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
  public validKey: string[] = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9'
  ];

  public specialCharacters: string[] = ['(', '+', ')', 'Shift', '-', ' '];
  public mapValidKey = this.validKey.concat(this.specialCharacters);

  inputElement: HTMLElement;

  constructor(public el: ElementRef) {
    this.inputElement = el.nativeElement;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(e) {
    if (this.isContactFormNewTenant) {
      this.validKey = this.mapValidKey;
    }
    const value = e.target.value,
      pointerIndex = e.target.selectionStart,
      valueArray = value.split('.'),
      numberValue = value.replace(
        this.isContactFormNewTenant ? /[^0-9+()\s-]/g : /\D/g,
        ''
      ),
      isHavingEnoughNumbers =
        this.maxCharacter &&
        numberValue.length === this.maxCharacter - 1 &&
        this.validKey.includes(e.key),
      isHavingDot = value.includes('.') && e.key === '.',
      isHaving2DecimalNumbers =
        valueArray[1]?.length === 2 &&
        pointerIndex >= valueArray[0]?.length + 1,
      isInvalidDot =
        (pointerIndex === this.maxCharacter - 1 && e.key === '.') ||
        (pointerIndex < value.length - 2 && e.key === '.'),
      isInvalidKey = !this.validKey.includes(e.key) && e.key != '.',
      isStartZero = this.isNumeric && !value && e.key === '0';

    //Handle the restriction of typing the dot key
    if (this.disableDotKey && e.key === '.') {
      e.preventDefault();
    }
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

    if (
      isHavingDot ||
      (isHaving2DecimalNumbers && !this.isNumeric) ||
      isInvalidDot ||
      isHavingEnoughNumbers ||
      isInvalidKey ||
      isStartZero
    ) {
      e.preventDefault();
    }
  }

  getRegexString() {
    return this.isContactFormNewTenant ? /[^0-9()+\s-]/g : /[^\d\.]/g;
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const regexStr = this.getRegexString();
    const pastedInput: string = event.clipboardData
      .getData('text/plain')
      .replace(regexStr, '');
    let inputValue = pastedInput;
    if (
      pastedInput.length >= this.maxCharacter &&
      this.isContactFormNewTenant
    ) {
      inputValue = pastedInput.slice(0, this.maxCharacter - 1);
    }
    document.execCommand('insertText', false, inputValue);
  }

  @HostListener('drop', ['$event'])
  onDrop(event) {
    const regexStr = this.getRegexString();
    event.preventDefault();
    const textData = event.dataTransfer.getData('text').replace(regexStr, '');
    this.inputElement.focus();
    document.execCommand('insertText', false, textData);
  }
}
