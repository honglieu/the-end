import { InjectionToken } from '@angular/core';

import { TrudiTreeBaseService } from './trudi-tree-base.service';

export const TrudiTreeHigherOrderServiceToken =
  new InjectionToken<TrudiTreeBaseService>('TrudiTreeHigherOrder');
