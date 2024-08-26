import { Injector, ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrudiTextFieldComponent } from './form/trudi-text-field/trudi-text-field.component';
import { TrudiCheckboxButtonComponent } from './form/trudi-checkbox-button/trudi-checkbox-button.component';
import { TrudiCheckboxGroupComponent } from './form/trudi-checkbox-group/trudi-checkbox-group.component';
import { TrudiTagComponent } from './views/trudi-tag/trudi-tag.component';
import {
  IconPrefixDirective,
  IconSuffixDirective
} from './directives/button-icon.directive';
import { TrudiTabsComponent } from './views/trudi-tabs/trudi-tabs.component';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { TrudiMonthPickerComponent } from './form/trudi-month-picker/trudi-month-picker.component';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { TrudiFormControlComponent } from './form/trudi-form-control/trudi-form-control.component';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { TrudiMaxCharacterComponent } from './views/trudi-max-character/trudi-max-character.component';
import { TrudiCheckboxComponent } from '../lib/form/trudi-checkbox/trudi-checkbox.component';
import { TrudiQuoteComponent } from './views/trudi-quote/trudi-quote.component';
import { TrudiRadioButtonComponent } from './form/trudi-radio-button/trudi-radio-button.component';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { TrudiNumberFieldComponent } from './form/trudi-number-field/trudi-number-field.component';
import { TrudiModalComponent } from './views/trudi-modal/trudi-modal.component';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TrudiConfirmComponent } from './views/trudi-confirm/trudi-confirm.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { TrudiTextareaComponent } from './form/trudi-textarea/trudi-textarea.component';
import { HighlightSearch } from './pipes/highlight-text.pipe';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { TrudiCollapseWidgetComponent } from './views/trudi-widget/trudi-collapse-widget.component';
import { TrudiPdfViewerComponent } from './views/trudi-pdf-viewer/trudi-pdf-viewer.component';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import { CapitalizeFirstLetterDirective } from './directives/UppercaseFirstLetter.directive';
import { TrudiRadioButtonTemplateDirective } from './form/trudi-radio-button/trudi-radio-button-template.directive';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TrudiTableComponent } from './views/trudi-table/trudi-table.component';
import { TrudiPaginationComponent } from './views/trudi-table/components/trudi-pagination.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TrudiDrawerComponent } from './views/trudi-drawer/trudi-drawer.component';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { TrudiSwitchComponent } from './form/trudi-switch/trudi-switch.component';
import { TrudiTextFieldResizeDirective } from './directives/trudi-text-field-resize.directive';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { TrudiTooltipDirective } from './directives/trudi-tooltip.directive';
import { DonutChartComponent } from './chart/donut-chart/donut-chart.component';
import { BarChartComponent } from './chart/bar-chart/bar-chart.component';
import { TrudiLineChartComponent } from './chart/trudi-line-chart/trudi-line-chart.component';
import { StackBarChartComponent } from './chart/stack-bar-chart/stack-bar-chart.component';
import { TrudiSelectDropdownComponent } from './form/trudi-select-dropdown/trudi-select-dropdown.component';
import { ChartWrapperComponent } from './chart/chart-wrapper/chart-wrapper.component';
import {
  TrudiSelectDropdownFooterTemplateDirective,
  TrudiSelectDropdownGroupTemplateDirective,
  TrudiSelectDropdownHeaderTemplateDirective,
  TrudiSelectDropdownOptionTemplateDirective,
  TrudiSelectDropdownTitleTemplateDirective,
  TrudiSelectDropdownNoResultsTemplateDirective
} from '../lib/form/trudi-select-dropdown/trudi-select-dropdown-template.directive';
import { TrudiCollapseComponent } from './views/trudi-collapse/trudi-collapse.component';
import { TrudiDatePickerModule } from './date-picker/date-picker.module';
import { MentionModule } from './directives/trudi-mention/mention.module';
import { NzNoAnimationModule } from 'ng-zorro-antd/core/no-animation';
import { TrudiWorkflowsComponent } from './views/workflow/trudi-workflows/trudi-workflows.component';
import { TrudiWorkflowComponent } from './views/workflow/trudi-workflows/trudi-workflow/trudi-workflow.component';
import { TrudiWorkflowContentDirective } from './views/workflow/directive/trudi-workflow-content.directive';
import { TrudiWorkflowCheckedDirective } from './views/workflow/directive/trudi-workflow-checked.directive';
import { TrudiWorkflowUncheckDirective } from './views/workflow/directive/trudi-workflow-uncheck.directive';
import { IntersectionObserverDirective } from './directives/intersection-observer.directive';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AvatarCheckPipe } from '../lib/form/trudi-select-dropdown/trudi-select-dropdown.pipe';
import { TrudiSelectDropdownV2Component } from './form/trudi-select-dropdown/trudi-select-dropdown-v2/trudi-select-dropdown-v2/trudi-select-dropdown-v2.component';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { NumberOnlyDirective } from './common/directives/number-only.directive';
import {
  PreventButtonModule,
  TRUDI_MODAL_MANAGER
} from './common/prevent-button';
import { LettersOnlyDirective } from './common/directives/letters-only.directive';
import { PhoneNumberHighlight } from './common/directives/phone-number-highlight.directive';
import { E2eAttributeDirective } from './common/directives/e2e-attriebute.directive';
import { CloseDropdownWhenResizableDirective } from './common/directives/close.directive';
import { MenuKeyboardDirective } from './common/directives/menu-keyboard.directive';
import { FocusElementDirective } from './common/directives/focus-element.directive';
import { IS_RM_CRM, TRUDI_DATE_FORMAT } from './provider/trudi-config';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import isLeapYear from 'dayjs/plugin/isLeapYear';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
import updateLocale from 'dayjs/plugin/updateLocale';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { SelectModule } from './select';
import { TrudiFormatFullnamePipe } from './pipes/format-fullname.pipe';
import { TrudiTotalCountPipe } from './pipes/total-count.pipe';
import { Observable } from 'rxjs';
import { TrudiDateFormat, TrudiModalManager } from './interfaces';
import { AngularSvgIconModule } from 'angular-svg-icon';
import {
  TrudiBadgeComponent,
  TrudiButtonComponent,
  TrudiIconComponent
} from './views';
import { TrudiUserTypeInRmPipe } from './pipes';

export interface TrudiUiConfig {
  isRmCrmFactory?: (injector: Injector) => Observable<boolean>;
  trudiDateFormatFactory?: (injector: Injector) => TrudiDateFormat;
  trudiModalManagerFactory?: (injector: Injector) => TrudiModalManager;
}

dayjs.extend(isLeapYear);
dayjs.extend(duration);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(isBetween);
dayjs.extend(updateLocale);
dayjs.locale('en');
dayjs.updateLocale('en', {
  weekStart: 1
});
dayjs.extend(quarterOfYear);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

@NgModule({
  declarations: [
    TrudiWorkflowContentDirective,
    TrudiWorkflowsComponent,
    TrudiWorkflowComponent,
    TrudiWorkflowUncheckDirective,
    TrudiWorkflowCheckedDirective,
    TrudiTextFieldComponent,
    TrudiCheckboxButtonComponent,
    TrudiCheckboxGroupComponent,
    TrudiCheckboxComponent,
    TrudiTagComponent,
    IconPrefixDirective,
    IconSuffixDirective,
    TrudiMonthPickerComponent,
    TrudiTextFieldComponent,
    TrudiTabsComponent,
    TrudiMonthPickerComponent,
    TrudiFormControlComponent,
    TrudiMaxCharacterComponent,
    TrudiQuoteComponent,
    TrudiRadioButtonComponent,
    TrudiNumberFieldComponent,
    TrudiModalComponent,
    TrudiConfirmComponent,
    TrudiTextareaComponent,
    HighlightSearch,
    TrudiCollapseWidgetComponent,
    TrudiPdfViewerComponent,
    CapitalizeFirstLetterDirective,
    TrudiRadioButtonTemplateDirective,
    TrudiTableComponent,
    TrudiPaginationComponent,
    TrudiDrawerComponent,
    TrudiSwitchComponent,
    TrudiTextFieldResizeDirective,
    TrudiTooltipDirective,
    TrudiLineChartComponent,
    DonutChartComponent,
    BarChartComponent,
    StackBarChartComponent,
    TrudiSelectDropdownComponent,
    ChartWrapperComponent,
    TrudiSelectDropdownTitleTemplateDirective,
    TrudiSelectDropdownOptionTemplateDirective,
    TrudiSelectDropdownHeaderTemplateDirective,
    TrudiSelectDropdownFooterTemplateDirective,
    TrudiSelectDropdownGroupTemplateDirective,
    TrudiSelectDropdownNoResultsTemplateDirective,
    TrudiCollapseComponent,
    IntersectionObserverDirective,
    AvatarCheckPipe,
    TrudiSelectDropdownV2Component,
    TrudiFormatFullnamePipe,
    TrudiTotalCountPipe
  ],
  exports: [
    TrudiWorkflowCheckedDirective,
    TrudiWorkflowContentDirective,
    TrudiWorkflowUncheckDirective,
    TrudiWorkflowsComponent,
    TrudiWorkflowComponent,
    NumberOnlyDirective,
    TrudiTextFieldComponent,
    TrudiCheckboxButtonComponent,
    TrudiCheckboxGroupComponent,
    TrudiCheckboxComponent,
    TrudiTagComponent,
    TrudiTabsComponent,
    IconPrefixDirective,
    IconSuffixDirective,
    TrudiMonthPickerComponent,
    TrudiFormControlComponent,
    TrudiQuoteComponent,
    TrudiRadioButtonComponent,
    TrudiNumberFieldComponent,
    ClickOutsideDirective,
    TrudiModalComponent,
    TrudiConfirmComponent,
    TrudiTextareaComponent,
    LettersOnlyDirective,
    HighlightSearch,
    TrudiCollapseWidgetComponent,
    TrudiPdfViewerComponent,
    CapitalizeFirstLetterDirective,
    TrudiRadioButtonTemplateDirective,
    TrudiTableComponent,
    TrudiPaginationComponent,
    TrudiDrawerComponent,
    TrudiSwitchComponent,
    TrudiTextFieldResizeDirective,
    TrudiTooltipDirective,
    TrudiLineChartComponent,
    DonutChartComponent,
    BarChartComponent,
    StackBarChartComponent,
    TrudiSelectDropdownComponent,
    ChartWrapperComponent,
    TrudiSelectDropdownTitleTemplateDirective,
    TrudiSelectDropdownOptionTemplateDirective,
    TrudiSelectDropdownHeaderTemplateDirective,
    TrudiSelectDropdownFooterTemplateDirective,
    TrudiSelectDropdownGroupTemplateDirective,
    TrudiSelectDropdownNoResultsTemplateDirective,
    TrudiCollapseComponent,
    TrudiDatePickerModule,
    MentionModule,
    IntersectionObserverDirective,
    TrudiSelectDropdownV2Component,
    PhoneNumberHighlight,
    SelectModule,
    TrudiFormatFullnamePipe,
    TrudiTotalCountPipe,
    PreventButtonModule,
    TrudiButtonComponent,
    TrudiIconComponent,
    TrudiBadgeComponent,
    TrudiUserTypeInRmPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgSelectModule,
    ScrollingModule,
    NumberOnlyDirective,
    //import modules from ng-zorro-antd
    NzDatePickerModule,
    NzTabsModule,
    NzDropDownModule,
    NgOptionHighlightModule,
    NzRadioModule,
    NzModalModule,
    NzMenuModule,
    NzCollapseModule,
    PdfJsViewerModule,
    NzTableModule,
    NzToolTipModule,
    NzDrawerModule,
    PdfJsViewerModule,
    NgxMaskDirective,
    NgxMaskPipe,
    NzPopoverModule,
    TrudiDatePickerModule,
    NzNoAnimationModule,
    MentionModule,
    PreventButtonModule,
    PhoneNumberHighlight,
    LettersOnlyDirective,
    PhoneNumberHighlight,
    E2eAttributeDirective,
    CloseDropdownWhenResizableDirective,
    MenuKeyboardDirective,
    FocusElementDirective,
    ClickOutsideDirective,
    SelectModule,
    TrudiUserTypeInRmPipe,
    TrudiButtonComponent,
    TrudiBadgeComponent,
    TrudiIconComponent,
    AngularSvgIconModule.forRoot()
  ],
  providers: [provideNgxMask()]
})
export class TrudiUiModule {
  static forRoot({
    isRmCrmFactory,
    trudiDateFormatFactory,
    trudiModalManagerFactory
  }: TrudiUiConfig): ModuleWithProviders<TrudiUiModule> {
    return {
      ngModule: TrudiUiModule,
      providers: [
        {
          provide: IS_RM_CRM,
          useFactory: isRmCrmFactory,
          deps: [Injector]
        },
        {
          provide: TRUDI_MODAL_MANAGER,
          useFactory: trudiModalManagerFactory,
          deps: [Injector]
        },
        {
          provide: TRUDI_DATE_FORMAT,
          useFactory: trudiDateFormatFactory,
          deps: [Injector]
        }
      ]
    };
  }
}
