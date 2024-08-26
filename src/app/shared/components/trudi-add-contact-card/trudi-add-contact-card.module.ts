import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrudiAddContactCardComponent } from './trudi-add-contact-card.component';
import { TrudiSelectReceiverContactCardComponent } from '@shared/components/trudi-select-receiver-contact-card/trudi-select-receiver-contact-card.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TrudiUiModule } from '@trudi-ui';
import { NgSelectModule } from '@ng-select/ng-select';
import { TrudiAddContactCardService } from './services/trudi-add-contact-card.service';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { HoverTemplateDirective } from '@shared/directives/hover-template.directive';
import { CircleAvatarComponent } from '@shared/components/circle-avatar/circle-avatar.component';

@NgModule({
  declarations: [
    TrudiAddContactCardComponent,
    TrudiSelectReceiverContactCardComponent,
    HoverTemplateDirective,
    CircleAvatarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TrudiUiModule,
    NgOptionHighlightModule,
    NzToolTipModule,
    ScrollingModule,
    NgSelectModule,
    CustomPipesModule
  ],
  providers: [TrudiAddContactCardService, TrudiTitleCasePipe],
  exports: [
    TrudiAddContactCardComponent,
    TrudiSelectReceiverContactCardComponent,
    HoverTemplateDirective,
    CircleAvatarComponent
  ]
})
export class TrudiAddContactCardModule {}
