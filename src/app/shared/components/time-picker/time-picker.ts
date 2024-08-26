export interface IHourd {
  value: string | number;
  label: string;
  disabled: boolean;
}

export interface EventListener extends Event, KeyboardEvent {
  target: HTMLInputElement;
  keyCode: number;
}

export enum ETimePrevios {
  AM = 'am',
  PM = 'pm'
}
