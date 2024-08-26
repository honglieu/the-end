import { TrudiSafeAny } from '@core';

/* eslint-disable no-invalid-this */
const availablePrefixes = ['moz', 'ms', 'webkit'];

function requestAnimationFramePolyfill(): typeof requestAnimationFrame {
  let lastTime = 0;
  return function (callback: FrameRequestCallback): number {
    const currTime = new Date().getTime();
    const timeToCall = Math.max(0, 16 - (currTime - lastTime));
    const id = setTimeout(() => {
      callback(currTime + timeToCall);
    }, timeToCall);
    lastTime = currTime + timeToCall;
    return id as any;
  };
}

function getRequestAnimationFrame(): typeof requestAnimationFrame {
  if (typeof window === 'undefined') {
    return () => 0;
  }
  if (window.requestAnimationFrame) {
    // https://github.com/vuejs/vue/issues/4465
    return window.requestAnimationFrame.bind(window);
  }

  const prefix = availablePrefixes.filter(
    (key) => `${key}RequestAnimationFrame` in window
  )[0];

  return prefix
    ? (window as TrudiSafeAny)[`${prefix}RequestAnimationFrame`]
    : requestAnimationFramePolyfill();
}
export function cancelRequestAnimationFrame(id: number): TrudiSafeAny {
  if (typeof window === 'undefined') {
    return null;
  }
  if (window.cancelAnimationFrame) {
    return window.cancelAnimationFrame(id);
  }
  const prefix = availablePrefixes.filter(
    (key) =>
      `${key}CancelAnimationFrame` in window ||
      `${key}CancelRequestAnimationFrame` in window
  )[0];

  return prefix
    ? (
        (window as TrudiSafeAny)[`${prefix}CancelAnimationFrame`] ||
        (window as TrudiSafeAny)[`${prefix}CancelRequestAnimationFrame`]
      )
        // @ts-ignore
        .call(this, id)
    : clearTimeout(id);
}

export const reqAnimFrame = getRequestAnimationFrame();
