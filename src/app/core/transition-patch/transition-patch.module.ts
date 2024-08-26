import { PlatformModule } from '@angular/cdk/platform';
import { NgModule } from '@angular/core';

import { TrudiTransitionPatchDirective } from './transition-patch.directive';

@NgModule({
  imports: [PlatformModule],
  exports: [TrudiTransitionPatchDirective],
  declarations: [TrudiTransitionPatchDirective]
})
export class TrudiTransitionPatchModule {}
