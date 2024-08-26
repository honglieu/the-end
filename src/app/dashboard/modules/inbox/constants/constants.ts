import { EMessageType } from '@/app/shared';

export const LAST_MSG_TYPE_EXCLUDED = [
  EMessageType.agentExpectation,
  EMessageType.agentJoin,
  EMessageType.reopened,
  EMessageType.solved,
  EMessageType.deleted,
  EMessageType.changeProperty,
  EMessageType.file,
  EMessageType.syncConversation
];
