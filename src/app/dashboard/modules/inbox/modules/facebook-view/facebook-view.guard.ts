import { CanActivateFn } from '@angular/router';

export const facebookViewGuard: CanActivateFn = (route, state) => {
  return true;
};
