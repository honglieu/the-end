import { Injectable } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewVersionCheckerService {
  public versionUpdate$: Observable<VersionEvent>;
  constructor(private swUpdate: SwUpdate) {
    this.versionUpdate$ = this.swUpdate.versionUpdates;
  }
  public checkForUpdate() {
    return this.swUpdate.checkForUpdate();
  }
}
