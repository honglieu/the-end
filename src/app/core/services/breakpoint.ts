import { MediaMatcher } from '@angular/cdk/layout';
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  startWith,
  takeUntil
} from 'rxjs/operators';

import { TrudiResizeService } from './resize';

export enum TrudiBreakpointEnum {
  xxl = 'xxl',
  xl = 'xl',
  lg = 'lg',
  md = 'md',
  sm = 'sm',
  xs = 'xs'
}

export type BreakpointMap = { [key in TrudiBreakpointEnum]: string };
export type BreakpointBooleanMap = { [key in TrudiBreakpointEnum]: boolean };
export type TrudiBreakpointKey = keyof typeof TrudiBreakpointEnum;

export const gridResponsiveMap: BreakpointMap = {
  xs: '(max-width: 575px)',
  sm: '(min-width: 576px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 992px)',
  xl: '(min-width: 1200px)',
  xxl: '(min-width: 1600px)'
};

export const siderResponsiveMap: BreakpointMap = {
  xs: '(max-width: 479.98px)',
  sm: '(max-width: 575.98px)',
  md: '(max-width: 767.98px)',
  lg: '(max-width: 991.98px)',
  xl: '(max-width: 1199.98px)',
  xxl: '(max-width: 1599.98px)'
};

@Injectable({
  providedIn: 'root'
})
export class TrudiBreakpointService implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private resizeService: TrudiResizeService,
    private mediaMatcher: MediaMatcher
  ) {
    this.resizeService
      .subscribe()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {});
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  subscribe(breakpointMap: BreakpointMap): Observable<TrudiBreakpointEnum>;
  subscribe(
    breakpointMap: BreakpointMap,
    fullMap: true
  ): Observable<BreakpointBooleanMap>;
  subscribe(
    breakpointMap: BreakpointMap,
    fullMap?: true
  ): Observable<TrudiBreakpointEnum | BreakpointBooleanMap> {
    if (fullMap) {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      const get = () => this.matchMedia(breakpointMap, true);
      return this.resizeService.subscribe().pipe(
        map(get),
        startWith(get()),
        distinctUntilChanged(
          (
            x: [TrudiBreakpointEnum, BreakpointBooleanMap],
            y: [TrudiBreakpointEnum, BreakpointBooleanMap]
          ) => x[0] === y[0]
        ),
        map((x) => x[1])
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      const get = () => this.matchMedia(breakpointMap);
      return this.resizeService
        .subscribe()
        .pipe(map(get), startWith(get()), distinctUntilChanged());
    }
  }

  private matchMedia(breakpointMap: BreakpointMap): TrudiBreakpointEnum;
  private matchMedia(
    breakpointMap: BreakpointMap,
    fullMap: true
  ): [TrudiBreakpointEnum, BreakpointBooleanMap];
  private matchMedia(
    breakpointMap: BreakpointMap,
    fullMap?: true
  ): TrudiBreakpointEnum | [TrudiBreakpointEnum, BreakpointBooleanMap] {
    let bp = TrudiBreakpointEnum.md;

    const breakpointBooleanMap: Partial<BreakpointBooleanMap> = {};

    Object.keys(breakpointMap).map((breakpoint) => {
      const castBP = breakpoint as TrudiBreakpointEnum;
      const matched = this.mediaMatcher.matchMedia(
        gridResponsiveMap[castBP]
      ).matches;

      breakpointBooleanMap[breakpoint as TrudiBreakpointEnum] = matched;

      if (matched) {
        bp = castBP;
      }
    });

    if (fullMap) {
      return [bp, breakpointBooleanMap as BreakpointBooleanMap];
    } else {
      return bp;
    }
  }
}
