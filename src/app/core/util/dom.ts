/**
 * This module provides utility functions to query DOM information or
 * set properties.
 */

import { Observable } from 'rxjs';

/**
 * Silent an event by stopping and preventing it.
 */
export function silentEvent(e: Event): void {
  e.stopPropagation();
  e.preventDefault();
}

export function getElementOffset(elem: HTMLElement): {
  top: number;
  left: number;
} {
  if (!elem.getClientRects().length) {
    return { top: 0, left: 0 };
  }

  const rect = elem.getBoundingClientRect();
  const win = elem.ownerDocument!.defaultView;
  return {
    top: rect.top + win!.pageYOffset,
    left: rect.left + win!.pageXOffset
  };
}

/**
 * Investigate if an event is a `TouchEvent`.
 */
export function isTouchEvent(
  event: MouseEvent | TouchEvent
): event is TouchEvent {
  return event.type.startsWith('touch');
}

export function getEventPosition(
  event: MouseEvent | TouchEvent
): MouseEvent | Touch {
  return isTouchEvent(event)
    ? event.touches[0] || event.changedTouches[0]
    : event;
}

export interface MouseTouchObserverConfig {
  end: string;
  move: string;
  pluckKey: string[];
  start: string;

  end$?: Observable<Event>;
  moveResolved$?: Observable<number>;
  startPlucked$?: Observable<number>;

  filter?(e: Event): boolean;
}

export function hasSomeParentTheClass(element: HTMLElement, className: string) {
  if (
    element?.className?.split &&
    element.className.split(' ').indexOf(className) >= 0
  )
    return true;
  return (
    element?.parentElement &&
    hasSomeParentTheClass(element?.parentElement, className)
  );
}
