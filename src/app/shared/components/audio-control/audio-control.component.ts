import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import dayjs from 'dayjs';
import { Subscription } from 'rxjs';

const LIST_RATE = ['0.25', '0.5', '0.75', '1', '1.25', '1.5', '1.75', '2'];

@Component({
  selector: 'audio-control',
  templateUrl: './audio-control.component.html',
  styleUrls: ['./audio-control.component.scss']
})
export class AudioControlComponent implements OnInit, OnChanges, OnDestroy {
  @Input() linkMedia: string = '';
  @Input() isCollapsed: boolean = false;
  @Input() listRate: string[] = LIST_RATE;
  @Input() isStop: boolean = false;
  @Output() onPlayEmitter: EventEmitter<void> = new EventEmitter<void>();
  @Output() onPauseEmitter: EventEmitter<void> = new EventEmitter<void>();
  @Output() ended: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild('progress') progress: ElementRef<HTMLElement>;
  @ViewChild('timeLine', { static: true }) timeLine: ElementRef<HTMLElement>;
  @ViewChild('tooltip', { static: true }) tooltip: ElementRef<HTMLElement>;
  @ViewChild('volumeLine', { static: true })
  volumeLine: ElementRef<HTMLElement>;
  @ViewChild('volumePercent', { static: true })
  volumePercent: ElementRef<HTMLElement>;
  @ViewChild('volumeControl', { static: true })
  volumeControl: ElementRef<HTMLElement>;

  public audio: HTMLAudioElement;
  public currentTime: string = '0:00';
  public duration: string = '0:00';
  public toolTipTime: string = '0:00';
  private routeSubscription: Subscription;

  constructor(private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.routeSubscription = this.router.events.subscribe(() => {
      this.onReset();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['linkMedia']?.currentValue) {
      this.onLoadMetadataAudio();
      this.onAddEventListener();
    }

    if (changes['isCollapsed'] && !changes['isCollapsed']?.currentValue) {
      this.onReset();
    }

    if (changes['isStop'] && changes['isStop']?.currentValue) {
      this.audio.pause();
    }
  }

  ngOnDestroy(): void {
    if (this.audio) {
      this.onReset();
    }

    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  onAddEventListener() {
    this.timeLine.nativeElement.addEventListener(
      'click',
      (e: MouseEvent) => (this.audio.currentTime = this.getTimeToSeek(e))
    );

    this.timeLine.nativeElement.addEventListener('mousemove', (e: MouseEvent) =>
      this.setTooltip(e.offsetX, this.getTimeDuration(this.getTimeToSeek(e)))
    );

    this.timeLine.nativeElement.addEventListener('mouseleave', () =>
      this.setTooltip()
    );

    this.volumeControl.nativeElement.addEventListener(
      'mouseleave',
      () => (this.timeLine.nativeElement.style.marginRight = '0')
    );

    this.volumeLine.nativeElement.addEventListener('click', (e: MouseEvent) =>
      this.setVolume(this.getVolume(e))
    );
  }

  onLoadMetadataAudio() {
    this.audio = new Audio(this.linkMedia);
    this.audio.onloadedmetadata = () => {
      this.duration = this.getTimeDuration(this.audio.duration);
      this.cdr.markForCheck();
    };

    this.audio.ontimeupdate = () => {
      this.currentTime = this.getTimeDuration(this.audio.currentTime);
      this.progress.nativeElement.setAttribute(
        'style',
        `width: ${(this.audio.currentTime / this.audio.duration) * 100}%`
      );
      this.cdr.markForCheck();
    };
    this.audio.onended = () => this.ended.emit();
  }

  onVolume(e: MouseEvent) {
    e?.stopPropagation();
    this.setVolume(this.audio.volume ? 0 : 1);
  }

  onPlay(e: MouseEvent) {
    e?.stopPropagation();
    if (this.audio.paused) {
      this.onPlayEmitter.emit();
      this.audio.play();
    } else {
      this.audio.pause();
      this.onPauseEmitter.emit();
    }
  }

  onReset() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  onPlayback(rate: number) {
    this.audio.playbackRate = rate;
  }

  setTooltip(pos = 0, duration = '0') {
    this.tooltip.nativeElement.setAttribute(
      'style',
      `left: ${pos + 92}px; opacity: ${pos}; display: ${pos ? 'flex' : 'none'}`
    );
    this.toolTipTime = duration;
    this.cdr.markForCheck();
  }

  setVolume(volume: number) {
    this.audio.volume = volume;
    this.volumePercent.nativeElement.style.width = `${volume * 100}%`;
  }

  onAction(e: MouseEvent) {
    e?.stopPropagation();
  }

  getVolume(e: MouseEvent) {
    e?.stopPropagation();
    const sliderWidth = window.getComputedStyle(
      this.volumeLine.nativeElement as Element
    ).width;

    return e.offsetX / parseInt(sliderWidth);
  }

  getTimeToSeek(e: MouseEvent) {
    e?.stopPropagation();
    const timelineWidth = window.getComputedStyle(
      this.timeLine.nativeElement as Element
    ).width;

    return (e.offsetX / parseInt(timelineWidth)) * this.audio.duration;
  }

  getTimeDuration(num: number): string {
    return dayjs.duration(num, 'seconds').format('m:ss');
  }
}
