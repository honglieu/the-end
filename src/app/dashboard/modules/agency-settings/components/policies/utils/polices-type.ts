import { IPoliciesRoute } from './polices-interface';

export const policiesRoutes: IPoliciesRoute[] = [
  {
    id: '1',
    name: 'Emergency contacts',
    link: 'emergency-contacts'
  },
  {
    id: '2',
    name: 'Recommended tradespeople',
    link: 'recommended-tradespeople'
  },
  {
    id: '3',
    name: 'Insurance',
    link: 'insurance'
  },
  {
    id: '4',
    name: 'Compliance',
    link: 'compliance'
  },
  {
    id: '5',
    name: 'Leasing',
    link: 'leasing'
  },
  {
    id: '6',
    name: 'Break ins and keys',
    link: 'break-ins-and-keys'
  },
  {
    id: '7',
    name: 'Lease / property changes',
    link: 'lease-property-changes'
  },
  {
    id: '8',
    name: 'Inspections',
    link: 'inspections'
  },
  {
    id: '9',
    name: 'New business',
    link: 'new-business'
  }
  // {
  //   id: '11',
  //   name: 'New Policy',
  //   link: 'new-policy'
  // }
];

export enum ETypeInput {
  TEXT_DEFAULT = 'text',
  INPUT_NUMBER = 'input-number',
  INPUT_SELECTED = 'input-selected',
  INPUT_TEXTAREA = 'input-textarea',
  INPUT_TEXT = 'input-text'
}

export enum InsuranceContactType {
  insurance = 'INSURANCE'
}
