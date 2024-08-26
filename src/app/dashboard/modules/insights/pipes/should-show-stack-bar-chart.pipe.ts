import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shouldShowStackBarChart'
})
export class ShouldShowStackBarChart implements PipeTransform {
  transform(listDataChart): boolean {
    if (!listDataChart || listDataChart.length < 1) {
      return false;
    }
    let totalValueInProgress = listDataChart.reduce(
      (accumulator, currentValue) => accumulator + currentValue.inprogress,
      0
    );
    let totalValueCompleted = listDataChart.reduce(
      (accumulator, currentValue) => accumulator + currentValue.completed,
      0
    );

    if (totalValueInProgress === 0 && totalValueCompleted === 0) {
      return false;
    }
    return true;
  }
}
