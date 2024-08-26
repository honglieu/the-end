import { EFileType } from '@shared/enum/file-type';

export interface AgentFileProp {
  createdAt: string;
  documentTypeId: string;
  id: string;
  mediaLink: string;
  name: string;
  title: string;
  thumbMediaLink?: string;
  text: string;
  fileType: {
    icon: string;
  };
  user: {
    firstName: string;
    lastName: string;
  };
  propertyDocument?: {
    createdAt: string;
    documentTypeId: string;
    id: string;
    mediaLink: string;
    name: string;
    title: string;
    thumbMediaLink?: string;
    text: string;
    fileType: {
      icon: string;
    };
    user: {
      firstName: string;
      lastName: string;
    };
  };
  userPropertyFilePermissions: {
    id: string;
    fullName?: string;
    userProperty: {
      id: string;
      isPrimary: boolean;
      status: string;
      type: string;
      userId: string;
      user: {
        firstName: string;
        lastName: string;
        iviteSent: string;
        lastActivity: string;
      };
      userPropertyGroup: {
        name: string;
      };
    };
  }[];
  isPdf?: boolean;
  isVideo?: boolean;
  isImage?: boolean;
  fileTypeDot?: EFileType;
}

export interface FileToSendProp {
  id: string;
  fileName: string;
}

export interface IAttachmentFile {
  documents: IAttachDocument[];
}

export interface PropertyDocument {
  id: string;
  mediaLink: string;
  thumbMediaLink: string | null;
  fileType: {
    icon: string;
    name: string;
  };
  name: string;
  size: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    contactType: string | null;
  };
  isUserUpload: boolean;
  syncPTStatus: string;
  fileTypeDot: string;
  thumbnail: string;
  conversationId: string;
  fileIcon: string;
}

export interface IAttachDocument {
  conversationId: string;
  startMessageBy: string;
  userId: string;
  firstName: string;
  lastName: string;
  userType: string;
  contactType: string | null;
  propertyType: string;
  propertyDocuments: PropertyDocument[];
}
