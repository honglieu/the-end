import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TinyEditorContainerComponent } from './tiny-editor-container.component';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [TinyEditorContainerComponent],
  imports: [CommonModule, SharedModule],
  exports: [TinyEditorContainerComponent]
})
export class TinyEditorContainerModule {}
