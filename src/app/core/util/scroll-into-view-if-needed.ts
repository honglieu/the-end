import { TrudiSafeAny } from '@core';

export function scrollIntoView(node: HTMLElement): void {
  const nodeAsAny = node as TrudiSafeAny;
  if (nodeAsAny.scrollIntoViewIfNeeded) {
    /* eslint-disable-next-line @typescript-eslint/dot-notation */
    nodeAsAny.scrollIntoViewIfNeeded(false);
    return;
  }
  if (node.scrollIntoView) {
    node.scrollIntoView(false);
    return;
  }
}
