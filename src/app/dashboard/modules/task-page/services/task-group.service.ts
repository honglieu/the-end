import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskGroupService {
  private _expandedGroupIds$ = new BehaviorSubject<Record<string, boolean>>({});
  public expandedGroupIds$ = this._expandedGroupIds$.asObservable();

  private _isLoading$ = new BehaviorSubject<boolean>(false);
  public isLoading$ = this._isLoading$.asObservable();

  private _isEditing$ = new BehaviorSubject<boolean>(false);
  public isEditing$ = this._isEditing$.asObservable();

  public isEditing = false;
  public readonly keepExpandState$ = new BehaviorSubject<boolean>(false);
  public readonly openedFolders$ = new BehaviorSubject<Array<string>>([]);

  constructor() {}

  public resetExpandGroup() {
    this.openedFolders$.next([]);
    this.setExpandGroup([]);
  }

  toggleExpandGroup(id: string) {
    const currentExpandedIds = this._expandedGroupIds$.getValue();
    const newValue = !currentExpandedIds[id];
    this._expandedGroupIds$.next({ ...currentExpandedIds, [id]: newValue });
  }

  setExpandGroup(ids: string[]) {
    const expandedGroupIds = ids.reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});
    this._expandedGroupIds$.next(expandedGroupIds);
  }

  updateExpandGroup(data: Record<string, boolean>) {
    const currentExpandedGroupIds = this._expandedGroupIds$.getValue();
    this._expandedGroupIds$.next({
      ...currentExpandedGroupIds,
      ...data
    });
  }

  handleAddValueExpandGroup(id: string) {
    const currentExpandedIds = this._expandedGroupIds$.getValue();
    this._expandedGroupIds$.next({ ...currentExpandedIds, [id]: true });
  }

  isExpandGroup(id: string) {
    const currentExpandedIds = this._expandedGroupIds$.getValue();
    return Boolean(currentExpandedIds[id]);
  }

  setEditMode(value: boolean) {
    this.isEditing = value;
    this._isEditing$.next(value);
  }

  setLoading(value: boolean) {
    this._isLoading$.next(value);
  }

  handleClearValue() {
    this.setEditMode(false);
    this.setLoading(false);
  }
}
