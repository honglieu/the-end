import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppUnhappyPathTrudiComponent } from './app-unhappy-path-trudi.component';
import { CreateNewContactPopupComponent } from './create-new-contact-popup/create-new-contact-popup.component';
import { SharedModule } from '@shared/shared.module';
import { OverlayModule } from '@angular/cdk/overlay';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [CreateNewContactPopupComponent, AppUnhappyPathTrudiComponent],
  imports: [
    CommonModule,
    SharedModule,
    TrudiUiModule,
    OverlayModule,
    InfiniteScrollModule
  ],
  exports: [AppUnhappyPathTrudiComponent]
})
export class AppUnhappyPathTrudiModule {}
