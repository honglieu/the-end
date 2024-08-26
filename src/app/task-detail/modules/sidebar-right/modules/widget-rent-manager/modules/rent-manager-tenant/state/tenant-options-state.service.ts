import { Injectable } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import { ITenantOptions } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/types';

@Injectable()
export class TenantOptionsStateService {
  private readonly _optionsSync$ = new BehaviorSubject<ITenantOptions>(null);

  public readonly optionsSync$ = this._optionsSync$
    .asObservable()
    .pipe(filter((r) => !!r));

  public setOptionsSync(value: ITenantOptions) {
    this._optionsSync$.next(value);
  }
}
