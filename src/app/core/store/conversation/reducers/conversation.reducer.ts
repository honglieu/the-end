import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  IConversationMessage,
  ConversationReducerState,
  IConversationEntity
} from '@core/store/conversation/types';
import {
  conversationActions,
  conversationPageActions
} from '@core/store/conversation/actions/conversation.actions';
import { LIMIT_ITEMS_INMEMORY_CONVERSATION } from '@core/store/conversation/constant';

export const conversationEntityAdapter: EntityAdapter<IConversationEntity> =
  createEntityAdapter<IConversationEntity>({
    selectId: (message: IConversationEntity) => message.id
  });

export const conversationMessageEntityAdapter: EntityAdapter<IConversationMessage> =
  createEntityAdapter<IConversationMessage>({
    selectId: (message: IConversationMessage) => message.id
  });

function createDefaultConversationEntity(
  props: Partial<IConversationEntity>
): IConversationEntity {
  return conversationMessageEntityAdapter.getInitialState({
    id: '',
    currentConversation: null,
    fetchingMore: false,
    fetching: false,
    error: null,
    total: 0,
    totalPage: 0,
    groupMessage: [],
    actionDetail: null,
    currentProperty: null,
    payload: {
      page: 0,
      limit: 20,
      pageLimit: 20
    },
    ...props
  });
}

function getMatchedOrDefaultConversationEntity(
  state: ConversationReducerState,
  id: string
): IConversationEntity {
  return state.entities[id] || createDefaultConversationEntity({ id });
}
// omit: undefined, null, empty string, empty array, empty object
function omitEmpty(obj: any) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && Object.keys(value).length === 0)
    ) {
      return acc;
    }
    return { ...acc, [key]: value };
  }, {});
}

function mergeConversationPartialState(
  memState: IConversationEntity,
  dbState: Partial<IConversationEntity>
): IConversationEntity {
  const mergedProps = {
    ...omitEmpty(dbState),
    ...omitEmpty(memState)
  } as Partial<IConversationEntity>;

  const ids = Object.keys(mergedProps?.entities || {});

  return createDefaultConversationEntity({
    ...mergedProps,
    ids
  });
}
const initialState: ConversationReducerState =
  conversationEntityAdapter.getInitialState({
    currentConversationId: null
  });

export const conversationReducer = createReducer(
  initialState,
  on(conversationActions.updateConversationState, (state, action) => {
    const matchingConversation = getMatchedOrDefaultConversationEntity(
      state,
      action.id
    );
    const mergedConversation = mergeConversationPartialState(
      matchingConversation,
      action.state
    );
    return conversationEntityAdapter.upsertOne(
      {
        ...mergedConversation,
        id: action.id
      } as IConversationEntity,
      state
    );
  }),
  on(conversationActions.setGroupMessage, (state, action) => {
    const matchingConversation = getMatchedOrDefaultConversationEntity(
      state,
      action.id
    );

    return conversationEntityAdapter.upsertOne(
      {
        ...matchingConversation,
        id: action.id,
        groupMessage: action.groupMessage
      } as IConversationEntity,
      state
    );
  }),
  on(conversationActions.setActionDetail, (state, action) => {
    const matchingConversation = getMatchedOrDefaultConversationEntity(
      state,
      action.id
    );

    return conversationEntityAdapter.upsertOne(
      {
        ...matchingConversation,
        id: action.id,
        actionDetail: action.actionDetail
      } as IConversationEntity,
      state
    );
  }),
  on(conversationActions.setAllConversationMessages, (state, action) => {
    const matchingConversation = getMatchedOrDefaultConversationEntity(
      state,
      action.id
    );

    const subEntity = conversationMessageEntityAdapter.setAll(
      action.conversations,
      matchingConversation
    );
    return conversationEntityAdapter.upsertOne(
      {
        id: action.id,
        ...subEntity
      } as IConversationEntity,
      state
    );
  }),
  on(conversationActions.setCurrentConversation, (state, action) => {
    const matchingConversation = getMatchedOrDefaultConversationEntity(
      state,
      action.id
    );

    // Update the current conversation id if the conversation is changed
    const newConversationId =
      action.conversation?.id === state.currentConversationId
        ? state.currentConversationId
        : action.conversation?.id;

    return conversationEntityAdapter.upsertOne(
      {
        ...matchingConversation,
        id: action.id,
        currentConversation: action.conversation,
        currentConversationId: newConversationId
      } as IConversationEntity,
      state
    );
  }),
  on(conversationActions.setCurrentProperty, (state, action) => {
    return conversationEntityAdapter.upsertOne(
      {
        id: action.id,
        currentProperty: action.property
      } as IConversationEntity,
      state
    );
  }),
  on(conversationActions.clearConversation, (state, action) => {
    return conversationEntityAdapter.removeOne(action.id, state);
  }),
  on(conversationPageActions.setCurrentConversationId, (state, action) => {
    return {
      ...state,
      currentConversationId: action.id
    };
  }),
  on(conversationPageActions.loadConversationState, (state, action) => {
    const subEntity = getMatchedOrDefaultConversationEntity(state, action.id);
    const { entities } = state;
    const isExistKey = Boolean(entities[action.id]);
    let entriesArr = Object.entries(entities).filter(
      ([key]) => key !== 'undefined'
    );

    if (action.conversation) {
      subEntity.currentConversation = action.conversation;
    }

    if (
      entriesArr.length === LIMIT_ITEMS_INMEMORY_CONVERSATION &&
      !isExistKey
    ) {
      entriesArr.shift();
    }
    entriesArr.push([action.id, subEntity]);
    const newEntities = Object.fromEntries(entriesArr);

    return {
      ...state,
      currentConversationId: action.id,
      entities: {
        ...newEntities
      }
    };
  })
);
