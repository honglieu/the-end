import { cloneDeep } from 'lodash-es';
import {
  IListDynamic,
  PT_LIST_DYNAMIC_PARAMETERS,
  RM_LIST_DYNAMIC_PARAMETERS
} from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import {
  CRM_COMPONENT_ACTION,
  DisplayConflictStepText,
  ECrmSystemId,
  REGEX_PARAM_TASK_EDITOR
} from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import {
  ConflictStepType,
  ECRMState,
  EContactCardType,
  EDynamicType,
  EPropertyTreeContactType,
  ERentManagerContactType,
  ESelectStepType,
  EStepAction,
  EStepType,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TreeNodeOptions } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';
import { replaceSingleQuotes } from '@/app/trudi-send-msg/utils/dynamic-parameter-helper-functions';
import { IPreviousStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import uuid4 from 'uuid4';
export class TemplateError extends Error {
  nodeIndex: string;

  constructor(message, nodeIndex) {
    super(message);
    this.nodeIndex = nodeIndex;
  }
}

export class TaskTemplateHelper {
  public static listStepHasInvalidParam: boolean[] = [];
  public static crmConflict: boolean = false;
  public static: boolean[] = [];
  public static listDynamicSectionDefaultByConfig: IListDynamic[] = [];
  public static treeViewToTemplate = (decisionTree) => {
    const parseData = (decisionData) => {
      const data = {};
      if (!decisionData) return data;
      const mapChildrenToButtons = (data) => {
        return Object.keys(data).reduce((obj, key) => {
          if (key === 'children') {
            const childButtons = data[key].map((childData) =>
              mapChildrenToButtons(childData)
            );
            if (data['type'] === ETypeElement.DECISION) {
              obj['steps'] = childButtons.filter(
                (child) => child.type !== ETypeElement.DECISION
              );
              obj['decisions'] = childButtons.filter(
                (child) => child.type === ETypeElement.DECISION
              );
              obj['childDecisionKey'] = !!obj['decisions']?.length
                ? obj['childDecisionKey']
                : null;
            }
            if (data['type'] === ETypeElement.SECTION) {
              obj['buttons'] = childButtons;
            }
          } else if (key === 'key') {
            obj['id'] = data[key];
          } else if (key === 'title') {
            if (data['type'] === ETypeElement.DECISION) {
              obj['decision'] = data[key];
            } else {
              obj['name'] = data[key];
            }
          } else if (
            // To plunk some properties to need
            [
              'type',
              'stepType',
              'action',
              'status',
              'reminderTimes',
              'fields',
              'dynamicParam',
              'index',
              'isDefault',
              'isRequired',
              'componentType',
              'newTaskTemplateId',
              'crmSystemId',
              'childDecisionKey'
            ].includes(key)
          ) {
            // To handle with fields
            if (key === 'fields') {
              switch (data['action']) {
                case EStepAction.SEND_CONVERSATION_FILES: {
                  if (data[key]['customControl']['file']) {
                    data[key]['customControl']['title'] =
                      data[key]['customControl']['file'];
                    delete data[key]['customControl']['file'];
                  }
                  break;
                }
                case EStepAction.SEND_ATTACHMENT: {
                  if (data[key]['customControl']['attachmentName']) {
                    data[key]['customControl']['title'] =
                      data[key]['customControl']['attachmentName'];
                    delete data[key]['customControl']['attachmentName'];
                  }
                  break;
                }
                case EStepAction.BOND_AMOUNT_DUE:
                case EStepAction.ENTRY_REPORT_DEADLINE:
                case EStepAction.CAPTURE_BREAK_LEASE_FEES:
                case EStepAction.CAPTURE_INSPECTION_ACTIONS:
                case EStepAction.NOTICE_TO_LEAVE: {
                  if (
                    data[key]['customControl']['attachment']['attachmentName']
                  ) {
                    data[key]['customControl']['attachment']['title'] =
                      data[key]['customControl']['attachment'][
                        'attachmentName'
                      ];
                  }
                  delete data[key]['customControl']['attachment'][
                    'attachmentName'
                  ];
                  break;
                }
              }
            }

            obj[key] = data[key];
          }
          return obj;
        }, {});
      };
      data['steps'] = decisionData
        .filter((item) => item['type'] !== ETypeElement.DECISION)
        .map((item) => mapChildrenToButtons(item));
      data['decisions'] = decisionData
        .filter((item) => item['type'] === ETypeElement.DECISION)
        .map((item) => mapChildrenToButtons(item));
      return data;
    };

    return {
      ...decisionTree,
      data: parseData(decisionTree['data'])
    };
  };

  public static templateToTreeView = (decisionTree) => {
    const mapButtonsToChildren = (value) => {
      let currentIndex = 0;
      return (
        value &&
        Object.keys(value).reduce((result, key) => {
          const item = value[key];

          if (
            item &&
            item['type'] === ETypeElement.STEP &&
            item['stepType'] !== EStepType.RENT_MANAGER
          ) {
            var { name, id, fields, action, ...rest } = item;
            switch (action) {
              case EStepAction.SEND_CONVERSATION_FILES: {
                if (fields['customControl']['title']) {
                  fields['customControl']['file'] =
                    fields['customControl']['title'];
                  delete fields['customControl']['title'];
                }
                break;
              }
              case EStepAction.SEND_ATTACHMENT: {
                if (fields['customControl']['title']) {
                  fields['customControl']['attachmentName'] =
                    fields['customControl']['title'];
                  delete fields['customControl']['title'];
                }
                break;
              }
              case EStepAction.BOND_AMOUNT_DUE:
              case EStepAction.ENTRY_REPORT_DEADLINE:
              case EStepAction.CAPTURE_BREAK_LEASE_FEES:
              case EStepAction.CAPTURE_INSPECTION_ACTIONS:
              case EStepAction.NOTICE_TO_LEAVE: {
                if (fields['customControl']['attachment']['title']) {
                  fields['customControl']['attachment']['attachmentName'] =
                    fields['customControl']['attachment']['title'];
                  delete fields['customControl']['attachment']['title'];
                }
                break;
              }
            }
            result &&
              result.push({
                title: name,
                key: id,
                expanded: true,
                fields,
                action,
                ...rest
              });
          } else if (item && item['type'] === ETypeElement.SECTION) {
            const { type, name, id, buttons } = item;
            const array = buttons || [];
            result &&
              result.push({
                type,
                title: name,
                key: id,
                expanded: true,
                children: mapButtonsToChildren(array)
              });
          } else if (item && item['type'] === ETypeElement.DECISION) {
            const {
              type,
              decision,
              index,
              id,
              steps,
              decisions,
              childDecisionKey
            } = item;
            const array = (steps || []).concat(decisions || []);
            result &&
              result.push({
                type,
                index: !!index ? index : currentIndex++,
                title: decision,
                key: id,
                expanded: true,
                childDecisionKey: null,
                children: mapButtonsToChildren(array)
              });
          } else if (typeof item === 'object') {
            result &&
              mapButtonsToChildren(item) &&
              result.push(...mapButtonsToChildren(item));
          }

          return result;
        }, [])
      );
    };
    return {
      ...decisionTree,
      data: mapButtonsToChildren(decisionTree['data'])
    };
  };

  public static validateTemplate(
    templateData,
    stepType:
      | ESelectStepType.RENT_MANAGER_ACTION
      | ESelectStepType.PROPERTY_TREE_ACTION,
    canOnlyAddOnce: Record<string, boolean>,
    action: {
      CREATE: string;
      UPDATE: string;
    }
  ) {
    const errors = [];
    const steps = this.getSteps(
      [...templateData].filter((item) => item.type !== ETypeElement.DECISION),
      [stepType]
    );
    const stepsInDecisionFirstLayer = [...templateData]
      .filter((item) => item.type === ETypeElement.DECISION)
      .map((dec) => this.getSteps(dec.children, [stepType]));

    const checkPTStepValid = (arr) => {
      const stepObject = arr.reduce((x, s) => {
        if (x[s.componentType] === undefined) {
          x[s.componentType] = [{ action: s.action, key: s.key }];
        } else {
          x[s.componentType].push({ action: s.action, key: s.key });
        }
        return x;
      }, {});

      if (Object.keys(stepObject).length > 0) {
        Object.keys(stepObject).forEach((componentType) => {
          stepObject[componentType]?.map((type, indexType) => {
            if (type?.action === action.UPDATE) {
              if (
                stepObject[componentType]
                  .slice(0, indexType)
                  ?.findIndex((item) => item?.action === action.CREATE) === -1
              ) {
                errors.push(
                  new TemplateError(
                    `The component need to be created first`,
                    stepObject[componentType][indexType].key
                  )
                );
              }
            } else {
              if (!canOnlyAddOnce[componentType]) return;

              if (
                stepObject[componentType]
                  .slice(0, indexType)
                  ?.findIndex((item) => item?.action === action.CREATE) !== -1
              ) {
                errors.push(
                  new TemplateError(
                    `You only can add one component of this type to a workflow`,
                    stepObject[componentType][indexType].key
                  )
                );
              }
            }
          });
        });
      }
    };
    if (stepsInDecisionFirstLayer.length === 0) {
      checkPTStepValid(steps);
    } else {
      stepsInDecisionFirstLayer.forEach((decision, index) => {
        checkPTStepValid([...steps, ...decision]);

        const originDecisionSecondLayer = templateData.filter(
          (item) => item.type === ETypeElement.DECISION
        )[index]?.children;

        const stepsInDecisionSecondLayer = originDecisionSecondLayer
          .filter((item) => item.type === ETypeElement.DECISION)
          .map((dec) => this.getSteps(dec.children, [stepType]));

        stepsInDecisionSecondLayer.forEach((it) => {
          checkPTStepValid([...steps, ...decision, ...it]);
        });
      });
    }
    if (errors.length) {
      throw errors;
    }
  }

  public static getDynamicParamListFromMsg(msgBody) {
    return (msgBody.match(REGEX_PARAM_TASK_EDITOR) || []).filter((item) => {
      const invalidParam = replaceSingleQuotes(
        `<span style='color: var(--danger-500, #fa3939);' contenteditable='false'>${item}</span>`
      );
      const validParam = replaceSingleQuotes(
        `<span style='color: var(--fg-brand, #28ad99);' contenteditable='false'>${item}</span>`
      );
      const validParam1 = `<span style='color: var(--trudi-primary, #00aa9f);' contenteditable='false'>${item}</span>`;
      return (
        msgBody.includes(invalidParam) ||
        msgBody.includes(validParam) ||
        msgBody.includes(validParam1)
      );
    });
  }

  public static checkListParam(listTypes, msgBody) {
    const listCurrentTypeDynamic = listTypes.map((item) => item.componentType);
    const listCurrentTypeDynamicEvent = listTypes.map((item) => item.eventType);
    const listDynamicParam = this.getDynamicParamListFromMsg(msgBody);
    if (listDynamicParam.length < 1) {
      return false;
    }

    const listAllCodeOptions = [
      ...PT_LIST_DYNAMIC_PARAMETERS,
      ...RM_LIST_DYNAMIC_PARAMETERS
    ].flatMap((item) => item.menu.map((p) => p.param));
    const listDefaultCodeOptions = [
      ...PT_LIST_DYNAMIC_PARAMETERS,
      ...RM_LIST_DYNAMIC_PARAMETERS
    ]
      .filter(
        (item) =>
          item.dynamicType === EDynamicType.PT_COMPONENT ||
          item.dynamicType === EDynamicType.RM_COMPONENT ||
          item.dynamicType === EDynamicType.CALENDER_EVENT
      )
      .flatMap((item) => item.menu.map((p) => p.param));
    const listReceiveCodeOptions = this.listDynamicSectionDefaultByConfig
      .filter(
        (item) =>
          (item.dynamicType === EDynamicType.PT_COMPONENT ||
            item.dynamicType === EDynamicType.RM_COMPONENT) &&
          listCurrentTypeDynamic.includes(item.componentType)
      )
      .flatMap((item) => item.menu.map((p) => p.param));
    const listReceiveEventCodeOptions = this.listDynamicSectionDefaultByConfig
      .filter(
        (item) =>
          item.dynamicType === EDynamicType.CALENDER_EVENT &&
          listCurrentTypeDynamicEvent.includes(item.calendarEventType)
      )
      .flatMap((item) => item.menu.map((p) => p.param));
    const isInvalid = listDynamicParam.some(
      (item) =>
        !listAllCodeOptions.includes(item) ||
        (!listReceiveCodeOptions.includes(item) &&
          !listReceiveEventCodeOptions.includes(item) &&
          listDefaultCodeOptions.includes(item))
    );
    return isInvalid;
  }

  public static formatTemplateData_v2(
    data: TreeNodeOptions[],
    option = { needCheckCrmConflict: false, crmSystemId: null }
  ) {
    let nodeMap = {};
    if (!data.length) {
      this.listStepHasInvalidParam = [];
      this.crmConflict = false;
      return [];
    }

    this.listStepHasInvalidParam = [];
    let crmTemplateTypes;
    if (option?.needCheckCrmConflict) {
      this.crmConflict = false;
      if (option?.crmSystemId) {
        crmTemplateTypes = this.getEnumCrmTemplate(option.crmSystemId);
      }
    }
    let steps = [];
    let treeData = cloneDeep(data);

    const checkParamInvalid = (step) => {
      const newStep = cloneDeep(step);
      if (newStep.type !== ETypeElement.STEP) {
        if (newStep.children && newStep.children.length > 0) {
          newStep.children = newStep.children.map(checkParamInvalid);
        }
      } else {
        steps.push(newStep);
        if (
          newStep.stepType === ESelectStepType.COMMUNICATION_STEP &&
          steps.some((item) => item.key === newStep.key)
        ) {
          let tempSteps = steps.filter(
            (item) =>
              !item.decisionKey ||
              item.decisionKey === newStep.decisionKey ||
              item.parentKey === nodeMap[newStep.decisionKey]?.parentKey || //step of child decision should inherit parameters from root decision
              item.decisionKey === nodeMap[newStep.decisionKey]?.parentKey
          );
          const index = tempSteps.findIndex((item) => item.key === newStep.key);
          newStep['listPreviousSteps'] = tempSteps
            .slice(0, index)
            .map((step) => {
              return {
                key: step.key,
                stepType: step.stepType,
                componentType: step.componentType,
                eventType: step.fields?.eventType
              };
            });
          const isInvalidDynamicParam = this.checkListParam(
            newStep['listPreviousSteps'],
            newStep.fields.msgBody
          );
          newStep['isInvalidDynamicParam'] = isInvalidDynamicParam;
          this.listStepHasInvalidParam.push(isInvalidDynamicParam);
        }

        if (option?.needCheckCrmConflict) {
          if (option?.crmSystemId) {
            this.handleCheckStep(newStep, crmTemplateTypes, option.crmSystemId);
          }

          if (newStep?.crmConflictErrors && newStep.crmConflictErrors?.length) {
            this.crmConflict = true;
          }
        }
      }
      return newStep;
    };
    this.addParentKeyToNodes(treeData);
    nodeMap = this.buildNodeMapping(treeData);
    const treeDataClone = treeData.map(checkParamInvalid);
    return treeDataClone;
  }

  private static addParentKeyToNodes(
    tree: TreeNodeOptions[],
    parentKey?: string,
    nodeLevel: number = 0,
    decisionKey: string = ''
  ) {
    for (const node of tree) {
      // Add the parent key, node level to the current node
      node.parentKey = parentKey;
      node.treeNodeLevel = nodeLevel + 1;
      node.decisionKey = decisionKey;
      // Recursively process children, passing the current node's key as the parentKey
      if (node.children && node.children.length) {
        this.addParentKeyToNodes(
          node.children,
          node.key,
          node.treeNodeLevel,
          node.type === ETypeElement.DECISION ? node.key : decisionKey
        );
      }
    }
  }

  public static getSteps(
    data,
    stepType: ESelectStepType[] = [
      ESelectStepType.COMMUNICATION_STEP,
      ESelectStepType.PROPERTY_TREE_ACTION,
      ESelectStepType.CALENDAR_EVENT,
      ESelectStepType.NEW_TASK
    ]
  ) {
    const steps = [];

    const isStepType = (step) => {
      return stepType.includes(step.stepType);
    };

    const findSteps = (step) => {
      if (step.type === ETypeElement.STEP) {
        if (isStepType(step)) {
          steps.push(step);
        }
      } else if (step.type === ETypeElement.SECTION) {
        steps.push(...step.children.filter(isStepType));
      } else {
        steps.push(step.children.filter(isStepType));
      }
    };

    if (Array.isArray(data) && !!data) {
      data.forEach(findSteps);
    }
    return steps;
  }

  public static getListDynamicByConfig(crmSystemKey) {
    switch (crmSystemKey) {
      case ECRMState.PROPERTY_TREE:
        this.listDynamicSectionDefaultByConfig = PT_LIST_DYNAMIC_PARAMETERS;
        break;
      case ECRMState.RENT_MANAGER:
        this.listDynamicSectionDefaultByConfig = RM_LIST_DYNAMIC_PARAMETERS;
        break;
      default:
        break;
    }
  }

  private static handleCheckStep(step, crmTemplateTypes, crmSystemId) {
    step['crmConflictErrors'] = null;
    switch (step?.stepType) {
      case EStepType.COMMUNICATE:
        this.handleConflictSendTo(
          step,
          crmTemplateTypes?.contactType,
          crmSystemId
        );

        if (step?.action === EStepAction.SEND_CONTACT_CARD) {
          this.handleConflictContactCardType(
            step,
            step?.fields?.customControl,
            crmTemplateTypes?.contactType,
            crmSystemId
          );
        }
        if (
          [
            EStepAction.SCHEDULE_REMINDER,
            EStepAction.SEND_CALENDAR_EVENT
          ].includes(step?.action)
        ) {
          this.handleConflictEvent(
            step,
            crmTemplateTypes?.calendarEvent,
            crmSystemId
          );
        }
        this.handleConflictDynamicParam(
          step,
          crmTemplateTypes?.dynamicFields,
          crmSystemId
        );
        break;
      case EStepType.CALENDAR_EVENT:
        this.handleConflictEvent(
          step,
          crmTemplateTypes?.calendarEvent,
          crmSystemId
        );
        break;
      case EStepType.PROPERTY_TREE:
      case EStepType.RENT_MANAGER:
        this.handleConflictExternalIntegration(step, crmSystemId);
        break;
      default:
        break;
    }
  }

  private static getEnumCrmTemplate(crmSystemId) {
    const calendarEventTypeByCrm = JSON.parse(
      localStorage.getItem('calendarEventType') || '{}'
    );
    const defaultEnum = {
      calendarEvent: (calendarEventTypeByCrm[crmSystemId] || []).map(
        (x) => x.value
      ),
      dynamicFields: this.getDynamicField(crmSystemId)
    };

    switch (crmSystemId) {
      case ECrmSystemId.PROPERTY_TREE:
        return {
          ...defaultEnum,
          contactType: Object.values(EPropertyTreeContactType)
        };
      case ECrmSystemId.RENT_MANAGER:
        return {
          ...defaultEnum,
          contactType: Object.values(ERentManagerContactType)
        };
      default:
        return null;
    }
  }

  private static handleConflictSendTo(step, types, crmSystemId) {
    const sendTo = step?.fields?.sendTo;
    if (!sendTo?.length) {
      this.resetCrmConflictErrors(step, ConflictStepType.SEND_TO);
      return;
    }

    const allSendToValid = sendTo.every((value) => types.includes(value));
    if (!allSendToValid) {
      step['crmConflictErrors'] = (step['crmConflictErrors'] || []).concat({
        type: ConflictStepType.SEND_TO,
        message: DisplayConflictStepText.SEND_TO,
        crmSystemId
      });
      step['crmConflictErrors'] = Array.from(
        new Map(step['crmConflictErrors'].map((x) => [x.type, x])).values()
      );
    } else {
      this.resetCrmConflictErrors(step, ConflictStepType.SEND_TO);
    }
  }

  private static handleConflictContactCardType(
    step,
    customControl,
    types,
    crmSystemId
  ) {
    const {
      contactCardType,
      contactData,
      crmSystemId: customControlCrmSystemId
    } = customControl || {};
    if (!step?.fields?.customControl) {
      this.resetCrmConflictErrors(step, ConflictStepType.CONTACT_TYPE);
      return;
    }

    if (
      (contactCardType === EContactCardType.INDIVIDUAL_SUPPLIER &&
        customControlCrmSystemId !== crmSystemId) ||
      (contactCardType !== EContactCardType.INDIVIDUAL_SUPPLIER &&
        !contactData.every((value) => types.includes(value)))
    ) {
      step['crmConflictErrors'] = (step['crmConflictErrors'] || []).concat({
        type: ConflictStepType.CONTACT_TYPE,
        message: DisplayConflictStepText.CONTACT_TYPE,
        crmSystemId
      });
      step['crmConflictErrors'] = Array.from(
        new Map(step['crmConflictErrors'].map((x) => [x.type, x])).values()
      );
    } else {
      this.resetCrmConflictErrors(step, ConflictStepType.CONTACT_TYPE);
    }
  }

  private static handleConflictEvent(step, types, crmSystemId) {
    const event =
      step?.stepType === EStepType.CALENDAR_EVENT
        ? step?.fields?.eventType
        : step?.fields?.customControl?.event;
    if (!event) {
      this.resetCrmConflictErrors(step, ConflictStepType.EVENT);
      return;
    }

    if (!types.includes(event)) {
      step['crmConflictErrors'] = (step['crmConflictErrors'] || []).concat({
        type: ConflictStepType.EVENT,
        message: DisplayConflictStepText.EVENT,
        crmSystemId
      });
      step['crmConflictErrors'] = Array.from(
        new Map(step['crmConflictErrors'].map((x) => [x.type, x])).values()
      );
    } else {
      this.resetCrmConflictErrors(step, ConflictStepType.EVENT);
    }
  }

  private static handleConflictExternalIntegration(step, crmSystemId) {
    const { crmSystemId: stepCrmSystemId } = step || {};

    if (stepCrmSystemId !== crmSystemId) {
      let stepType = null;
      switch (crmSystemId) {
        case ECrmSystemId.PROPERTY_TREE:
          stepType = EStepType.PROPERTY_TREE;
          break;
        case ECrmSystemId.RENT_MANAGER:
          stepType = EStepType.RENT_MANAGER;
          break;
        default:
          break;
      }
      step['crmConflictErrors'] = (step['crmConflictErrors'] || []).concat({
        type: ConflictStepType.COMPONENT_ACTION,
        message: DisplayConflictStepText.COMPONENT_ACTION,
        crmSystemId,
        stepType
      });

      if (ECrmSystemId[step.stepType] !== crmSystemId) {
        step.componentType = null;
      }

      step.stepType = stepType;
      step.action = this.handleConflictStepAction(step.action, crmSystemId);

      step['crmConflictErrors'] = Array.from(
        new Map(step['crmConflictErrors'].map((x) => [x.type, x])).values()
      );
    } else {
      this.resetCrmConflictErrors(step, ConflictStepType.COMPONENT_ACTION);
    }
  }

  private static handleConflictStepAction(action: string, crmSystemId: string) {
    const actionType = action.includes('update') ? 'update' : 'new';
    return CRM_COMPONENT_ACTION[crmSystemId][actionType];
  }

  private static handleConflictDynamicParam(step, types, crmSystemId) {
    const msgBody = step?.fields?.msgBody;
    const dynamicParamList = this.getDynamicParamListFromMsg(msgBody);
    const dynamicFieldValid = dynamicParamList.every((param) =>
      types?.includes(param)
    );

    if (step?.fields?.isAIGenerated) {
      this.resetCrmConflictErrors(step, ConflictStepType.DYNAMIC_TYPE);
      return;
    }

    if (!dynamicFieldValid) {
      step['crmConflictErrors'] = (step['crmConflictErrors'] || []).concat({
        type: ConflictStepType.DYNAMIC_TYPE,
        message: DisplayConflictStepText.DYNAMIC_TYPE,
        crmSystemId
      });
      step['crmConflictErrors'] = Array.from(
        new Map(step['crmConflictErrors'].map((x) => [x.type, x])).values()
      );

      const invalidParams = dynamicParamList.filter(
        (param) => !types?.includes(param)
      );
      let result = this.replaceConflictDynamicParam(
        new Set(invalidParams),
        msgBody
      );
      step.fields.msgBody = result;
    } else {
      this.resetCrmConflictErrors(step, ConflictStepType.DYNAMIC_TYPE);
    }
  }

  private static replaceConflictDynamicParam(invalidParams, msgBody) {
    invalidParams.forEach((invalidParam) => {
      const pattern = `<span style='color: var\\(--fg-brand, #28ad99\\);' contenteditable='false'>${invalidParam}<\/span>`;
      const doubleQuote = replaceSingleQuotes(pattern);
      const oldPattern = `<span style='color: var\\(--trudi-primary, #00aa9f\\);' contenteditable='false'>${invalidParam}<\/span>`;
      const replacement = `<span style='color: var(--danger-500, #fa3939);' contenteditable='false'>${invalidParam}</span>`;
      msgBody = msgBody.replace(new RegExp(pattern, 'g'), replacement);
      msgBody = msgBody.replace(new RegExp(doubleQuote, 'g'), replacement);
      msgBody = msgBody.replace(new RegExp(oldPattern, 'g'), replacement);
    });
    return msgBody;
  }

  private static resetCrmConflictErrors(
    step,
    type: ConflictStepType,
    crmSystemId?: string
  ) {
    if (!step.crmSystemId && type === ConflictStepType.COMPONENT_ACTION) {
      step.crmSystemId = crmSystemId;
    }
    step['crmConflictErrors'] = (step['crmConflictErrors'] || []).filter(
      (x) => x.type !== type
    );
  }

  public static getDynamicField(crmSystemId) {
    let dynamicData: IListDynamic[];
    switch (crmSystemId) {
      case ECrmSystemId.PROPERTY_TREE:
        dynamicData = PT_LIST_DYNAMIC_PARAMETERS;
        break;
      case ECrmSystemId.RENT_MANAGER:
        dynamicData = RM_LIST_DYNAMIC_PARAMETERS;
        break;
      default:
        break;
    }
    const result = dynamicData
      .flatMap((x) => x.menu)
      .map((x) => {
        return x?.param;
      })
      .filter(Boolean);
    return Array.from(new Set(result));
  }
  public static getCopyNodeWithNewKey(
    node: TreeNodeOptions,
    decisionIndex?: number,
    decisionKey?: string,
    parentKey?: string
  ) {
    let newIndex = decisionIndex || Date.now();

    if ('index' in node && node.type === ETypeElement.DECISION) {
      newIndex = newIndex + 1;
      node.index = newIndex;
    }
    node.key = uuid4();

    if (decisionKey) {
      node.decisionKey = decisionKey;
    }
    if (parentKey) {
      node.parentKey = parentKey;
    }

    if (node.children?.length) {
      node.children = node.children.map((child) => {
        const newChildNode = this.getCopyNodeWithNewKey(
          child,
          newIndex,
          node.type === ETypeElement.DECISION
            ? node.key
            : node.decisionKey || node.key,
          node.key
        );
        return newChildNode;
      });
    }
    return node;
  }

  public static addNewNodeBaseOnKey(
    tree: TreeNodeOptions[],
    key: string,
    newNode: TreeNodeOptions
  ) {
    for (let i = 0; i < tree.length; i++) {
      if (tree[i].key === key) {
        tree.splice(i + 1, 0, newNode);
        return tree;
      }
      if (tree[i].children?.length > 0) {
        this.addNewNodeBaseOnKey(tree[i].children, key, newNode);
      }
    }
    return tree;
  }

  public static buildNodeMapping(nodes: Array<TreeNodeOptions>) {
    const nodeMapping: Record<string, TreeNodeOptions> = {};

    const buildNodeMapping = (nodes: Array<TreeNodeOptions>) => {
      for (const node of nodes) {
        nodeMapping[node.key] = node;
        if (node.children) {
          buildNodeMapping(node.children);
        }
      }
    };

    buildNodeMapping(nodes);
    return nodeMapping;
  }

  public static getNodeTypeLevel(nodeType: ETypeElement): number {
    const level = {
      [ETypeElement.DECISION]: 1,
      [ETypeElement.SECTION]: 2,
      [ETypeElement.STEP]: 3
    };
    return level[nodeType];
  }

  public static updateNode(tree: TreeNodeOptions[], dataNode: TreeNodeOptions) {
    const mapNode = (node: TreeNodeOptions) => {
      if (node.key === dataNode.key) {
        Object.assign(node, dataNode);
        return node;
      }
      if (node.children) node.children = node.children.map(mapNode);
      return node;
    };
    return tree.map(mapNode);
  }

  public static addNodeBelowTargetedNode(
    node: TreeNodeOptions,
    targetedNode: TreeNodeOptions,
    nodes: TreeNodeOptions[]
  ) {
    const clonedNodes = cloneDeep(nodes);
    const nodeMap = TaskTemplateHelper.buildNodeMapping(clonedNodes);
    const insertNode = (
      node: TreeNodeOptions,
      toNode: TreeNodeOptions,
      previousTargetedNode?: TreeNodeOptions
    ) => {
      const isBothDecision =
        node.type === ETypeElement.DECISION &&
        toNode.type === ETypeElement.DECISION;
      const nodeLevel = TaskTemplateHelper.getNodeTypeLevel(node.type);
      const targetedNodeLevel = TaskTemplateHelper.getNodeTypeLevel(
        toNode.type
      );
      const shouldInsertAsChild =
        nodeLevel > targetedNodeLevel ||
        (nodeLevel === targetedNodeLevel &&
          toNode.type === ETypeElement.DECISION &&
          !nodeMap[toNode.parentKey]);

      if (shouldInsertAsChild) {
        if (
          (toNode.key === previousTargetedNode?.parentKey &&
            previousTargetedNode?.key === targetedNode.parentKey) ||
          (toNode.key === previousTargetedNode?.parentKey &&
            previousTargetedNode?.key === targetedNode.key)
        ) {
          const firstDecisionIndex = toNode.children.findIndex(
            (n) => n.type === ETypeElement.DECISION
          );
          const index =
            node.type === ETypeElement.DECISION && !isBothDecision
              ? firstDecisionIndex === -1
                ? toNode.children.length + 1
                : firstDecisionIndex
              : toNode.children.findIndex(
                  (n) => n.key === previousTargetedNode.key
                ) + 1;
          this.insertNodeAsChild(clonedNodes, toNode, node, index);
          return;
        }
        this.insertNodeAsChild(clonedNodes, toNode, node);
      } else {
        const parent = nodeMap[toNode.parentKey];
        if (parent) {
          insertNode(node, parent, toNode);
        } else {
          //handle independent node
          const firstDecisionIndex = clonedNodes.findIndex(
            (n) => n.type === ETypeElement.DECISION
          );
          //DECISION SHOULD ALWAYS BELOW STEP/SECTION SO IF ADD DECISION AT ROOT IT SHOULD BE ABOVE ALL DECISION
          const index =
            node.type === ETypeElement.DECISION && !isBothDecision
              ? firstDecisionIndex === -1
                ? clonedNodes.length + 1
                : firstDecisionIndex
              : clonedNodes.findIndex((n) => n.key === toNode.key) + 1;
          clonedNodes.splice(index, 0, node);
        }
      }
    };
    insertNode(node, nodeMap[targetedNode.key]);
    return clonedNodes;
  }

  public static getNodeByKey(
    key: string,
    nodes: TreeNodeOptions[]
  ): TreeNodeOptions {
    const getNode = (prev, curr: TreeNodeOptions) => {
      if (curr.key === key) return curr;
      if (curr.children && curr.children.length)
        return curr.children.reduce(getNode, prev);
      return prev;
    };
    return nodes.reduce(getNode, null);
  }

  public static insertNodeAsChild(
    nodes: TreeNodeOptions[],
    toNode: TreeNodeOptions,
    node: TreeNodeOptions,
    index?: number
  ) {
    if (index) {
      toNode.children.splice(index, 0, node);
      return TaskTemplateHelper.updateNode(nodes, toNode);
    }

    let newIndex = toNode.children.length + 1;
    switch (node.type) {
      case ETypeElement.STEP:
      case ETypeElement.SECTION:
        //parent must be a decision node
        const firstDecisionIndex = toNode.children.findIndex(
          (n) => n.type === ETypeElement.DECISION
        );
        newIndex =
          firstDecisionIndex === -1
            ? toNode.children.length + 1
            : firstDecisionIndex;
        break;
      case ETypeElement.DECISION:
        break;
    }

    toNode.children.splice(newIndex, 0, node);
    return TaskTemplateHelper.updateNode(nodes, toNode);
  }

  public static getListPreviousStep(
    nodes: TreeNodeOptions[],
    targetedNode: TreeNodeOptions
  ): IPreviousStep[] {
    const clonedNodes = cloneDeep(nodes);
    const fakeNode = {
      key: uuid4(),
      title: '',
      type: ETypeElement.STEP,
      stepType: EStepType.COMMUNICATE,
      fields: {
        msgBody: '',
        title: ''
      }
    };
    const tree = this.formatTemplateData_v2(
      this.addNodeBelowTargetedNode(fakeNode, targetedNode, clonedNodes)
    );
    return this.getNodeByKey(fakeNode.key, tree)?.listPreviousSteps;
  }
}

export const DynamicFieldsGroupByCrm = {
  [ECrmSystemId.PROPERTY_TREE]: TaskTemplateHelper.getDynamicField(
    ECrmSystemId.PROPERTY_TREE
  ),
  [ECrmSystemId.RENT_MANAGER]: TaskTemplateHelper.getDynamicField(
    ECrmSystemId.RENT_MANAGER
  )
};
