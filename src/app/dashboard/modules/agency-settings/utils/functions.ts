import { Property } from '@shared/types/property.interface';
import { ISelectContacts } from './interface';

export function billingAmountFormat(value: number) {
  return value / 100;
}

export function sortSuppliersList(suppliers: ISelectContacts[]) {
  return suppliers.sort((a, b) => {
    if (a.isFavourite && !b.isFavourite) {
      return -1;
    }
    if (!a.isFavourite && b.isFavourite) {
      return 1;
    }
    if (a.lastName?.trim().toLowerCase() < b.lastName?.trim().toLowerCase()) {
      return -1;
    }
    if (a.lastName?.trim().toLowerCase() > b.lastName?.trim().toLowerCase()) {
      return 1;
    }
    return 0;
  });
}

export function sortPropertiesList(properties: Property[]) {
  return properties.sort((a, b) => {
    const aStreetline = a.streetline.toLowerCase();
    const bStreetline = b.streetline.toLowerCase();
    return aStreetline > bStreetline ? 1 : aStreetline < bStreetline ? -1 : 0;
  });
}
