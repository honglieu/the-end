import { TemplateRef } from '@angular/core';

export type DisabledDateFn = (d: Date) => boolean;

export type DisabledTimePartial = 'start' | 'end';

export type TrudiDateMode =
  | 'decade'
  | 'year'
  | 'month'
  | 'week'
  | 'date'
  | 'time';

export type RangePartType = 'left' | 'right';

export type CompatibleDate = Date | Date[];

export type DisabledTimeFn = (
  current: Date | Date[],
  partial?: DisabledTimePartial
) => DisabledTimeConfig | undefined;

export interface DisabledTimeConfig {
  trudiDisabledHours(): number[];
  trudiDisabledMinutes(hour: number): number[];
  trudiDisabledSeconds(hour: number, minute: number): number[];
}

export interface SupportTimeOptions {
  trudiFormat?: string;
  trudiHourStep?: number;
  trudiMinuteStep?: number;
  trudiSecondStep?: number;
  trudiDisabledHours?(): number[];
  trudiDisabledMinutes?(hour: number): number[];
  trudiDisabledSeconds?(hour: number, minute: number): number[];
  trudiHideDisabledOptions?: boolean;
  trudiDefaultOpenValue?: Date;
  trudiAddOn?: TemplateRef<void>;
  trudiUse12Hours?: boolean;
}

export interface PresetRanges {
  [key: string]: Date[] | (() => Date[]);
}
