import { FileUploadService } from '@services/fileUpload.service';
import { FilesService } from '@services/files.service';
import { Injectable } from '@angular/core';

@Injectable()
export class UserProfileService {
  constructor(
    private fileUpload: FileUploadService,
    private filesService: FilesService
  ) {}

  public async getBase64ImageFromUrl(imageUrl: string) {
    try {
      const res = await fetch(imageUrl, { mode: 'cors', cache: 'no-cache' });
      const blob = await res.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener(
          'load',
          function () {
            resolve(reader.result);
          },
          false
        );

        reader.onerror = () => {
          return reject(this);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  public async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener(
        'load',
        function () {
          resolve(reader.result);
        },
        false
      );

      reader.onerror = () => {
        return reject(this);
      };
      reader.readAsDataURL(file);
    });
  }

  public getFilledPercentZoom() {
    const slider = document.getElementsByClassName(
      'cr-slider'
    )[0] as HTMLInputElement;
    if (slider) {
      const maxValue = Number(slider.getAttribute('max'));
      const minValueRaw = Number(slider.getAttribute('min'));
      const minValue = minValueRaw >= 0 ? minValueRaw : 0;
      const percent =
        ((slider.valueAsNumber - minValue) / (maxValue - minValue)) * 100;
      slider.setAttribute('style', `--red: ${percent}%`);
    }
  }

  public async handleFileUpload(file) {
    const { name, type, size, localThumb } = file || {};

    const infoLink = await this.fileUpload.uploadFile(file);

    return {
      title: name,
      fileName: name,
      fileSize: size,
      fileType: type,
      mediaLink: infoLink?.Location,
      mediaType: this.filesService.getFileTypeSlash(file?.type),
      icon: this.filesService.getFileIcon(file?.name),
      localThumb
    };
  }
}
