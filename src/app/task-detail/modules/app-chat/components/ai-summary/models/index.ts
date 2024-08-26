export type SummaryFile = any;
export type MediaFile = {};

export type TaskSummary = {
  id: string;
  taskId: string;
  conversationId: string;
  summaryContent: string;
  updatedAt: string;
  createdAt: string;
  propertyDocumentIds: string[];
  propertyDocuments: any[];
  conversation: IConversationType;
};
export type IConversationType = {
  id: string;
  title: string;
};

export type Conversation = {
  id: string;
  type: string;
  firstName: string;
  lastName: string;
  fullName: string;
  startMessageBy: string;
  propertyType: string;
  contactType: string;
  isPrimary: boolean;
  receiveUserId: string;
  messageOwnerId: string;
};
