import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  constructor() {}

  removeLoadingLayer(): void {
    let indicator: HTMLDivElement;
    setTimeout(() => {
      indicator = document.querySelector('#resultLoading');
      if (indicator) {
        indicator.remove();
        document.body.style.cursor = 'default';
      }
    }, 1000);
  }
}
