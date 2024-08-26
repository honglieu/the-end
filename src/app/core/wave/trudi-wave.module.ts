import { PlatformModule } from '@angular/cdk/platform';
import { NgModule } from '@angular/core';

import { TrudiWaveDirective } from './trudi-wave.directive';

@NgModule({
  imports: [PlatformModule],
  exports: [TrudiWaveDirective],
  declarations: [TrudiWaveDirective]
})
export class TrudiWaveModule {}
