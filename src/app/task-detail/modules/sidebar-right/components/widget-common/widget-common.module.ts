import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetCommonComponent } from './widget-common.component';
import { SharedModule } from '@shared/shared.module';
import { PreventButtonModule } from '@trudi-ui';

@NgModule({
  declarations: [WidgetCommonComponent],
  imports: [CommonModule, SharedModule, PreventButtonModule],
  exports: [WidgetCommonComponent]
})
export class WidgetCommonModule {}
