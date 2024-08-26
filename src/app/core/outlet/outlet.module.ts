import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TrudiStringTemplateOutletDirective } from './string_template_outlet.directive';

@NgModule({
  imports: [CommonModule],
  exports: [TrudiStringTemplateOutletDirective],
  declarations: [TrudiStringTemplateOutletDirective]
})
export class TrudiOutletModule {}
