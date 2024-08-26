import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { listThumbnailExtension } from '@services/constants';
import { FilesService } from '@services/files.service';
import { IFileFromCRM } from '@shared/components/upload-from-crm/upload-from-crm.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Component({
  selector: 'file-row',
  templateUrl: './file-row.component.html',
  styleUrls: ['./file-row.component.scss']
})
export class FileRowComponent implements OnInit {
  @Input() rowData: IFileFromCRM;
  @Input() checked: boolean;
  @Input() lastRowData: boolean;
  @Output() fileEmit = new EventEmitter<any>();
  public fileType: string;
  public fileIcon: string;
  public linkMp4: string;
  public size = 28;

  constructor(
    public filesService: FilesService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rowData']?.currentValue) {
      this.setFileType();
    }
  }
  ngOnInit() {
    this.setFileType();
  }

  handleChangeSelected(event: boolean, dataRow: IFileFromCRM) {
    this.fileEmit.emit({ ...dataRow, isSelected: event });
  }

  trackByListEvent(_, row: IFileFromCRM) {
    return row.id;
  }

  setFileType() {
    const fileTypeDot = this.filesService.getFileTypeDot(this.rowData.name);
    if (!this.rowData?.fileType?.name && !fileTypeDot) return;
    this.fileType =
      this.filesService.getFileTypeSlash(this.rowData.fileType?.name) ||
      fileTypeDot;
    if (listThumbnailExtension.includes(fileTypeDot)) {
      this.fileType = fileTypeDot;
    }
    this.fileIcon = this.filesService.getFileIcon(this.rowData.name);
    this.getThumbnailMP4(this.rowData.mediaLink);
  }

  getThumbnailMP4(link: string) {
    this.linkMp4 = link + '#t=5';
  }
}
