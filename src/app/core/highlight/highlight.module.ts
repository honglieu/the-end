import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TrudiHighlightPipe } from './highlight.pipe';

@NgModule({
  imports: [CommonModule],
  exports: [TrudiHighlightPipe],
  declarations: [TrudiHighlightPipe]
})
export class TrudiHighlightModule {}
