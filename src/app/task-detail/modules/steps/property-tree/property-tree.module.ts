import { NgModule } from '@angular/core';
import { PropertyTreeComponent } from './property-tree.component';
import { SharedModule } from '@/app/task-detail/modules/steps/shared/shared.module';
import { UpdatePTPopupComponent } from './update-pt-popup/update-pt-popup.component';
import { TrudiUiModule } from '@trudi-ui';
import { SharedModule as SharedAppModule } from '@shared/shared.module';
import { CommonModule } from '@angular/common';
import { PreventButtonModule } from '@trudi-ui';
@NgModule({
  declarations: [PropertyTreeComponent, UpdatePTPopupComponent],
  imports: [
    SharedModule,
    TrudiUiModule,
    SharedAppModule,
    CommonModule,
    PreventButtonModule
  ],
  exports: [PropertyTreeComponent, UpdatePTPopupComponent]
})
export class PropertyTreeBaseModule {}
