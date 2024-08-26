import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'avatarCheck'
})
export class AvatarCheckPipe implements PipeTransform {
  transform(avatarUrl: string): boolean {
    return avatarUrl && !avatarUrl.includes('google_avatar');
  }
}
