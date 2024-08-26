import dayjs from 'dayjs';
import { SHORT_ISO_DATE } from '@services/constants';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { SYNC_STATUS } from '@/app/task-detail/modules/steps/constants/constants';

export const convertTime12to24 = (time12h) => {
  if (!time12h) return;
  const [time, modifier] = time12h.split(' ');
  if (!modifier) return time12h;
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier.toUpperCase() === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  return `${hours}:${minutes}:00`;
};

export const ngOnchangeStartTime = (startTime) => {
  let rangeFrom;
  if (startTime.value?.toString() === '') {
    rangeFrom = 0;
  }
  if (Number.isInteger(startTime.value)) {
    rangeFrom = startTime.value;
  } else {
    rangeFrom = hmsToSecondsOnly(convertTime12to24(startTime.value));
  }
  return rangeFrom;
};

export const ngOnchangeEndTime = (endTime) => {
  let rangeTo;
  if (endTime?.toString() === '') {
    rangeTo = 86400;
  }
  if (endTime) {
    if (Number.isInteger(endTime.value)) {
      rangeTo = endTime.value;
    } else {
      rangeTo = hmsToSecondsOnly(convertTime12to24(endTime.value));
    }
  }
  return rangeTo;
};

export const getSyncStatusPT = (syncStatusPopup) => {
  const { vacateStatus, invoiceStatus } = syncStatusPopup;
  const { INPROGRESS, COMPLETED, FAILED, UNSYNC, NOTSYNC } = SYNC_STATUS;

  let status = NOTSYNC;

  if (vacateStatus || invoiceStatus) {
    if (invoiceStatus === UNSYNC) status = UNSYNC;
    else if (vacateStatus === COMPLETED && invoiceStatus === COMPLETED)
      status = COMPLETED;
    else if (vacateStatus === FAILED || invoiceStatus === FAILED)
      status = FAILED;
    else if (vacateStatus === INPROGRESS || invoiceStatus === INPROGRESS)
      status = INPROGRESS;
    else if (vacateStatus === COMPLETED && !invoiceStatus) status = COMPLETED;
  }

  return status;
};

export const convertDateToPayload = (date): string => {
  if (!date) return '';
  return dayjs(date).format(SHORT_ISO_DATE);
};
