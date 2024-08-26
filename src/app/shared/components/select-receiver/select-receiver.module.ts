import { SelectReceiverContainerForBulkComponent } from './select-receiver-container-for-bulk/select-receiver-container-for-bulk.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { SharedModule } from '@shared/shared.module';
import { SelectReceiverContainerComponent } from './select-receiver-container/select-receiver-container.component';
import { SelectReceiverComponent } from './select-receiver/select-receiver.component';
import { SelectSpecificReceiverComponent } from './select-specific-receiver/select-specific-receiver.component';
import { SelectReceiverPreviewComponent } from './select-receiver-preview/select-receiver-preview.component';
import { SelectContactTypeComponent } from './select-contact-type/select-contact-type.component';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [
    SelectReceiverComponent,
    SelectReceiverPreviewComponent,
    SelectReceiverContainerComponent,
    SelectSpecificReceiverComponent,
    SelectContactTypeComponent,
    SelectReceiverContainerForBulkComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    TrudiUiModule
  ],
  exports: [
    SelectReceiverContainerComponent,
    SelectReceiverContainerForBulkComponent,
    SelectContactTypeComponent
  ],
  providers: [ContactTitleByConversationPropertyPipe]
})
export class SelectReceiverModule {}
