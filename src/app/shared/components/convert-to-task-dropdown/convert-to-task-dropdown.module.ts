import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConvertToTaskDropdownComponent } from './convert-to-task-dropdown.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  declarations: [ConvertToTaskDropdownComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharePopUpModule,
    ScrollingModule
  ],
  exports: [ConvertToTaskDropdownComponent]
})
export class ConvertToTaskDropdownModule {}
