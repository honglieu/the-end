import { auth } from '@/environments/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: any;
  isElectronApp: boolean;

  constructor(private apiService: ApiService) {
    this.ipcRenderer = this.getIpcRenderer();
    this.isElectronApp = this.checkElectronApp();
  }

  getIpcRenderer() {
    return (<any>window).ipcRenderer;
  }

  checkElectronApp() {
    if (
      typeof (<any>window) !== 'undefined' &&
      typeof (<any>window).process === 'object' &&
      (<any>window).process.type === 'renderer'
    ) {
      return true;
    }

    if (
      typeof process !== 'undefined' &&
      typeof process.versions === 'object' &&
      !!process.versions['electron']
    ) {
      return true;
    }

    if (
      typeof navigator === 'object' &&
      typeof navigator.userAgent === 'string' &&
      navigator.userAgent.indexOf('Electron') >= 0
    ) {
      return true;
    }

    return false;
  }

  checkDesktopVersionStore(version: string): Observable<any> {
    return this.apiService.getAPI(
      auth,
      `check-desktop-version?version=${version}`
    );
  }
}
