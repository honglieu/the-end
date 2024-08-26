import { NgModule } from '@angular/core';
import { RemainingCharacterComponent } from './remaining-character.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [RemainingCharacterComponent],
  exports: [RemainingCharacterComponent],
  imports: [CommonModule]
})
export class RemainingCharacterModule {}
