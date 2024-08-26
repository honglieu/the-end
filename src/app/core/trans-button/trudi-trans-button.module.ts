import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TrudiTransButtonDirective } from './trudi-trans-button.directive';

@NgModule({
  declarations: [TrudiTransButtonDirective],
  exports: [TrudiTransButtonDirective],
  imports: [CommonModule]
})
export class TrudiTransButtonModule {}
