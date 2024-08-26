import {
  CHART_DISPLAY_MODE,
  MAX_DATA_LENGTH_FOR_POINT_DISTANCE,
  ZoomLevel
} from './../interfaces/chart.constant';

export function getMaxZoom(data: number): number {
  if (data > 40) {
    return ZoomLevel.High;
  }
  if (data > 30) {
    return ZoomLevel.MediumHigh;
  }
  if (data > 20) {
    return ZoomLevel.Medium;
  }
  if (data > 10) {
    return ZoomLevel.MediumLow;
  }
  return ZoomLevel.Low;
}

export function calculateShowLabels(windowWidth) {
  if (windowWidth <= CHART_DISPLAY_MODE.TABLET) {
    return MAX_DATA_LENGTH_FOR_POINT_DISTANCE.TABLET;
  }
  if (windowWidth <= CHART_DISPLAY_MODE.LAPTOP) {
    return MAX_DATA_LENGTH_FOR_POINT_DISTANCE.LAPTOP;
  }

  return MAX_DATA_LENGTH_FOR_POINT_DISTANCE.DESKTOP;
}
