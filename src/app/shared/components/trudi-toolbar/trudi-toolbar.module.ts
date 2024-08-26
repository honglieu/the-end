import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  ToolbarItemTemplateDirective,
  ToolbarCollapseButtonTemplateDirective,
  ToolbarItemDirective
} from './toolbar.directive';
import { TrudiToolbarComponent } from './trudi-toolbar.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { TrudiUiModule } from '@trudi-ui';
import { NzPopoverModule } from 'ng-zorro-antd/popover';

@NgModule({
  declarations: [
    TrudiToolbarComponent,
    ToolbarItemTemplateDirective,
    ToolbarCollapseButtonTemplateDirective,
    ToolbarItemDirective
  ],
  imports: [CommonModule, NzDropDownModule, TrudiUiModule, NzPopoverModule],
  exports: [
    TrudiToolbarComponent,
    ToolbarItemTemplateDirective,
    ToolbarCollapseButtonTemplateDirective,
    ToolbarItemDirective
  ]
})
export class TrudiToolbarModule {}
