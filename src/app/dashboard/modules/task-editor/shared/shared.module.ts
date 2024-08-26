import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublishedTaskTemplatePopupComponent } from './components/published-task-template-popup/published-task-template-popup.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WarningUnpublishPopupComponent } from './components/warning-unpublish-popup/warning-unpublish-popup.component';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [
    PublishedTaskTemplatePopupComponent,
    WarningUnpublishPopupComponent
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TrudiUiModule],
  exports: [PublishedTaskTemplatePopupComponent, WarningUnpublishPopupComponent]
})
export class SharedModule {}
