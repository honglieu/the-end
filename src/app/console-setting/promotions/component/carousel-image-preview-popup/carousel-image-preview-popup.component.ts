import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import Croppie from 'croppie';
import { PromotionsService } from '@/app/console-setting/promotions/services/promotions.service';
import { FilesService } from '@services/files.service';
import { FileUploadService } from '@services/fileUpload.service';
import { IFileUploadCarousel } from '@/app/console-setting/promotions/utils/promotions.interface';
import { IMAGE_TYPE_SUPPORT_CAROUSEL } from '@/app/console-setting/promotions/utils/type';
enum ESliderType {
  MINUS = 'MINUS',
  PLUS = 'PLUS'
}

@Component({
  selector: 'carousel-image-preview-popup',
  templateUrl: './carousel-image-preview-popup.component.html',
  styleUrls: ['./carousel-image-preview-popup.component.scss']
})
export class CarouselImagePreviewPopupComponent
  implements OnInit, AfterViewInit
{
  @Input() isShowCarouselImagePreviewPopup: boolean = false;
  @Input() fileUploadLocal: IFileUploadCarousel[];
  @Input() currentFile: IFileUploadCarousel[];
  @Output() closePopup = new EventEmitter();
  @Output() getListFile = new EventEmitter();
  @ViewChild('carouselImage', { static: true }) carouselImageElm: ElementRef;
  public myCroppie: any;
  public sliderType = ESliderType;
  public listFile = [];
  public imageChangedEvent: any;
  readonly acceptImageType = IMAGE_TYPE_SUPPORT_CAROUSEL;

  constructor(
    private filesService: FilesService,
    public promotionsService: PromotionsService,
    private fileUpload: FileUploadService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const mediaLink =
      this.fileUploadLocal[this.fileUploadLocal.length - 1].mediaLink;

    this.getBase64ImageFromUrl(mediaLink).then((result) => {
      this.getCroppie(mediaLink);
      this.promotionsService.promotionUploadedFile$.subscribe((res) => {
        if (!res) return;
        this.readFile(res).then((result) => {
          this.getCroppie(result);
          const cropperContainerElm =
            document.getElementsByClassName('croppie-container');
          cropperContainerElm[0]?.replaceWith(cropperContainerElm[1]);
          this.listenChangeZoomValue();
          const slider = document.getElementsByClassName(
            'cr-slider'
          )[0] as HTMLInputElement;
          const minValue = Number(slider.getAttribute('min'));
          slider.setAttribute('min', String(minValue - 0.01));
        });
      });
    });
    this.listFile = this.fileUploadLocal;
  }

  async getBase64ImageFromUrl(imageUrl: string) {
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
      return console.error(error);
    }
  }

  getFilledPercentZoom() {
    const slider = document.getElementsByClassName(
      'cr-slider'
    )[0] as HTMLInputElement;
    if (slider) {
      const maxValue = Number(slider.getAttribute('max'));
      const minValue = Number(slider.getAttribute('min'));
      const percent =
        ((slider.valueAsNumber - minValue) / (maxValue - minValue)) * 100;
      slider.setAttribute('style', `--red: ${percent}%`);
    }
  }

  listenChangeZoomValue() {
    document
      .getElementsByClassName('cr-slider')[0]
      ?.addEventListener('input', () => {
        this.getFilledPercentZoom();
      });
    document
      .getElementsByClassName('cr-slider')[0]
      ?.addEventListener('change', () => {
        this.getFilledPercentZoom();
      });
  }

  async readFile(file) {
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

  fileChangeEvent($event) {
    if ($event.target.files.length) {
      const fileExtension = $event.target.files[0].name
        .split('.')
        .pop()
        .toLowerCase();
      this.imageChangedEvent = $event.target.files;
      this.readFile($event.target.files[0]).then((result) => {
        this.getCroppie(result);
        const cropperContainerElm =
          document.getElementsByClassName('croppie-container');
        cropperContainerElm[0]?.replaceWith(cropperContainerElm[1]);
        this.listenChangeZoomValue();
        const slider = document.getElementsByClassName(
          'cr-slider'
        )[0] as HTMLInputElement;
        const minValue = Number(slider.getAttribute('min'));
        slider.setAttribute('min', String(minValue - 0.01));
      });
    }
  }

  getCroppie(imgPath: any) {
    this.carouselImageElm.nativeElement.setAttribute('src', imgPath);
    this.myCroppie = new Croppie(this.carouselImageElm.nativeElement, {
      boundary: { width: 310, height: 260 },
      viewport: {
        width: 180,
        height: 180,
        type: 'square'
      },
      mouseWheelZoom: false
    });
  }

  handleZoomInOut(type: ESliderType) {
    const slider = document.getElementsByClassName(
      'cr-slider'
    )[0] as HTMLInputElement;
    let currentValue = Number(slider.getAttribute('aria-valuenow'));
    if (type === ESliderType.MINUS) {
      currentValue -= 0.01;
    } else {
      currentValue += 0.01;
    }
    slider.value = String(currentValue);
    slider.dispatchEvent(new Event('input'));
  }

  async handleUploadPicture() {
    this.myCroppie.result({ type: 'base64', circle: false }).then((data) => {
      let nameImage = this.imageChangedEvent
        ? this.imageChangedEvent[0].name
        : this.listFile[this.listFile.length - 1].fileName;
      let typeImage = this.imageChangedEvent
        ? this.imageChangedEvent[0].type
        : this.listFile[this.listFile.length - 1].type;
      const newFile = this.filesService.convertBase64ToFile(
        data,
        nameImage,
        typeImage
      );
      this.handleFileUpload([newFile])
        .then(() => {
          this.getListFile.emit([this.listFile[this.listFile.length - 1]]);
          this.closePopup.emit(true);
        })
        .finally(() => {});
    });
  }

  async handleFileUpload(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { name, type, size, localThumb, isSupportedVideo } = file || {};

      const infoLink = await this.fileUpload.uploadFile(file);

      this.listFile.push({
        title: name,
        fileName: name,
        fileSize: size,
        fileType: type,
        mediaLink: infoLink?.Location,
        mediaType: this.filesService.getFileTypeSlash(file?.type),
        icon: this.filesService.getFileIcon(file?.name),
        localThumb,
        isSupportedVideo
      });
    }
  }

  handleCloseModal() {
    this.closePopup.emit(true);
  }
}
