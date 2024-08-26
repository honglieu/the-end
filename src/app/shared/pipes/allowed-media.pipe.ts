import { ALLOWED_MEDIA } from '@/app/services/constants';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'allowedMedia' })
export class AllowedMediaPipe implements PipeTransform {
  transform(fileName: string, mediaType: 'audio' | 'video'): boolean {
    if (!fileName || !mediaType) return false;
    const allowedMedia = ALLOWED_MEDIA[mediaType].types;

    return allowedMedia.some((type) => fileName.toLowerCase().endsWith(type));
  }
}
