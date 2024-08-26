import { EUserPropertyType, GroupType } from '@shared/enum/user.enum';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { Params } from '@angular/router';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { TrudiBody } from '@shared/types/trudi.interface';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import { LABEL_NAME_OUTLOOK } from '@services/constants';
import { IParticipant } from '@shared/types/conversation.interface';
import { Tree } from './folder';

export const hasTaskFilter = (currentQueryParams: Params): boolean => {
  return (
    currentQueryParams[ETaskQueryParams.SEARCH] ||
    currentQueryParams[ETaskQueryParams.CALENDAR_EVENT]?.length > 0 ||
    (currentQueryParams[ETaskQueryParams.INBOXTYPE] === GroupType.TEAM_TASK &&
      currentQueryParams[ETaskQueryParams.ASSIGNED_TO]?.length > 0) ||
    currentQueryParams[ETaskQueryParams.END_DATE] ||
    currentQueryParams[ETaskQueryParams.START_DATE] ||
    currentQueryParams[ETaskQueryParams.TASK_EDITOR_ID]?.length > 0 ||
    currentQueryParams[ETaskQueryParams.PROPERTY_MANAGER_ID]?.length > 0
  );
};

export const hasMessageFilter = (
  currentQueryParams: Params,
  selectedPortfolio?: string[],
  selectedAgency?: string[],
  selectedStatus?: string[]
): boolean => {
  return (
    currentQueryParams[ETaskQueryParams.SEARCH] ||
    (currentQueryParams[ETaskQueryParams.INBOXTYPE] === GroupType.TEAM_TASK &&
      currentQueryParams[ETaskQueryParams.ASSIGNED_TO]?.length > 0) ||
    currentQueryParams[ETaskQueryParams.PROPERTY_MANAGER_ID]?.length > 0 ||
    currentQueryParams[ETaskQueryParams.MESSAGE_STATUS]?.length > 0 ||
    selectedPortfolio?.length ||
    selectedAgency?.length ||
    selectedStatus?.length
  );
};

// Note: This function has same business get display name participant in Inbox page
export const getParticipantNameDisplay = (
  participant: IParticipant,
  options: {
    isRmEnvironment: boolean;
  } = {
    isRmEnvironment: false
  }
): string => {
  const formatParticipantRole = (
    participant: IParticipant,
    isRmEnvironment: boolean
  ) => {
    const propertyType =
      participant?.userPropertyType ||
      participant?.userProperties?.[0]?.type ||
      participant?.type;
    if (!participant.type || participant.type === EUserPropertyType.EXTERNAL)
      return '';
    switch (propertyType) {
      case EConfirmContactType.OTHER:
        return participant?.contactType?.replace('_', ' ');
      case EConfirmContactType.AGENT:
        return 'Property Manager';
      case EUserPropertyType.LANDLORD:
        return 'Owner';
      case EUserPropertyType.LANDLORD_PROSPECT:
        return 'Owner prospect';
      case EConfirmContactType.TENANT_UNIT:
        return isRmEnvironment
          ? USER_TYPE_IN_RM.TENANT_UNIT.replace(/[()]/g, '')
          : propertyType;
      case EConfirmContactType.TENANT_PROPERTY:
        return isRmEnvironment
          ? USER_TYPE_IN_RM.TENANT_PROPERTY.replace(/[()]/g, '')
          : propertyType;
      case EConfirmContactType.UNIDENTIFIED:
      case EConfirmContactType.MAILBOX:
        return '';
      default:
        if (participant?.type === EUserPropertyType.SUPPLIER) {
          return EConfirmContactType.SUPPLIER;
        } else if (participant?.type === EUserPropertyType.OTHER) {
          return participant?.contactType?.replace('_', ' ');
        } else {
          return propertyType === EUserPropertyType.USER
            ? ''
            : propertyType.replace('_', ' ') || '';
        }
    }
  };

  const formatParticipantTitle = (participant: IParticipant) => {
    const { firstName, lastName, email, phoneNumber } = participant;
    if (!participant.type || participant.type === EUserPropertyType.EXTERNAL) {
      return firstName || lastName || email || phoneNumber || '';
    }
    if (!firstName && !lastName) {
      return email || phoneNumber || '';
    }
    return firstName || lastName || '';
  };

  const userTitle = formatParticipantTitle(participant);
  const userRole = formatParticipantRole(participant, options.isRmEnvironment);
  return !!userRole?.length
    ? `${userTitle} (${
        userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase()
      })`
    : userTitle;
};

const toTitleCase = (input: string): string => {
  return input.length === 0
    ? ''
    : input.replace(
        /\w\S*/g,
        (txt) => txt[0].toUpperCase() + txt.slice(1).toLowerCase()
      );
};

export const getFormatParticipantElement = (
  participant: any,
  isRmEnvironment: boolean = false,
  isContactType: boolean = false,
  isPrefillReceiverField: boolean = false,
  highlightUnidentifiedContact: boolean = true
) => {
  let fullName = isContactType
    ? participant.label
    : getParticipantNameDisplay(participant, {
        isRmEnvironment: isRmEnvironment
      });

  if (
    !isContactType &&
    participant.type &&
    participant.type !== EUserPropertyType.UNIDENTIFIED
  ) {
    fullName = toTitleCase(fullName);
  }

  if (
    highlightUnidentifiedContact &&
    ((!participant.type && !isPrefillReceiverField) ||
      (participant.type === EUserPropertyType.UNIDENTIFIED &&
        !participant?.isValid))
  )
    return {
      content: fullName,
      isUnidentified: true
    };
  return {
    content: fullName,
    isUnidentified: false
  };
};

// Note: This function has same business check unhappy flow in Inbox page (message-view-row.component.ts)
export const checkUnhappyFlow = (
  conversation,
  isRmEnvironment: boolean
): boolean => {
  const trudiResponseData =
    conversation.trudiResponse?.data[0]?.body || ({} as TrudiBody);
  const fixedContactTypes = [
    EConfirmContactType.SUPPLIER,
    EConfirmContactType.OTHER
  ];
  const {
    unhappyStatus,
    isUnHappyPath = false,
    isUnindentifiedProperty
  } = trudiResponseData;

  const isMessageFromRM = [
    EUserPropertyType.TENANT_PROSPECT,
    EUserPropertyType.LANDLORD_PROSPECT,
    EUserPropertyType.OWNER_PROSPECT,
    EUserPropertyType.LANDLORD
  ].includes(conversation?.startMessageBy as EUserPropertyType);

  const { confirmContactType = null, isConfirmProperty } = unhappyStatus || {};

  return conversation.trudiResponse?.data?.[0]?.body?.isUnVerifiedPhoneNumber
    ? false
    : ((isRmEnvironment
        ? !isMessageFromRM && isUnindentifiedProperty
        : isUnindentifiedProperty) &&
        !fixedContactTypes.includes(confirmContactType)) ||
        (!((isUnHappyPath && isConfirmProperty) || isUnindentifiedProperty) &&
          fixedContactTypes.includes(confirmContactType));
};

export const formatParticipantList = (
  participantList: IParticipant[],
  options: { isRmEnvironment: boolean }
) => {
  return participantList
    .map((participant) => {
      return {
        ...participant,
        isUnidentifiedContact:
          !participant.type || participant.type === EUserPropertyType.EXTERNAL,
        title: getParticipantNameDisplay(participant, {
          isRmEnvironment: options.isRmEnvironment
        })?.trim()
      };
    })
    ?.filter((participant) => !!participant.title);
};

export const formatParticipantTooltip = (participantList: IParticipant[]) => {
  return participantList.map((participant) => {
    if (participant.isUnidentifiedContact) {
      return (
        (participant.email || participant.phoneNumber || participant.title) +
        ' (Unidentified contact)'
      );
    }
    return participant.title;
  });
};

// Note: Use this function to get 'Deleted Items' folder externalId (OUTLOOK FOLDERS)
export const getDeletedItemsFolderExternalId = (
  folderService: FolderService,
  emailFolders: Tree,
  mailBoxId
) => {
  const list = folderService.flattenTreeEmailFolder(
    emailFolders?.tree,
    '',
    mailBoxId
  );
  const externalId: string = list?.find(
    (item) => item.name === LABEL_NAME_OUTLOOK.DELETED_ITEMS
  )?.externalId;
  return externalId;
};
