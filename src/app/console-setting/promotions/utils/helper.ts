import { EPromotionStatus } from './type';

export function getVariant(status: string): string {
  switch (status) {
    case EPromotionStatus.SCHEDULED:
      return 'warning';
    case EPromotionStatus.PUBLISHED:
      return 'primary';
    default:
      return 'archive';
  }
}
