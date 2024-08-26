import { TrudiSafeAny } from './any';

export type NgClassType = string | string[] | Set<string> | NgClassInterface;

export interface NgClassInterface {
  [klass: string]: TrudiSafeAny;
}

export interface NgStyleInterface {
  [klass: string]: TrudiSafeAny;
}
