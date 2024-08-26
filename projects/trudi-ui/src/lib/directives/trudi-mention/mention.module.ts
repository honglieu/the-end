import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TrudiMentionDirective } from './trudi-mention.directive';
import { TrudiMentionComponent } from './trudi-mention.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { TwoCharacterTextPipe } from '../../pipes/two-character-text.pipe';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

@NgModule({
  declarations: [
    TrudiMentionDirective,
    TrudiMentionComponent,
    TwoCharacterTextPipe
  ],
  imports: [CommonModule, NzMenuModule, NzDropDownModule],
  exports: [TrudiMentionDirective]
})
export class MentionModule {}
