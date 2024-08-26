/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';

import { DateHelperService } from 'ng-zorro-antd/i18n';
import { AbstractPanelHeader } from './abstract-panel-header';
import { PanelSelector } from './interface';
import { transCompatFormat } from './util';

@Component({
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'date-header', // eslint-disable-line @angular-eslint/component-selector
  exportAs: 'dateHeader',
  templateUrl: './abstract-panel-header.html'
})
export class DateHeaderComponent extends AbstractPanelHeader {
  constructor(private dateHelper: DateHelperService) {
    super();
  }

  getSelectors(): PanelSelector[] {
    const monthLabel = this.dateHelper.format(
      this.value.nativeDate,
      transCompatFormat(this.locale.monthFormat) || 'MMMM'
    );
    const yearLabel = this.dateHelper.format(
      this.value.nativeDate,
      transCompatFormat(this.locale.yearFormat)
    );
    return [
      {
        className: `${this.prefixCls}-month-btn`,
        title: this.locale.monthSelect,
        onClick: () => this.changeMode('month'),
        label: `${monthLabel} ${yearLabel}`
      }
    ];
  }
}
