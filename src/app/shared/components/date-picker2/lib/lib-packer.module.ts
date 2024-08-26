/**
 * A collection module of standard output for all lib components
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrudiOutletModule } from '@core';

import { TrudiI18nModule } from '@/app/i18n';
import { DateHeaderComponent } from './date-header.component';
import { DateTableComponent } from './date-table.component';
import { DecadeHeaderComponent } from './decade-header.component';
import { DecadeTableComponent } from './decade-table.component';
import { MonthHeaderComponent } from './month-header.component';
import { MonthTableComponent } from './month-table.component';
import { YearHeaderComponent } from './year-header.component';
import { YearTableComponent } from './year-table.component';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { DayOffClassMapperPipe } from './pipes/day-off-class-mapper.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TrudiI18nModule,
    TrudiOutletModule,
    SharePopUpModule
  ],
  exports: [
    DateHeaderComponent,
    DateTableComponent,
    DecadeHeaderComponent,
    DecadeTableComponent,
    MonthHeaderComponent,
    MonthTableComponent,
    YearHeaderComponent,
    YearTableComponent
  ],
  declarations: [
    DateHeaderComponent,
    DateTableComponent,
    DecadeHeaderComponent,
    DecadeTableComponent,
    MonthHeaderComponent,
    MonthTableComponent,
    YearHeaderComponent,
    YearTableComponent,
    DayOffClassMapperPipe
  ]
})
export class LibPackerModule {}
