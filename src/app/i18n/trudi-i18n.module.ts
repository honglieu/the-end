import { NgModule } from '@angular/core';

import { TrudiI18nPipe } from './trudi-i18n.pipe';

@NgModule({
  declarations: [TrudiI18nPipe],
  exports: [TrudiI18nPipe]
})
export class TrudiI18nModule {}
