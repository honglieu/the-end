import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OutsideClickListenerDirective } from './outsideClickListenerDirective';

@NgModule({
  declarations: [OutsideClickListenerDirective],
  imports: [CommonModule],
  exports: [OutsideClickListenerDirective]
})
export class ClickOutsideModule {}
