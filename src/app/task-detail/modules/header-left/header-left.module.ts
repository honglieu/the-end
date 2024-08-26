import { HeaderContainerComponent } from './header-container/header-container.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderLeftComponent } from './header-left.component';
import { SharedModule } from '@shared/shared.module';
import { TitleConverstationDropdownComponent } from './components/title-converstation-dropdown/title-converstation-dropdown.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzNoAnimationModule } from 'ng-zorro-antd/core/no-animation';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { MsgAttachmentLoadModule } from '@shared/components/msg-attachment-load/msg-attachment-load.module';
import { EditTitleComponent } from './components/edit-title/edit-title.component';
import { PreventButtonModule, TrudiUiModule } from '@trudi-ui';
import { PropertyProfileModule } from '@shared/components/property-profile/property-profile.module';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [
    HeaderContainerComponent,
    HeaderLeftComponent,
    TitleConverstationDropdownComponent,
    EditTitleComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    NzDropDownModule,
    NzNoAnimationModule,
    NzSkeletonModule,
    NzToolTipModule,
    MsgAttachmentLoadModule,
    PreventButtonModule,
    PropertyProfileModule,
    RxPush,
    TrudiUiModule
  ],
  exports: [
    HeaderLeftComponent,
    TitleConverstationDropdownComponent,
    HeaderContainerComponent
  ]
})
export class HeaderLeftModule {}
