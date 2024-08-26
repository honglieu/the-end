import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import {
  RegionShowNamePipe,
  RegionTaskNamePipe,
  SelectSingleTaskTemplateComponent
} from './select-single-task-template/select-single-task-template.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzDropDownModule,
    NgOptionHighlightModule,
    CustomPipesModule,
    NzPopoverModule,
    NzToolTipModule,
    TrudiUiModule
  ],
  providers: [],
  declarations: [
    SelectSingleTaskTemplateComponent,
    RegionShowNamePipe,
    RegionTaskNamePipe
  ],
  exports: [SelectSingleTaskTemplateComponent]
})
export class SelectTaskTemplateModule {}
