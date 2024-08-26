import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TrudiUiModule } from '@trudi-ui';
import { PopupSelectFileComponent } from './popup-select-file.component';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [PopupSelectFileComponent],
  imports: [CommonModule, TrudiUiModule, RxPush],
  exports: [PopupSelectFileComponent]
})
export class PopupSelectFileModule {}
