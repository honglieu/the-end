import { isDevMode } from '@angular/core';

import { environment } from '@core';
import { TrudiSafeAny } from '@core';

const record: Record<string, boolean> = {};

export const PREFIX = '[NG-ZORRO]:';

function notRecorded(...args: TrudiSafeAny[]): boolean {
  const asRecord = args.reduce((acc, c) => acc + c.toString(), '');

  if (record[asRecord]) {
    return false;
  } else {
    record[asRecord] = true;
    return true;
  }
}

function consoleCommonBehavior(
  consoleFunc: (...args: TrudiSafeAny) => void,
  ...args: TrudiSafeAny[]
): void {
  if (environment.isTestMode || (isDevMode() && notRecorded(...args))) {
    consoleFunc(...args);
  }
}

// Warning should only be printed in dev mode and only once.
export const warn = (...args: TrudiSafeAny[]): void =>
  consoleCommonBehavior(
    (...arg: TrudiSafeAny[]) => console.warn(PREFIX, ...arg),
    ...args
  );

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const warnDeprecation = (...args: TrudiSafeAny[]) => {
  if (!environment.isTestMode) {
    const stack = new Error().stack;
    return consoleCommonBehavior(
      (...arg: TrudiSafeAny[]) =>
        console.warn(PREFIX, 'deprecated:', ...arg, stack),
      ...args
    );
  } else {
    return () => {};
  }
};

// Log should only be printed in dev mode.
export const log = (...args: TrudiSafeAny[]): void => {
  if (isDevMode()) {
    console.log(PREFIX, ...args);
  }
};
