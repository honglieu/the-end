import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Pipe({ name: 'fileCase' })
export class FileCasePipe implements PipeTransform {
  public dateFormatDay =
    this.agencyDateFormatService.dateFormat$.getValue().DATE_FORMAT_DAYJS;
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}
  public transform(str: string, arg1: any): string {
    let date = '';
    let size = '0';
    let fileType: string;
    if (str != null && str !== '') {
      if (str.startsWith('FILE')) {
        const res = str.split('|');
        if (res[5]) {
          const dateObj = new Date(res[5]);
          date = dayjs(dateObj).format(this.dateFormatDay);
        }
        if (res[3]) {
          const bytes = res[3];
          size = (parseInt(bytes, 0) / 1024 / 1024).toFixed(2);
        }
        if (res[2] != null && res[2] === 'image') {
          fileType = 'assets/images/file-office-img.png';
        } else if (res[2] != null && res[2] === 'pdf') {
          fileType = 'assets/images/file-office-pdf.png';
        } else {
          fileType = 'assets/images/file-office-doc.png';
        }

        if (arg1 === 'url') {
          return res[4];
        }
        let response = `<div class='chat-history-box-div'><div class='input-group m-t-10 messagsend'>`;
        response += `<span class='input-group-addon'><div class='black-bg'><span class='lft '>`;
        response += `<img src='${fileType}' alt='' width='17' height='19' /></span><span class='rht text-left'>`;
        // response += `<span class='title'> ${res[1]}</span>`;
        // response += `<br /><small>${date}•${size}MB</small></span></div></span></div></div>`;
        return response;
      } else {
        return `<p>${str}</p>`;
      }
    } else {
      return null;
    }
  }
}
