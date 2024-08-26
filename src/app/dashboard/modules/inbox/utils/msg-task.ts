import { TaskItem } from '@shared/types/task.interface';
import { EmailItem } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';

const removeActiveItem = (
  activeItems: string[],
  _startIndex: number,
  currentId?: string
) => {
  if (currentId) {
    activeItems = [...activeItems].filter((item) => item !== currentId);
  } else {
    _startIndex = -1;
    activeItems = [];
  }
  return { activeItems, _startIndex };
};

const setActiveItems = (
  isKeepShiftCtr: boolean,
  startIndex: number,
  lastIndex: number,
  activeItems: string[],
  taskItems: TaskItem[] | EmailItem[] | ITaskRow[],
  isSelectConversationId: boolean = false
) => {
  let _activeItems: string[] = [];
  if (isKeepShiftCtr) {
    _activeItems = [...activeItems];
    const activeMsgs = new Set(_activeItems);
    taskItems.forEach(
      (item: TaskItem | EmailItem | ITaskRow, index: number) => {
        if (
          index >= startIndex &&
          index <= lastIndex &&
          !activeMsgs.has(
            isSelectConversationId ? item?.conversationId : item?.id
          )
        ) {
          _activeItems = [
            ..._activeItems,
            isSelectConversationId ? item?.conversationId : item?.id
          ];
        }
      }
    );
  } else {
    taskItems.forEach(
      (item: TaskItem | EmailItem | ITaskRow, index: number) => {
        if (index >= startIndex && index <= lastIndex) {
          _activeItems = [
            ..._activeItems,
            isSelectConversationId ? item?.conversationId : item?.id
          ];
        }
      }
    );
  }
  return _activeItems;
};

const selectedItems = (
  isKeepShiftCtr: boolean,
  startIndex: number,
  lastIndex: number,
  activeItems: string[],
  taskItems: TaskItem[] | EmailItem[] | ITaskRow[],
  isSelectConversationId: boolean = false
) => {
  const [minIndex, maxIndex] = [startIndex, lastIndex].sort((a, b) => a - b);
  return setActiveItems(
    isKeepShiftCtr,
    minIndex,
    maxIndex,
    activeItems,
    taskItems,
    isSelectConversationId
  );
};

const addItem = (
  currentId: string,
  currentIndex: number,
  activeItems: string[]
) => {
  const hasActiveMsg = activeItems.some((item) => item === currentId);
  if (!hasActiveMsg) {
    activeItems = [...activeItems, currentId];
    const _startIndex = currentIndex;
    return { activeItems, _startIndex };
  }
  return null;
};

export { removeActiveItem, addItem, selectedItems };
