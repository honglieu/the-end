import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import Croppie from 'croppie';
import { Subject, takeUntil } from 'rxjs';
import { listImageTypeDot } from '@services/constants';
import { LoadingService } from '@services/loading.service';
import { SharedService } from '@services/shared.service';
import { UserService } from '@services/user.service';

export enum SliderType {
  MINUS = 'MINUS',
  PLUS = 'PLUS'
}
interface DataPictureProfile {
  dataBase64: string;
  formdata: any;
}

@Component({
  selector: 'app-picture-profile-popup',
  templateUrl: './picture-profile-popup.component.html',
  styleUrls: ['./picture-profile-popup.component.scss']
})
export class PictureProfilePopup implements OnInit, AfterViewInit {
  @ViewChild('profileAvatar') profileAvatarElm: ElementRef;
  @ViewChild('profileWrapper') profileWrapperElm: ElementRef;
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() getAvatarData = new EventEmitter();
  @ViewChild('canvas', { static: true }) canvasRef: ElementRef;
  @Input() avatarTemp;
  myCroppie: any;
  imageChangedEvent: any;
  readonly sliderType = SliderType;
  readonly acceptImageType = listImageTypeDot;
  public hasAvatar = false;
  private destroy$ = new Subject<void>();
  public firstRender = true;

  constructor(
    private userService: UserService,
    private readonly sharedService: SharedService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.getCurrentAvatar();
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
      console.error(error);
      return Promise.reject(error);
    }
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

  fileChangeEvent(event): void {
    if (event.target.files.length) {
      this.imageChangedEvent = event;
      this.hasAvatar = true;
      this.readFile(event.target.files[0]).then((result) => {
        this.getCroppie(result);
        const cropperContainerElm =
          document.getElementsByClassName('croppie-container');
        if (cropperContainerElm.length > 1) {
          cropperContainerElm[0]?.replaceWith(cropperContainerElm[1]);
        }
        this.listenChangeZoomValue();
        const slider = document.getElementsByClassName(
          'cr-slider'
        )[0] as HTMLInputElement;
        const minValue = Number(slider.getAttribute('min'));
        slider.setAttribute('min', String(minValue - 0.01));
      });
    }
  }

  handleZoomInOut(type: SliderType) {
    const slider = document.getElementsByClassName(
      'cr-slider'
    )[0] as HTMLInputElement;
    let currentValue = Number(slider.getAttribute('aria-valuenow'));
    if (type === SliderType.MINUS) {
      currentValue -= 0.01;
    } else {
      currentValue += 0.01;
    }
    slider.value = String(currentValue);
    slider.dispatchEvent(new Event('input'));
  }

  getCroppie(imgPath: any) {
    this.profileAvatarElm.nativeElement.setAttribute('src', imgPath);
    this.myCroppie = new Croppie(this.profileAvatarElm.nativeElement, {
      boundary: { width: 310, height: 260 },
      viewport: { width: 180, height: 180, type: 'circle' },
      mouseWheelZoom: false
    });
  }

  getFilledPercentZoom() {
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
        if (this.firstRender) {
          this.myCroppie.setZoom('1.5');
          this.firstRender = false;
        }
      });
  }

  getCurrentAvatar() {
    this.userService.userInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.googleAvatar && !res?.googleAvatar.includes('google_avatar')) {
          this.handleShowCurrentAvt(res?.googleAvatar);
        } else if (this.avatarTemp) {
          this.handleShowCurrentAvt(this.avatarTemp);
        } else {
          this.handleGenerateAvatar(res);
        }
      });
  }

  handleShowCurrentAvt(avatar) {
    this.hasAvatar = true;
    this.getBase64ImageFromUrl(avatar).then((result) => {
      this.getCroppie(result);
      this.listenChangeZoomValue();
    });
  }

  get2CharacterFromName(name: string) {
    const chars = name?.split(' ');
    if (!chars?.length || chars.length < 1) return '';
    if (chars?.length === 1) {
      return chars[0].substring(0, 2).toUpperCase();
    }
    return (chars[0].charAt(0) + chars[1].charAt(0)).toUpperCase();
  }

  handleGenerateAvatar(user) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    canvas.width = 310;
    canvas.height = 260;
    ctx.fillStyle = '#0097a7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '130px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      this.get2CharacterFromName(user.firstName + ' ' + user.lastName),
      canvas.width / 2,
      canvas.height / 2
    );
    this.handleShowCurrentAvt(canvas.toDataURL('image/png'));
  }

  handleCloseModal() {
    this.isCloseModal.emit(true);
    this.resetValue();
  }

  async handleUploadPicture() {
    this.myCroppie.result({ type: 'base64', circle: false }).then((data) => {
      this.loadingService.onLoading();
      const formData = new FormData();
      formData.append(
        'fileType',
        this.sharedService.getFileType(
          this.imageChangedEvent?.target?.files[0]?.type
        )
      );
      formData.append(
        'fileName',
        this.imageChangedEvent?.target?.files[0]?.name
      );
      formData.append('base64', data);
      let dataImgFromPicture: DataPictureProfile = {
        dataBase64: data,
        formdata: formData
      };
      this.getAvatarData.emit(dataImgFromPicture);
      this.loadingService.stopLoading();
      this.handleCloseModal();
    });
  }

  resetValue() {
    this.getCurrentAvatar();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.myCroppie.destroy();
  }
}
