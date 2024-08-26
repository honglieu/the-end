import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { TrudiDateFormat } from '../interfaces';

export const IS_RM_CRM = new InjectionToken<Observable<boolean>>('IS_RM_CRM');

export const TRUDI_DATE_FORMAT = new InjectionToken<TrudiDateFormat>(
  'TRUDI_DATE_FORMAT'
);
