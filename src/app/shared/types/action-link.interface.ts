export interface ConversationCategoryConfig {
  color: string;
  colorType: string;
  consoleOnly: boolean;
  createdAt: string;
  id: string;
  landlord: boolean;
  message: string;
  name: string;
  svg: string;
  tenant: boolean;
  titleOfTopic: string;
  topicId: string;
  updatedAt: string;
}

export interface FormProps {
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButton: boolean;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  subHeading: string;
  title: string;
  topic: string;
  topicId: string;
  statusEDDR?: string;
}

export interface FormInputProps extends FormProps {
  createdAt: string;
  id: string;
  lastUsed: string;
  updatedAt: string;
}

export interface ActionLinkProp {
  createdAt: string;
  id: string;
  lastUsed: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButton: boolean;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  subHeading: string;
  title: string;
  topicId: string;
  updatedAt: string;
  color?: string;
  svg?: string;
}

export interface ActionLinkItem {
  id: string;
  topicId: string;
  title: string;
  subHeading: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButton: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferActionLinkProp {
  id: string;
  actionLink: ActionLinkProp;
}

export interface CategoryUser {
  color: string;
  colorType: string;
  consoleOnly: boolean;
  createdAt: string;
  id: string;
  landlord: boolean;
  message: string;
  name: string;
  svg: string;
  tenant: boolean;
  titleOfTopic: string;
  updatedAt: string;
  hideEdit?: boolean;
}

export interface GlobalActionLinkResponse {
  totalItems: number;
  response: ActionLinkItem[];
  totalPages: number;
  currentPage: number;
}
