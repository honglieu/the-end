import { animate, animation, style } from '@angular/animations';

export const openViewConversation = animation([
  style({ opacity: 0, width: '0' }),
  animate('0.3s ease-out', style({ opacity: 1, width: '634px' }))
]);

export const closeViewConversation = animation([
  style({ opacity: 1, width: '634px' }),
  animate('0.3s ease-out', style({ opacity: 0, width: '0px' }))
]);
