import { NgModule } from '@angular/core';
import { TrudiFilterableCheckboxSelect } from './trudi-filterable-checkbox-select/trudi-filterable-checkbox-select.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TrudiOptionTemplateDirective } from '../select/directives/trudi-option-template.directive';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { TrudiFooterTemplateDirective } from './directives/trudi-footer-template.directive';
import { TrudiHeaderTemplateDirective } from './directives/trudi-header-template.directive';
import { TrudiSingleSelectComponent } from './trudi-single-select/trudi-single-select.component';
import { TrudiMultiSelectComponent } from './trudi-multi-select/trudi-multi-select.component';
import { TrudiLabelTemplateDirective } from './directives/trudi-label-template.directive';
import { TrudiSelectReminderComponent } from './trudi-select-reminder/trudi-select-reminder.component';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TrudiGroupTemplateDirective } from './directives/trudi-group-template.directive';
import { NzTrimPipe } from 'ng-zorro-antd/pipes';
import { TrudiFormatDateTimeAbbrevPipe } from '../pipes/format-date-time-abbrev.pipe';
import { ClickOutsideDirective } from '../directives';
import {
  TrudiBadgeComponent,
  TrudiButtonComponent,
  TrudiIconComponent
} from '../views';
import { AngularSvgIconModule } from 'angular-svg-icon';
@NgModule({
  declarations: [
    TrudiFilterableCheckboxSelect,
    TrudiOptionTemplateDirective,
    TrudiFooterTemplateDirective,
    TrudiLabelTemplateDirective,
    TrudiSingleSelectComponent,
    TrudiMultiSelectComponent,
    TrudiSingleSelectComponent,
    TrudiSelectReminderComponent,
    TrudiGroupTemplateDirective,
    TrudiHeaderTemplateDirective
  ],
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    NgOptionHighlightModule,
    NzToolTipModule,
    NzTrimPipe,
    ClickOutsideDirective,
    TrudiFormatDateTimeAbbrevPipe,
    AngularSvgIconModule.forRoot(),
    TrudiButtonComponent,
    TrudiBadgeComponent,
    TrudiIconComponent
  ],
  exports: [
    TrudiFilterableCheckboxSelect,
    NgSelectModule,
    TrudiOptionTemplateDirective,
    NgOptionHighlightModule,
    TrudiGroupTemplateDirective,
    TrudiFooterTemplateDirective,
    TrudiHeaderTemplateDirective,
    TrudiLabelTemplateDirective,
    TrudiSingleSelectComponent,
    TrudiMultiSelectComponent,
    TrudiSingleSelectComponent,
    TrudiSelectReminderComponent
  ]
})
export class SelectModule {}
