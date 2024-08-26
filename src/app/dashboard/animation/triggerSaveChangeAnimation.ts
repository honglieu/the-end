import { animate, animation, style } from '@angular/animations';

export const openSaveChange = animation([
  style({ opacity: 0, transform: 'translateY(50px) translateX(-50%)' }),
  animate(
    '200ms ease-in',
    style({ opacity: 1, transform: 'translateY(0) translateX(-50%)' })
  )
]);
export const closeSaveChange = animation([
  style({ opacity: 1, transform: 'translateY(0) translateX(-50%)' }),
  animate(
    '200ms ease-out',
    style({ opacity: 0, transform: 'translateY(50px) translateX(-50%)' })
  )
]);
