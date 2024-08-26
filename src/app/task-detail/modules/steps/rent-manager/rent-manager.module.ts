import { NgModule } from '@angular/core';
import { TrudiUiModule } from '@trudi-ui';
import { SharedModule as SharedAppModule } from '@shared/shared.module';
import { CommonModule } from '@angular/common';
import { RentManagerComponent } from './rent-manager.component';
import { SharedModule } from '@/app/task-detail/modules/steps/shared/shared.module';
import { UpdateRmPopupComponent } from './update-rm-popup/update-rm-popup.component';
import { SelectModule } from '@trudi-ui';
@NgModule({
  declarations: [RentManagerComponent, UpdateRmPopupComponent],
  imports: [
    SharedModule,
    TrudiUiModule,
    SharedAppModule,
    CommonModule,
    SelectModule
  ],
  exports: [RentManagerComponent, UpdateRmPopupComponent]
})
export class RentManagerBaseModule {}
