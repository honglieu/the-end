import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TrudiUiModule } from '@trudi-ui';
import { MediaCardComponent } from './media-card.component';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [MediaCardComponent],
  imports: [CommonModule, TrudiUiModule, RxPush],
  exports: [MediaCardComponent]
})
export class MediaCardModule {}
