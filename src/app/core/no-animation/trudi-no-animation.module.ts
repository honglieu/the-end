import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TrudiNoAnimationDirective } from './trudi-no-animation.directive';

@NgModule({
  declarations: [TrudiNoAnimationDirective],
  exports: [TrudiNoAnimationDirective],
  imports: [CommonModule]
})
export class TrudiNoAnimationModule {}
