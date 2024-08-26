import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TrudiElementPatchDirective } from './element-patch.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [TrudiElementPatchDirective],
  exports: [TrudiElementPatchDirective]
})
export class TrudiElementPatchModule {}
