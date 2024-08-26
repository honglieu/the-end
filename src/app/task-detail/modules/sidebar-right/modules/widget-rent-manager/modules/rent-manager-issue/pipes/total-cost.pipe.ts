import { Pipe, PipeTransform } from '@angular/core';
import { numStr } from '@shared/feature/function.feature';

@Pipe({
  name: 'totalCost'
})
export class TotalCostPipe implements PipeTransform {
  transform(cost: string, quantity: string): string {
    if (cost && quantity) {
      const formatCost = parseFloat(cost.toString().replace(/,/g, ''));
      const formatQuantity = parseFloat(quantity.toString().replace(/,/g, ''));
      const total = formatCost * formatQuantity;
      return this.formatCost(
        numStr(this.roundToTwoDecimalPlaces(total)),
        total
      );
    } else {
      return '$0.00';
    }
  }

  roundToTwoDecimalPlaces(number) {
    return (Math.round(number * 100) / 100).toString();
  }

  formatCost(value: string, originValue: number) {
    if (Number.isInteger(+originValue)) {
      return '$' + value + '.00';
    } else {
      return '$' + value;
    }
  }
}
