import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreventButtonDirective } from './prevent-button.directive';

@NgModule({
  declarations: [PreventButtonDirective],
  exports: [PreventButtonDirective],
  imports: [CommonModule]
})
export class PreventButtonModule {}
