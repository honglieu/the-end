import { SliderType } from '@/app/user-profile/picture-profile-popup/picture-profile-popup.component';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
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
import { Subject } from 'rxjs';
import { UserProfileService } from '@/app/user-profile/services/user-profile.service';
import { ToastrService } from 'ngx-toastr';
import { IImageSize } from '@shared/types/user.interface';

@Component({
  selector: 'email-signature-popup',
  templateUrl: './email-signature-popup.component.html',
  styleUrls: ['./email-signature-popup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailSignaturePopupComponent
  implements OnInit, AfterViewInit, OnDestroy, OnChanges
{
  @ViewChild('profileAvatar') profileAvatarElm: ElementRef;
  @ViewChild('canvas', { static: true }) canvasRef: ElementRef;
  @ViewChild('myImage') myImage: ElementRef;

  @Input() showEmailSignatureModal = false;
  @Input() avatarTemp;
  @Input() agencySignature = '';
  @Output() changeFileImage = new EventEmitter();
  @Output() closeModal = new EventEmitter();
  @Output() confirmModal = new EventEmitter();

  private destroy$ = new Subject<void>();
  public readonly sliderType = SliderType;
  public readonly EMAIL_SIGNATURE_IMAGE_VALID_TYPE = ['.png', '.jpeg', '.jpg'];
  public readonly FILE_LIMIT = 25;
  public readonly stepNumber = 0.01;
  public imageChangedEvent;
  public currentImageSignature;
  public sliderValue = 1;
  public currentImageSize: IImageSize;
  public currentImageSizeDefault: IImageSize;
  public uploadingImage = false;

  constructor(
    private userProfileService: UserProfileService,
    private toastService: ToastrService,
    public cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngOnChanges(simpleChanges: SimpleChanges) {
    if ('avatarTemp' in simpleChanges) {
      this.getAvatarTemp(this.avatarTemp);
    }
  }

  ngAfterViewInit() {
    this.myImage.nativeElement.onload = () => {
      this.getDefaultImageSize();
    };
  }

  // Private func
  private getAvatarTemp(value) {
    if (Array.isArray(value)) {
      this.currentImageSignature = value?.[0];
    } else if (typeof value === 'object') {
      this.currentImageSignature = value;
    }
    this.sliderValue = this.currentImageSignature?.sliderValue || 1;
  }
  private getDefaultImageSize() {
    const originalWidth = this.myImage.nativeElement.offsetWidth;
    const originalHeight = this.myImage.nativeElement.offsetHeight;

    this.currentImageSizeDefault = {
      width: originalWidth,
      height: originalHeight
    };
    const { width: currentWidth, height: currentHeight } =
      this.currentImageSizeDefault;
    this.currentImageSize = {
      width: currentWidth * this.sliderValue,
      height: currentHeight * this.sliderValue
    };
    this.cd.markForCheck();
  }
  private onCheckValidateFile(file: File) {
    const type = file.name.split('.')?.pop();
    const invalidType = !(
      this.EMAIL_SIGNATURE_IMAGE_VALID_TYPE.includes(type?.toLowerCase()) ||
      this.EMAIL_SIGNATURE_IMAGE_VALID_TYPE.includes('.' + type?.toLowerCase())
    );
    const invalidSize = file.size / 1024 ** 2 > this.FILE_LIMIT;
    if (invalidType) {
      this.toastService.error('The file is invalid');
      return invalidType;
    }
    if (invalidSize) {
      this.toastService.error(
        'The file is larger than 25MB. Please upload a smaller file'
      );
      return invalidSize;
    }
    return false;
  }

  public handleZoomInOut(sliderType: SliderType) {
    if (sliderType === SliderType.MINUS) {
      this.sliderValue -= this.stepNumber;
    } else {
      this.sliderValue += this.stepNumber;
    }
    this.onChangeSlider();
  }

  public onChangeSlider() {
    this.currentImageSize = {
      width: this.currentImageSizeDefault.width * this.sliderValue,
      height: this.currentImageSizeDefault.height * this.sliderValue
    };
  }

  public onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (this.onCheckValidateFile(target.files[0])) return;
    this.currentImageSize = null;
    if (target.files.length) {
      this.imageChangedEvent = target.files[0];
      this.uploadingImage = true;
      this.userProfileService.handleFileUpload(target.files[0]).then((res) => {
        this.currentImageSignature = res;
        this.sliderValue = 1;
        this.uploadingImage = false;
        this.cd.markForCheck();
      });
    }
  }

  public onConfirm() {
    const imageSize = this.currentImageSize ? this.currentImageSize : null;
    this.confirmModal.emit({
      ...this.currentImageSignature,
      imageSize: imageSize,
      sliderValue: this.sliderValue
    });
    this.closeModal.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
