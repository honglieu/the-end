export enum WhatsappSteps {
  Initial = 0,
  GetStart = 1,
  Integrate = 2,
  Success = 3
}

export enum EUserSendType {
  USER = 'USER',
  PAGE = 'PAGE'
}

export enum ETriggeredBy {
  SCROLL_EVENT = 'SCROLL_EVENT',
  SOCKET_EVENT = 'SOCKET_EVENT',
  MANUAL_EVENT = 'MANUAL_EVENT'
}

export enum PhoneNumberToRegisterType {
  SAME_PHONE_NUMBER = 'SAME_PHONE_NUMBER',
  MY_OWN_PHONE_NUMBER = 'MY_OWN_PHONE_NUMBER'
}

export enum EFileEventEmitType {
  MANAGE_CAROUSEL = 'MANAGE_CAROUSEL',
  FORWARD_ATTACHMENT = 'FORWARD_ATTACHMENT',
  FILE_EMIT = 'FILE_EMIT'
}
