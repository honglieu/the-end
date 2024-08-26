import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject, map } from 'rxjs';

type Tenant = any;

@Injectable()
export class TenantStateService {
  private readonly _tenant$ = new BehaviorSubject<Tenant>(null);
  public readonly tenant$ = this._tenant$.asObservable();

  private readonly _syncingForms$ = new BehaviorSubject<FormGroup[]>([]);
  public readonly syncingForms$ = this._syncingForms$.asObservable();

  private readonly _isLoading$ = new BehaviorSubject<number>(0);
  public readonly isLoading$ = this._isLoading$
    .asObservable()
    .pipe(map((counter) => counter > 0));

  public setTenant(tenant: Tenant) {
    this._tenant$.next(tenant);
  }

  public setLoading(value: boolean) {
    const counter = this._isLoading$.getValue();
    const newCounter = value ? counter + 1 : counter - 1;
    this._isLoading$.next(newCounter < 0 ? 0 : newCounter);
  }

  public addSyncingForm(form: FormGroup) {
    const currentForms = this._syncingForms$.getValue();
    const newForms = [...currentForms, form];
    this._syncingForms$.next(newForms);
  }

  public removeSyncingForm(form: FormGroup) {
    const deleteId = form.getRawValue()?.id;
    const currentForms = this._syncingForms$.getValue();
    const newForms = currentForms.filter(
      (f) => f.getRawValue()?.id !== deleteId
    );
    this._syncingForms$.next(newForms);
  }

  public resetData() {
    this._tenant$.next(null);
    this._isLoading$.next(null);
  }
}
