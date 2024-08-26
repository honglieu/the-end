import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { FilesService } from '@services/files.service';

@Component({
  selector: 'app-image-detail',
  templateUrl: './image-detail.component.html',
  styleUrls: ['./image-detail.component.scss']
})
export default class ImageDetailComponent implements OnChanges {
  @Input() imageUrl: string = '';
  @Input() open = false;
  @Output() onClose = new EventEmitter();
  public imageName = '';

  public currentAgencyName: ECRMSystem;
  constructor(public fileService: FilesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']?.currentValue) {
      this.getImageName();
    }
  }

  closeImageDetail() {
    this.onClose.emit();
  }

  downloadFile() {
    this.fileService.downloadResource(this.imageUrl, this.imageName);
  }

  getImageName() {
    const parts = this.imageUrl.split('/');
    const filename = parts.pop();
    this.imageName = filename;
  }
}
