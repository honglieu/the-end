import { Pipe, PipeTransform } from '@angular/core';
import { EUserPropertyType } from '@shared/enum/user.enum';

@Pipe({
  name: 'userClass'
})
export class UserClassPipe implements PipeTransform {
  transform(userType: EUserPropertyType): string {
    const classMappings = {
      tenant: [
        EUserPropertyType.TENANT,
        EUserPropertyType.TENANT_PROSPECT,
        EUserPropertyType.TENANT_PROPERTY,
        EUserPropertyType.TENANT_UNIT
      ],
      landlord: [
        EUserPropertyType.LANDLORD,
        EUserPropertyType.LANDLORD_PROSPECT
      ]
    };

    for (const className in classMappings) {
      if (classMappings[className].includes(userType)) {
        return className;
      }
    }
    return 'agent';
  }
}
