import { BidiModule } from '@angular/cdk/bidi';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TrudiOutletModule } from '@core';

import { PopupComponent } from './popup.component';
import { PopupSelectOptionComponent } from './popup-select-option.component';
import { TrudiUiModule } from '@trudi-ui';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';

@NgModule({
  declarations: [PopupComponent, PopupSelectOptionComponent],
  exports: [PopupComponent, PopupSelectOptionComponent],
  imports: [
    BidiModule,
    CommonModule,
    TrudiOutletModule,
    TrudiUiModule,
    SharePopUpModule
  ]
})
export class PopupModule {}
