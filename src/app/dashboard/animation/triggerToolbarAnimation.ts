import { animate, animation, style } from '@angular/animations';

export const openMenu = animation([
  style({ opacity: 0, transform: 'translateY(-50px)' }),
  animate('200ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
]);

export const closeMenu = animation([
  style({ opacity: 1, transform: 'translateY(0)' }),
  animate(
    '200ms ease-out',
    style({ opacity: 0, transform: 'translateY(-50px)' })
  )
]);
