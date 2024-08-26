import { OtherContact } from '@shared/types/other-contact.interface';
import { createActionGroup, props } from '@ngrx/store';

export const otherContactActions = createActionGroup({
  source: 'Other Contact Page',
  events: {
    'Set All': props<{ otherContacts: Array<OtherContact> }>(),
    'Get Cache Other Contact Success': props<{ data: Array<OtherContact> }>()
  }
});
