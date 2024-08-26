import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { Params } from '@angular/router';
import { isEqual } from 'lodash-es';
import { LOCAL_STORAGE_KEY_FOR_VIEW_SETTINGS } from './constants';
export const isFilterTaskListChange = (
  previousParams: Params,
  currentParams: Params
) => {
  return (
    !previousParams ||
    !currentParams ||
    (previousParams[ETaskQueryParams.SEARCH] || '') !==
      (currentParams[ETaskQueryParams.SEARCH] || '') ||
    previousParams[ETaskQueryParams.INBOXTYPE] !==
      currentParams[ETaskQueryParams.INBOXTYPE] ||
    previousParams[ETaskQueryParams.START_DATE] !==
      currentParams[ETaskQueryParams.START_DATE] ||
    previousParams[ETaskQueryParams.END_DATE] !==
      currentParams[ETaskQueryParams.END_DATE] ||
    previousParams[ETaskQueryParams.TASKSTATUS] !==
      currentParams[ETaskQueryParams.TASKSTATUS] ||
    !isEqual(
      previousParams[ETaskQueryParams.ASSIGNED_TO],
      currentParams[ETaskQueryParams.ASSIGNED_TO]
    ) ||
    !isEqual(
      previousParams[ETaskQueryParams.PROPERTY_MANAGER_ID],
      currentParams[ETaskQueryParams.PROPERTY_MANAGER_ID]
    ) ||
    !isEqual(
      previousParams[ETaskQueryParams.CALENDAR_EVENT],
      currentParams[ETaskQueryParams.CALENDAR_EVENT]
    ) ||
    !isEqual(
      previousParams[ETaskQueryParams.TASK_EDITOR_ID],
      currentParams[ETaskQueryParams.TASK_EDITOR_ID]
    ) ||
    !isEqual(
      previousParams[ETaskQueryParams.TASKTYPEID],
      currentParams[ETaskQueryParams.TASKTYPEID]
    )
  );
};

export const getTaskViewSettingsStatus = () => {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_FOR_VIEW_SETTINGS));
};
