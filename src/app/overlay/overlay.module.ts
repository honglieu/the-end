import { NgModule } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';

import { OverlayComponent } from './overlay.component';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [OverlayModule, CommonModule],
  declarations: [OverlayComponent]
})
export class OverlayComponentModule {}
