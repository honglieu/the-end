import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TrudiTimeRangePipe } from './time-range.pipe';

@NgModule({
  imports: [CommonModule],
  exports: [TrudiTimeRangePipe],
  declarations: [TrudiTimeRangePipe]
})
export class TrudiPipesModule {}
