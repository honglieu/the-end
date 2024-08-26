export const DEFAULT_NUMBER_URL = 30;
export enum EPromotionStatus {
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  UNPUBLISHED = 'UNPUBLISHED'
}

export const DEFAULT_CAROUSEL_PROMOTIONS = 3;
export const IMAGE_TYPE_SUPPORT_CAROUSEL = [
  'image/png',
  'image/jpeg',
  'image/jpg'
];

export const FILES_CONTROL_ERROR_MESSAGE = [
  { errorName: 'requiredFiles', errorMessage: 'Please upload feature image' },
  {
    errorName: 'filesTooLarges',
    errorMessage: 'The file is larger than 25MB. Please upload a smaller file'
  },
  {
    errorName: 'filesTypeSupport',
    errorMessage: `The file is invalid. Only 'png', 'jpeg', 'jpg' are allowed`
  }
];

export enum EUploadFileError {
  FILE_INVALID_TYPE = 'FILE_INVALID_TYPE',
  FILE_TOO_LARGES = 'FILE_TOO_LARGES',
  FILE_TOO_LARGES_AND_INVALID_TYPE = 'FILE_TOO_LARGES_AND_INVALID_TYPE'
}

export enum EPromotionPopupType {
  CREATE_NEW_PROMOTION = 'CREATE_NEW_PROMOTION',
  EDIT_PROMOTION = 'EDIT_PROMOTION'
}

export enum EPromotionSocketType {
  PROMOTION_CHANGED = 'PROMOTION_CHANGED',
  PROMOTION_PUBLISHED = 'PROMOTION_PUBLISHED'
}
