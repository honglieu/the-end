import { Pipe, PipeTransform } from '@angular/core';
import { EUserPropertyType } from '@shared/enum/user.enum';

@Pipe({
  name: 'conversationClass'
})
export class ConversationClassPipe implements PipeTransform {
  transform(conversation: any): string {
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
      ],
      supplier: EUserPropertyType.SUPPLIER,
      other: EUserPropertyType.OTHER,
      unidentified: [
        EUserPropertyType.EXTERNAL,
        EUserPropertyType.UNIDENTIFIED,
        EUserPropertyType.LEAD
      ]
    };

    const classes = Object.keys(classMappings)
      .filter((className) => {
        const condition = classMappings[className];
        if (Array.isArray(condition)) {
          return (
            condition.includes(conversation.startMessageBy) ||
            condition.includes(conversation.propertyType)
          );
        }
        return conversation.startMessageBy === condition;
      })
      .join(' ');

    return classes;
  }
}
