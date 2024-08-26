import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import {
  IListDynamic,
  PT_LIST_DYNAMIC_PARAMETERS,
  RM_LIST_DYNAMIC_PARAMETERS
} from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import { cloneDeep, upperFirst } from 'lodash-es';

export function getAiDynamicParamsPayload(crmSystem: ECRMSystem) {
  const dynamicCRM = getDynamicByCrmSystem(crmSystem);
  return mapAiDynamicParams(dynamicCRM);
}

export function mapAiDynamicParams(dynamicCRM: IListDynamic[]) {
  let list = {} as DynamicParametersMap;
  for (const item of dynamicCRM) {
    let key = item.title;
    let data = null;
    if (!!item.componentType) {
      data = item.menu.reduce((prev, curr) => {
        prev[curr.title] = `[${curr.param}]`;
        return prev;
      }, {});
      key = upperFirst(item.componentType.replace(/_/g, ' ').toLowerCase());
    }

    if (!!item.communicationStepType) {
      data = item.menu.reduce((prev, curr) => {
        prev[curr.title] = `[${curr.param}]`;
        return prev;
      }, {});
      key = upperFirst(
        item.communicationStepType.replace(/_/g, ' ').toLowerCase()
      );
    }

    if (!item.communicationStepType && !item.componentType) {
      data = item.menu.reduce((prev, curr) => {
        const title = curr.title === 'Landlord' ? 'Owner' : curr.title;
        prev[title?.trim()] = `[${curr.param}]`;
        return prev;
      }, {});
      key = key.includes('Landlord') ? key.replace('Landlord', 'Owner') : key;
    }

    list[key] = data;
  }
  return list;
}

export interface DynamicParametersMap {
  [k: string]: {
    [j: string]: string;
  };
}

export function getDynamicByCrmSystem(crmSystem: ECRMSystem) {
  switch (crmSystem) {
    case ECRMSystem.PROPERTY_TREE:
      return cloneDeep(PT_LIST_DYNAMIC_PARAMETERS);
    case ECRMSystem.RENT_MANAGER:
      return cloneDeep(RM_LIST_DYNAMIC_PARAMETERS);
    default:
      return cloneDeep(PT_LIST_DYNAMIC_PARAMETERS);
  }
}

export function extractAllDynamicParameter(obj) {
  let values = [];
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      values = values.concat(extractAllDynamicParameter(obj[key]));
    } else {
      values.push(obj[key].replace(/[\[\]]/g, ''));
    }
  }
  return values;
}
