import { tuple } from './type';

export type TrudiStatus = '' | 'error' | 'warning';

const ValidateStatuses = tuple('success', 'warning', 'error', 'validating', '');
export type TrudiValidateStatus = (typeof ValidateStatuses)[number];
