import { InjectionToken } from '@angular/core';
import { WeekDayIndex } from '@trudi-ui';

export interface TrudiDateConfig {
  firstDayOfWeek?: WeekDayIndex;
}

export const TRUDI_DATE_CONFIG = new InjectionToken<TrudiDateConfig>(
  'date-config'
);

export const TRUDI_DATE_CONFIG_DEFAULT: TrudiDateConfig = {
  firstDayOfWeek: undefined
};

export function mergeDateConfig(config: TrudiDateConfig): TrudiDateConfig {
  return { ...TRUDI_DATE_CONFIG_DEFAULT, ...config };
}
