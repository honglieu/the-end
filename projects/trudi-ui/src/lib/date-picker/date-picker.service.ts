/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';

import {
  CandyDate,
  cloneDate,
  CompatibleValue,
  NormalizedMode,
  normalizeRangeValue as normalizeRangeValueCore,
  SingleValue
} from 'ng-zorro-antd/core/time';

import { CompatibleDate, NzDateMode, RangePartType } from './standard-types';
import dayjs from 'dayjs';

@Injectable()
export class DatePickerService implements OnDestroy {
  initialValue!: CompatibleValue;
  value!: CompatibleValue;
  activeDate?: CompatibleValue;
  activeInput: RangePartType = 'left';
  arrowLeft: number = 0;
  isRange = false;
  onlyLeft = false;
  valueChange$ = new ReplaySubject<CompatibleValue>(1);
  emitValue$ = new Subject<void>();
  inputPartChange$ = new Subject<RangePartType>();
  calendarTypeToShow = new BehaviorSubject<{
    eventName?: string;
    date?: CompatibleValue;
  }>(null);

  initValue(reset: boolean = false): void {
    if (reset) {
      this.initialValue = this.isRange ? [] : null;
    }

    this.setValue(this.initialValue);
  }

  hasValue(value: CompatibleValue = this.value): boolean {
    if (Array.isArray(value)) {
      return !!value[0] || !!value[1];
    } else {
      return !!value;
    }
  }

  makeValue(value?: CompatibleDate): CompatibleValue {
    if (this.isRange) {
      return value
        ? (value as Date[]).map(
            (val) => new CandyDate(this.checkValFormat(val))
          )
        : [];
    } else {
      return value ? new CandyDate(this.checkValFormat(value as Date)) : null;
    }
  }

  checkValFormat(value: string | Date) {
    return dayjs(value, 'YYYY-MM-DD', true).isValid()
      ? dayjs(value).toISOString()
      : value;
  }

  setActiveDate(
    value: CompatibleValue,
    hasTimePicker: boolean = false,
    mode: NormalizedMode = 'month'
  ): void {
    const parentPanels: { [key in NzDateMode]?: NormalizedMode } = {
      date: 'month',
      month: 'year',
      year: 'decade'
    };
    if (this.isRange) {
      //Left panel only
      const activeDateOnlyLeft = normalizeRangeValue(
        value as CandyDate[],
        hasTimePicker,
        parentPanels[mode],
        this.activeInput
      );
      const activeDateNormal = normalizeRangeValueCore(
        value as CandyDate[],
        hasTimePicker,
        parentPanels[mode],
        this.activeInput
      );
      this.activeDate = this.onlyLeft ? activeDateOnlyLeft : activeDateNormal;
    } else {
      this.activeDate = cloneDate(value);
    }
  }

  setValue(value: CompatibleValue): void {
    this.value = value;
    this.valueChange$.next(this.value);
  }

  getActiveIndex(part: RangePartType = this.activeInput): number {
    return { left: 0, right: 1 }[part];
  }

  ngOnDestroy(): void {
    this.valueChange$.complete();
    this.emitValue$.complete();
    this.inputPartChange$.complete();
  }
}
/*
  Temporary fix for active range value when selected both start date and end date
  Default should be import from ng-zorro/core/time
*/
export function normalizeRangeValue(
  value: SingleValue[],
  hasTimePicker: boolean,
  type: NormalizedMode = 'month',
  activePart: 'left' | 'right' = 'left'
): CandyDate[] {
  const [start, end] = value;
  let newStart: CandyDate = start || new CandyDate();
  let newEnd: CandyDate = end || (hasTimePicker ? newStart : newStart);
  return [newStart, newEnd];
}
