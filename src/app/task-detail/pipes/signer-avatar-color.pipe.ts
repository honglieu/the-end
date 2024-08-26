import { EUserPropertyType, EUserPropertyTypeColor } from '@shared/enum';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'signerAvatarColor'
})
export class SignerAvatarColorPipe implements PipeTransform {
  transform(propertyType: EUserPropertyType) {
    switch (propertyType) {
      case EUserPropertyType.TENANT:
        return EUserPropertyTypeColor.TENANT;
      case EUserPropertyType.AGENT || EUserPropertyType.LANDLORD:
        return EUserPropertyTypeColor.LANDLORD;
      default:
        return '';
    }
  }
}
