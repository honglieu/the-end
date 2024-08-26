import { TrudiSafeAny } from './any';

export interface IndexableObject {
  [key: string]: TrudiSafeAny;
}
