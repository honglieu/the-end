import { createActionGroup, emptyProps } from '@ngrx/store';

export const contactBasePageActions = createActionGroup({
  source: 'Contact Base Page',
  events: {
    'Enter Page': emptyProps(),
    'Exit Page': emptyProps()
  }
});
