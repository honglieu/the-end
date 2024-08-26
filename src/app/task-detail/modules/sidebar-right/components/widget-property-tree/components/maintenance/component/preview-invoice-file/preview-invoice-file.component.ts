import { Component, Input, OnInit } from '@angular/core';
import { EAvailableFileIcon } from '@shared/types/file.interface';

@Component({
  selector: 'preview-invoice-file',
  templateUrl: './preview-invoice-file.component.html',
  styleUrls: ['./preview-invoice-file.component.scss']
})
export class PreviewInvoiceFileComponent implements OnInit {
  @Input() fileType: EAvailableFileIcon = EAvailableFileIcon.Other;
  @Input() fileLink: string = '';

  eAvailableFileIcon = EAvailableFileIcon;

  constructor() {}
  ngOnInit(): void {}
}
