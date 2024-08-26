import { createActionGroup, props } from '@ngrx/store';
import { IDBOtherContact } from '@core/store/contact-page/other-contact/type';
import { IOtherContactFilter } from '@/app/user/utils/user.type';
import { OtherContact } from '@shared/types/other-contact.interface';

export const otherContactApiActions = createActionGroup({
  source: 'Other Contact API',
  events: {
    'Get Other Contact Success': props<{
      data?: IDBOtherContact;
      payload?: IOtherContactFilter;
    }>(),
    'Get Other Contact Failure': props<{ error: unknown }>(),
    'Get New Page Other Contact': props<{
      otherContact?: Array<OtherContact>;
    }>()
  }
});
