import { NgModule } from '@angular/core';

import { TrudiConnectedOverlayDirective } from './trudi-connected-overlay';

@NgModule({
  declarations: [TrudiConnectedOverlayDirective],
  exports: [TrudiConnectedOverlayDirective]
})
export class TrudiOverlayModule {}
