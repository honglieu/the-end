import { NgModule } from '@angular/core';
import { SignerAvatarColorPipe } from './signer-avatar-color.pipe';
import { InitialsNamePipe } from './initials-name.pipe';

@NgModule({
  declarations: [InitialsNamePipe, SignerAvatarColorPipe],
  exports: [InitialsNamePipe, SignerAvatarColorPipe]
})
export class TaskDetailCustomPipesModule {}
