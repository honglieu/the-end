import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'avatar-skeleton',
  templateUrl: './avatar-skeleton.component.html',
  styleUrls: ['./avatar-skeleton.component.scss']
})
export class AvatarSkeletonComponent implements OnInit {
  @Input() src: string = '';
  public image: HTMLImageElement;
  public isLoading: boolean = true;

  constructor() {}

  ngOnInit(): void {
    this.image = new Image();
    this.image.src = this.src;
    this.image.onload = () => (this.isLoading = false);
  }
}
