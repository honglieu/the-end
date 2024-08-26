import { ICreditorInvoiceOption } from '@shared/types/tenancy-invoicing.interface';

export const getCreditorName = (firstName: string, lastName: string) => {
  if (!firstName) return lastName;
  if (!lastName) return firstName;
  return `${firstName} ${lastName}`;
};

export const getSupplierId = (id: string, arr: ICreditorInvoiceOption[]) => {
  if (arr?.some((it) => it.id === id)) return id;
  return '';
};
