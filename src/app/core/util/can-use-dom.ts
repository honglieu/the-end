/**
 * Sync from rc-util [https://github.com/react-component/util]
 */
export function canUseDom(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    window.document &&
    window.document.createElement
  );
}
