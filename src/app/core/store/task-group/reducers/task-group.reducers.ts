import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { taskGroupApiActions } from '@core/store/task-group/actions/task-group-api.actions';
import { taskGroupPageActions } from '@core/store/task-group/actions/task-group-page.actions';
import {
  IDBITaskGroup,
  TaskGroupReducerState
} from '@core/store/task-group/types';
import { taskGroupActions } from '@core/store/task-group/actions/task-group.actions';

export const taskGroupEntityAdapter: EntityAdapter<IDBITaskGroup> =
  createEntityAdapter<IDBITaskGroup>({
    selectId: (taskGroup: IDBITaskGroup) => taskGroup.taskGroup.id
  });

const initialState: TaskGroupReducerState =
  taskGroupEntityAdapter.getInitialState({
    total: 0,
    fetching: false,
    isFromCache: false,
    error: null,
    payload: {
      payloadProcess: {
        search: '',
        taskFolderId: '',
        isFocusedView: true,
        assigneeIds: [],
        propertyManagerIds: [],
        events: {
          eventTypes: [],
          startDate: '',
          endDate: ''
        },
        taskTypeIds: []
      },
      payloadCompleted: {
        search: '',
        taskFolderId: '',
        isFocusedView: true,
        assigneeIds: [],
        propertyManagerIds: [],
        events: {
          eventTypes: [],
          startDate: '',
          endDate: ''
        },
        taskTypeIds: []
      }
    }
  });

export const taskGroupReducer = createReducer(
  initialState,
  on(taskGroupPageActions.enterPage, (state) => {
    return {
      ...state
    };
  }),
  on(taskGroupPageActions.exitPage, (_state) => initialState),
  on(taskGroupApiActions.getTaskGroupsSuccess, (state, { taskGroup }) => {
    const newState = taskGroupEntityAdapter.setAll(taskGroup, state);
    return {
      ...newState,
      fetching: false,
      isFromCache: false
    };
  }),
  on(taskGroupApiActions.getTaskGroupsFailure, (state, { error }) => {
    // handle error
    return taskGroupEntityAdapter.removeAll({
      ...state,
      error,
      fetching: false
    });
  }),
  on(
    taskGroupPageActions.payloadChange,
    (state, { payloadProcess, payloadCompleted }) => {
      return {
        ...state,
        payload: {
          payloadProcess,
          payloadCompleted
        },
        fetching: true,
        error: false
      };
    }
  ),
  on(taskGroupActions.getCacheTaskGroup, (state, { taskGroups }) => {
    if (!taskGroups?.length) {
      return state;
    }
    const newState = taskGroupEntityAdapter.setAll(taskGroups, {
      ...state,
      fetching: false,
      isFromCache: true
    });
    return newState;
  }),
  on(taskGroupActions.setAll, (state, { taskGroups }) => {
    return taskGroupEntityAdapter.setAll(taskGroups, state);
  }),
  on(taskGroupActions.setTaskGroup, (state, { taskGroups }) => {
    return taskGroupEntityAdapter.setAll(taskGroups, state);
  }),
  on(taskGroupActions.setTaskList, (state, { taskList, groupId }) => {
    let newGroup = {
      id: groupId,
      changes: { ...state.entities[groupId], data: taskList }
    };
    return taskGroupEntityAdapter.updateOne(newGroup, state);
  }),
  on(taskGroupActions.updateTaskGroup, (state, { taskGroup, taskGroupId }) => {
    const groupToUpdate = { id: taskGroupId, changes: taskGroup };
    return taskGroupEntityAdapter.updateOne(groupToUpdate, state);
  }),
  on(taskGroupActions.updateTask, (state, { task }) => {
    const taskGroup = state.entities[task.taskGroupId];
    if (!taskGroup || !taskGroup.data) {
      return state;
    }

    const updatedTasks = taskGroup.data.map((taskItem) =>
      taskItem.id === task.id ? { ...taskItem, ...task } : taskItem
    );

    return taskGroupEntityAdapter.updateOne(
      {
        id: task.taskGroupId,
        changes: { data: updatedTasks }
      },
      state
    );
  })
);
