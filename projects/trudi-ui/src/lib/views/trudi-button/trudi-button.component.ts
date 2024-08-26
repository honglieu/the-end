import { Component, Input, HostBinding, ContentChild } from '@angular/core';
import {
  IconPrefixDirective,
  IconSuffixDirective
} from '../../directives/button-icon.directive';
import { CommonModule } from '@angular/common';
@Component({
  standalone: true,
  selector: 'button[trudi-btn]',
  templateUrl: './trudi-button.component.html',
  styleUrls: ['./trudi-button.component.scss'],
  imports: [CommonModule]
})
export class TrudiButtonComponent {
  @ContentChild(IconPrefixDirective) iconPrefix!: IconPrefixDirective;
  @ContentChild(IconSuffixDirective) iconSuffix!: IconSuffixDirective;
  @Input() variant: TrudiButtonVariant = 'filled';
  @Input() size: TrudiButtonSize = 'large';
  @Input() btnType: TrudiButtonType = 'primary';
  @Input() class: string = '';
  @Input() selected: boolean = false;
  @Input() shape: TrudiButtonShape = 'rounded';
  @Input() fillIcon: boolean = false;
  @Input() set ngClass(
    value: string | string[] | Set<string> | { [className: string]: boolean }
  ) {
    if (!value) this._ngClass = '';
    if (typeof value === 'string') this._ngClass = value;
    if (Array.isArray(value)) this._ngClass = value.join(' ');
    if (Object.keys(value))
      this._ngClass = Object.keys(value)
        .filter((key) => !!value[key])
        .join(' ');
  }
  private _ngClass: string = '';

  @HostBinding('attr.class') get classes() {
    return `trudi-ui-btn ${this.fillIcon ? 'trudi-ui-btn-icon-filled' : ''} ${
      this.selected ? 'trudi-ui-btn-selected' : ''
    } trudi-ui-btn-${this.size} trudi-ui-btn-${this.shape} trudi-ui-btn-${
      this.size
    }-${this.shape} trudi-ui-btn-${this.variant} trudi-ui-btn-${this.variant}-${
      this.btnType
    } ${this.class} ${this._ngClass}`;
  }
}

export type TrudiButtonSize =
  | 'extra-small'
  | 'small'
  | 'medium'
  | 'large'
  | 'extra-large';
export type TrudiButtonVariant =
  | 'filled'
  | 'tonal'
  | 'outlined'
  | 'text'
  | 'ghost'
  | 'link';
export type TrudiButtonType =
  | 'primary'
  | 'danger'
  | 'neutral'
  | 'info'
  | 'tenant'
  | 'base'
  | 'weakest';
export type TrudiButtonShape = 'circle' | 'square' | 'rounded';
