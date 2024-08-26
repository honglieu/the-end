import {
  Directive,
  Input,
  HostBinding,
  OnChanges,
  SimpleChanges
} from '@angular/core';

@Directive({
  selector: '[appE2E]',
  standalone: true
})
export class E2eAttributeDirective implements OnChanges {
  @Input() appE2E: string = 'element'; // for dynamic e2e id
  @Input() e2eId: string = 'element';
  @Input() e2ePrefix: string = '';
  @Input() e2eSuffix: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['e2ePrefix']?.currentValue) {
      this.e2ePrefix = String(changes['e2ePrefix'].currentValue)
        ?.replace(/\s/g, '')
        ?.replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase();
    }
    if (changes['e2eSuffix']?.currentValue) {
      this.e2eSuffix = String(changes['e2eSuffix'].currentValue)
        ?.replace(/\s/g, '')
        ?.replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase();
    }
    if (changes['e2eId']?.currentValue || changes['appE2E']?.currentValue) {
      this.e2eId = String(
        changes['e2eId']?.currentValue || changes['appE2E']?.currentValue
      )
        ?.replace(/\s/g, '')
        ?.replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase();
    }
    const prefix = this.e2ePrefix ? `${this.e2ePrefix}-` : '';
    const suffix = this.e2eSuffix ? `-${this.e2eSuffix}` : '';
    this._e2eId = `${prefix}${this.e2eId}${suffix}`;
  }

  @HostBinding('attr.data-e2e') _e2eId!: string;
}
