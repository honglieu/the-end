import { Dayjs } from 'dayjs';
import {
  EPromotionPopupType,
  EPromotionSocketType,
  EPromotionStatus
} from './type';
export interface IPosittion {
  top?: string;
  left?: string;
  bottom?: string;
  right?: string;
  transform?: string;
}
export interface IPromotionOption {
  type: EPromotionPopupType;
  option?: IPromotion;
}

export interface IPromotions {
  currentPage: string;
  items: IPromotion;
  totalItems: number;
  totalPages: number;
}
export interface IPromotion {
  id: string;
  status: string;
  title: string;
  publishedAt: string;
  unpublishedAt: string;
  promotionCarousels: IPromotionCarousels[];
}

export interface IPromotionCarousels {
  id: string;
  promotionId: string;
  imageUrl: string;
  image: any;
  url: string;
  urlDisplay: string;
  featureName: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IBodyPromotion {
  title: string;
  publishedAt: string | Dayjs;
  unpublishedAt: string | Dayjs;
  promotionCarousels: IPromotionCarousels[];
}

export interface IPromotionSchedule {
  publishedAt: string;
  unpublishedAt: string;
}

export interface IPromotionSocket {
  promotionType: EPromotionSocketType;
  promotionId: string;
  dataChange: IDataChange;
  restrictedDates: string;
}

export interface IDataChange {
  createPromotion?: IPromotion;
  updatePromotion?: IPromotion;
  deletePromotion?: string;
}

export interface IFileUploadCarousel {
  fileName: string;
  fileSize: number;
  fileType: string;
  icon: string;
  isSupportedVideo: boolean;
  localThumb: string;
  mediaLink: string;
  mediaType: string;
  title: string;
}
