import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class PortalTaskEditorFilterService {
  private searchTitleTask: BehaviorSubject<string> =
    new BehaviorSubject<string>(null);

  getSearchTitleTask(): Observable<string> {
    return this.searchTitleTask.asObservable();
  }

  setSearchTitleTask(value: string) {
    this.searchTitleTask.next(value);
  }
}
