import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { PromotionsModalComponent } from './promotions-modal.component';

@NgModule({
  declarations: [PromotionsModalComponent],
  imports: [CommonModule, SharedModule],
  exports: [PromotionsModalComponent]
})
export class PromotionsModalModule {}
