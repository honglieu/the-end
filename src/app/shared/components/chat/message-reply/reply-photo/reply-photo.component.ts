import { IFile } from '@/app/shared/types/file.interface';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'reply-photo',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="image-wrapper" [ngClass]="classes">
    <img
      (error)="handleImgError($event)"
      class="file-image"
      src="{{
        file.mediaLink ? file.mediaLink : 'assets/images/icons/image.svg'
      }}" />
  </div> `,
  styles: `
  .image-wrapper {
    width: 80px;
    height: 80px;
    img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
    }
  }
  `
})
export class ReplyPhotoComponent {
  @Input() classes: { [key: string]: boolean } = {};
  @Input() file: IFile = null;

  handleImgError($event: Event) {
    ($event.target as HTMLImageElement).src =
      '/assets/icon/icon-loading-image.svg';
  }
}
