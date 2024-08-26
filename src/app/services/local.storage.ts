import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly _map = new Map<string, any>();
  private readonly _storage = window?.localStorage;

  public getValue<T = any>(key: string, isNotCheck?: boolean): T {
    if (!this._storage) return undefined;
    if (this._map.has(key)) {
      return this._map.get(key);
    } else if (!isNotCheck) {
      if (this._storage.getItem(key)) {
        this.setValue(key, localStorage.getItem(key));
        return this._map.get(key);
      }
    }
    return undefined;
  }

  public setValue<T = any>(key: string, value: T): void {
    if (!this._storage) return;
    this._storage.setItem(key, value as any);
    this._map.set(key, value);
  }

  public clearLocalStorage() {
    if (!this._storage) return;
    this._storage.clear();
    this._map.clear();
  }
}
