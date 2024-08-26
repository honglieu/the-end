import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent
  implements OnDestroy, AfterViewInit, OnChanges
{
  @ViewChild('video') videoPlayer: ElementRef;
  @Input() mediaLink: string;
  @Input() isActive: boolean;
  @Input() poster: string;

  private readonly videoControlEvents = [
    'play',
    'pause',
    'fullscreenchange',
    'volumechange',
    'seeked'
  ];
  constructor() {}

  ngAfterViewInit() {
    this.addEventListeners();
  }

  ngOnDestroy() {
    this.removeEventListeners();
  }

  private addEventListeners() {
    if (this.videoPlayer) {
      const video = this.videoPlayer?.nativeElement;
      this.videoControlEvents.forEach((event) => {
        video.addEventListener(event, this.focusVideo);
      });
    }
  }

  private removeEventListeners() {
    if (this.videoPlayer) {
      const video = this.videoPlayer.nativeElement;
      this.videoControlEvents.forEach((event) => {
        video.removeEventListener(event, this.focusVideo);
      });
    }
  }

  private focusVideo = () => {
    if (this.isActive && this.videoPlayer) {
      this.videoPlayer.nativeElement?.focus();
    }
  };

  ngOnChanges() {
    this.restartVideo();
  }

  restartVideo() {
    if (this.videoPlayer) {
      this.videoPlayer.nativeElement.pause();
    }
  }
}
