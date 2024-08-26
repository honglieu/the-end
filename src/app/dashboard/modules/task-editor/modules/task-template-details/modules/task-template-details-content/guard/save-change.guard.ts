import { Injectable } from '@angular/core';

export interface CanComponentDeactivate {
  checkDeactivate: () => boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SaveChangeGuard {
  canDeactivate(component: CanComponentDeactivate) {
    return component.checkDeactivate();
  }
}
