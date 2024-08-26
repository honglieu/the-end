import { ECustomiseVoicemailOption } from './enum';

export const POLICY_ROUTE: string = 'dashboard/agency-settings/policies';

export const voicemailCustomiseOption = [
  {
    label: 'Always on',
    value: ECustomiseVoicemailOption.ALWAYS,
    disabled: false
  },
  {
    label: 'Switch on outside of office hours',
    value: ECustomiseVoicemailOption.OUTSIDE_OFFICE_HOURS,
    disabled: false
  },
  {
    label: 'Switch on at custom time -',
    value: ECustomiseVoicemailOption.CUSTOM_TIME,
    disabled: false
  },
  {
    label: 'Switch off',
    value: ECustomiseVoicemailOption.OFF,
    disabled: false
  }
];

export const daysOfWeek = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
];

export const INVALID_NUMBER = 'Invalid number';
export const REDIRECT_NUMBER_DUPLICATED =
  'Redirect number is duplicated with voicemail number';

export const DEBOUNCE_TIME = 500;
