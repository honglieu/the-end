import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shouldShowChartPipe'
})
export class ShouldShowChartPipe implements PipeTransform {
  transform(listDataChart, chartNameValue): boolean {
    if (!listDataChart || listDataChart.length < 1) {
      return false;
    }
    let totalValueChart = listDataChart.reduce(
      (accumulator, currentValue) => accumulator + currentValue[chartNameValue],
      0
    );
    if (totalValueChart === 0) {
      return false;
    }
    return true;
  }
}
