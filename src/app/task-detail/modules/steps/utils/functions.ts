import {
  EStepType,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { NodeType } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/node-type.enum';
import { TrudiButtonEnumStatus } from '@/app/shared/enum/trudiButton.enum';
import { cloneDeep } from 'lodash-es';

export const example = () => {};

export function mergeObjects(object1, object2) {
  const mergedObject = {};

  const keys1 = object1 ? Object.keys(object1) : [];
  const keys2 = object2 ? Object.keys(object2) : [];
  const keys = [...new Set([...keys1, ...keys2])];

  keys.forEach((key) => {
    if (object2 && object2[key] !== null && object2[key] !== undefined) {
      mergedObject[key] = object2[key];
    } else {
      mergedObject[key] = object1 ? object1[key] : undefined;
    }
  });

  return mergedObject;
}

export function getStepInDecision(currentDecision) {
  let steps = currentDecision?.steps ?? currentDecision?.buttons ?? [];
  steps = steps.map((decisionStep) => ({
    ...decisionStep,
    buttons: decisionStep.buttons?.filter(
      (button) => button.stepType !== EStepType.RENT_MANAGER
    )
  }));
  steps = addLineToStep(steps);
  return steps;
}

export function addLineToStep(steps = []) {
  return steps?.map((step, index, array) => {
    const first =
      !!array[index + 1] &&
      array[index + 1]?.type === ETypeElement.STEP &&
      array[index - 1]?.type !== ETypeElement.STEP;
    const last =
      !!array[index - 1] &&
      array[index - 1]?.type === ETypeElement.STEP &&
      array[index + 1]?.type !== ETypeElement.STEP;
    return {
      ...step,
      hasLine:
        (!first &&
          !last &&
          index < array.length - 1 &&
          array[index + 1]?.type === ETypeElement.STEP) ||
        (index === array.length - 1 &&
          array[index - 1]?.type === ETypeElement.STEP),
      first,
      last,
      he: true
    };
  });
}
export function mergeStepDetail(step, stepDetail, unreadComments) {
  const currentStepUnread = unreadComments?.unReadData?.find(
    (item) => item?.stepId === step?.id
  );

  return {
    ...step,
    ...stepDetail,
    stepDetailId: stepDetail.id,
    id: step.id,
    unreadComment: currentStepUnread?.hasUnreadNote
  };
}

export function mapTaskWorkFlow(
  trudiResponse,
  stepMap,
  showIgnored = true,
  unreadComments
) {
  let primarySteps = [];
  let decisions = [];
  let clonedTrudiResponse = cloneDeep(trudiResponse);
  try {
    const mapSteps = (steps: any[]) => {
      const newSteps = steps.map((step) => {
        if (step.type === ETypeElement.STEP && stepMap[step.id])
          return mergeStepDetail(step, stepMap[step.id], unreadComments);
        if (step.type === ETypeElement.SECTION) {
          step.buttons = addLineToStep(mapSteps(step.buttons));
          return step;
        }
        return step;
      });
      return showIgnored
        ? newSteps
        : newSteps.filter((step) => !step.isIgnored);
    };
    primarySteps = mapSteps(clonedTrudiResponse.data?.steps || []);

    const mapDecision = (decision) => {
      if (decision.hasOwnProperty('steps') && decision['steps']?.length) {
        let newSteps = addLineToStep(mapSteps(decision['steps']));
        decision.steps = newSteps;
      }

      if (decision.hasOwnProperty('decisions') && decision.decisions?.length) {
        const newDecisions = decision.decisions.map(mapDecision);
        decision.decisions = newDecisions;
      }
      return decision;
    };
    decisions = clonedTrudiResponse.data?.decisions.map(mapDecision);
    return {
      primarySteps: addLineToStep(primarySteps),
      decisions
    };
  } catch (err) {
    console.error(err);
    return {
      primarySteps,
      decisions
    };
  }
}

function collectSteps(node, steps = []) {
  //node as STEP
  if (node.type === 'STEP') {
    steps.push(node);
    return;
  }
  //node as SECTION
  if (node.type === 'SECTION' && node.buttons?.length) {
    steps.push(...node.buttons);
    return;
  }

  //node as DECISION
  if (node.type === NodeType.DECISION && node.steps) {
    for (const step of node.steps) {
      collectSteps(step, steps);
    }
  }
  //case decision has child decision
  const currentDecision = node.decisions?.find(
    (decision) => decision.id === node.childDecisionKey
  );
  if (node.decisions && currentDecision) {
    collectSteps(currentDecision, steps);
  }
  return;
}

export function isCurrentStepMarker(status: TrudiButtonEnumStatus) {
  return [
    TrudiButtonEnumStatus.COMPLETED,
    TrudiButtonEnumStatus.EXECUTED
  ].includes(status);
}

export function getAllListSteps(data, currentDecisionIndex?) {
  const steps = [];
  data.forEach((item) => {
    if (Number.isInteger(currentDecisionIndex))
      currentDecisionIndex === item.index && collectSteps(item, steps);
    else collectSteps(item, steps);
  });
  return steps;
}

export async function blobUrlToFile(blobUrl: string): Promise<File> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  const mimeType = blob.type;
  const fileName = `pasted_image_${new Date().getTime()}.${
    mimeType.split('/')[1]
  }`;
  return new File([blob], fileName, { type: mimeType });
}

export function base64ToFile(base64String: string): File {
  // Extract the MIME type and base64 data
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  if (matches && matches.length === 3) {
    const mimeType = matches[1];
    const base64Data = matches[2];

    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: mimeType });
    const fileName = `pasted_image_${new Date().getTime()}.${
      mimeType.split('/')[1]
    }`;
    return new File([blob], fileName, { type: mimeType });
  }

  throw new Error('Invalid base64 string');
}

export function createFileListFromFiles(files: File[]): FileList {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer.files;
}

export function decodeHTMLEntities(text: string) {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}
