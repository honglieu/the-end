import { animate, animation, style } from '@angular/animations';

export const openNotification = animation([
  style({ opacity: 0, width: '0' }),
  animate('0.3s ease-out', style({ opacity: 1, width: '372px' }))
]);

export const closeNotification = animation([
  style({ opacity: 1, width: '372px' }),
  animate('0.3s ease-out', style({ opacity: 0, width: '0px' }))
]);
