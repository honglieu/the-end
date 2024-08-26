import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { contactBasePageActions } from '@core/store/contact-page/contact-base/actions/contact-base-page.actions';
import { tap } from 'rxjs';
import { ContactBaseMemoryCacheService } from '@core/store/contact-page/contact-base/services/contact-base-memory-cachce.service';
@Injectable()
export class contactBaseEffects {
  readonly exitPage$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(contactBasePageActions.exitPage),
        tap(() => {
          this.contactBaseMemoryCacheService.clear();
        })
      ),
    {
      dispatch: false
    }
  );

  constructor(
    private readonly action$: Actions,
    private contactBaseMemoryCacheService: ContactBaseMemoryCacheService
  ) {}
}
