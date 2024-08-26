import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { CheckBoxImgPath } from '@shared/enum/share.enum';
import { PhotoType } from '@shared/types/task.interface';

@Component({
  selector: 'preview-image-video-box',
  templateUrl: './preview-image-video-box.component.html',
  styleUrls: ['./preview-image-video-box.component.scss']
})
export class PreviewImageVideoBoxComponent implements OnInit, OnChanges {
  @Input() fileData: PhotoType;
  @Input() canSelected = false;
  @Input() isChangeSize: boolean = false;

  public CheckBoxImgPath = CheckBoxImgPath;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {}

  handleVideoError() {
    this.fileData.formatSrc = 'unSVideo';
  }

  handleSelectImg() {
    if (this.canSelected) {
      this.fileData.checked = !this.fileData?.checked;
    }
  }
}
