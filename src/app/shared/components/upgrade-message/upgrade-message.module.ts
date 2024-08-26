import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpgradeMessageComponent } from './upgrade-message.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TrudiUiModule],
  declarations: [UpgradeMessageComponent],
  exports: [UpgradeMessageComponent]
})
export class UpgradeMessageModule {}
