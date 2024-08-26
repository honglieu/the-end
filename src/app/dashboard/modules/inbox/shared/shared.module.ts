import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmptyFocusedViewPageComponent } from './components/empty-focused-view-page/empty-focused-view-page.component';

@NgModule({
  declarations: [EmptyFocusedViewPageComponent],
  imports: [CommonModule],
  exports: [EmptyFocusedViewPageComponent]
})
export class SharedModule {}
