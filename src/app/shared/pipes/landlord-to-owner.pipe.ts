import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'landlordToOwner'
})
export class LandlordToOwnerPipe implements PipeTransform {
  parameters: Map<string, string> = new Map([
    ['landlord', 'owner'],
    ['Landlord', 'Owner'],
    ['LANDLORD', 'OWNER']
  ]);
  transform(value: string): string {
    return value?.replace(/LANDLORD/gi, (match) => {
      if (this.parameters.get(match)) {
        return this.parameters.get(match);
      }
      return match;
    });
  }
}
