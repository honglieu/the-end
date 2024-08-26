import { animate, animation, style } from '@angular/animations';

export const openMenu = animation([
  style({ opacity: 0, transform: 'scale(0.75)' }),
  animate('200ms ease-in', style({ opacity: 1, transform: 'scale(1)' }))
]);

export const closeMenu = animation([
  animate('200ms ease-out', style({ opacity: 0, transform: 'scale(0.75)' }))
]);
