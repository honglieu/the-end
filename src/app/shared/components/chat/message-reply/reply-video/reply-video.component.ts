import { IFile } from '@/app/shared/types/file.interface';
import { TrudiUiModule } from '@trudi-ui';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'reply-video',
  standalone: true,
  imports: [TrudiUiModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="video-wrapper dim-brightness" [ngClass]="classes">
      <img
        (error)="handleImgError($event)"
        [src]="file.thumbMediaLink || '/assets/images/icons/video.svg'"
        alt="video"
        class="video-tag" />
      <trudi-icon
        class="play-icon"
        svgClass="size-32"
        icon="playSolid"></trudi-icon>
    </div>
  `,
  styles: `
  .video-wrapper {
    width: 80px;
    height: 80px;
    position: relative;
    overflow: hidden;
    img {
      width: 80px;
      height: 80px;
      border-radius: 4px;
      object-fit: cover;
    }
    .video-thumb {
      object-fit: cover;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
    }
    .play-icon {
      position: absolute;
      left: 50%;
      top: 50%;
      z-index: 3;
      transform: translate(-50%, -50%);
    }
  }
  `
})
export class ReplyVideoComponent {
  @Input() classes: { [key: string]: boolean } = {};
  @Input() file: IFile = null;

  handleImgError($event: Event) {
    ($event.target as HTMLImageElement).src =
      '/assets/icon/icon-loading-image.svg';
  }
}
