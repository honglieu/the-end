import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { conversations, properties } from 'src/environments/environment';
import uuid4 from 'uuid4';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { EMessageType } from '@shared/enum/messageType.enum';
import { TaskStatusType } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { LastUser } from '@shared/types/conversation.interface';
import { IFile } from '@shared/types/file.interface';
import { IPersonalInTab } from '@shared/types/user.interface';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ApiService } from './api.service';
import { trudiUserId } from './constants';
import { ConversationService } from './conversation.service';
import { FileUploadService } from './fileUpload.service';
import { HeaderService } from './header.service';
import { LeaseRenewalService } from './lease-renewal.service';
import { PropertiesService } from './properties.service';
import { TaskService } from './task.service';
import { UserService } from './user.service';
import { FilesService } from './files.service';
import { LandlordToOwnerPipe } from '@shared/pipes/landlord-to-owner.pipe';
import { CompanyService } from './company.service';
@Injectable({
  providedIn: 'root'
})
export class SendMessageService {
  public petRequestResponse: BehaviorSubject<any> = new BehaviorSubject(null);
  public isResetResponse: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private isRmEnvironment: boolean = false;
  private activeMobileApp: boolean = true;
  private validTypeRM = [
    EUserPropertyType.TENANT_PROPERTY,
    EUserPropertyType.TENANT_UNIT,
    EUserPropertyType.TENANT_PROSPECT,
    EUserPropertyType.LANDLORD_PROSPECT,
    EUserPropertyType.LANDLORD
  ];
  public currentMailBoxId: string;
  constructor(
    private apiService: ApiService,
    private conversationService: ConversationService,
    private propertyService: PropertiesService,
    private fileUploadService: FileUploadService,
    public taskService: TaskService,
    public leaseRenewalService: LeaseRenewalService,
    private headerService: HeaderService,
    private userService: UserService,
    private companyEmailSignatureService: CompanyEmailSignatureService,
    private agencyService: AgencyService,
    public inboxService: InboxService,
    private filesService: FilesService,
    private landlordToOwnerPipe: LandlordToOwnerPipe,
    private companyService: CompanyService
  ) {
    this.companyService.getActiveMobileApp().subscribe((status: boolean) => {
      this.activeMobileApp = status;
    });
    this.companyService.getCurrentCompany().subscribe((company) => {
      if (company) {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      }
    });
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(filter((mailBoxId) => !!mailBoxId))
      .subscribe((mailBoxId) => {
        this.currentMailBoxId = mailBoxId;
      });
  }

  sendV2Message(body: any): Observable<any> {
    const contacts = this.formatContactPayloadSendMessage(
      body.textMessage?.optionParam?.contacts
    );
    body.textMessage.optionParam.contacts = contacts;
    body.textMessage.message = body.textMessage.message
      .replace(/(<p>&nbsp;<\/p>)+$/, '')
      .replace(/(&nbsp; )+/, '');
    this.handleMessageTurnOnApp(body.textMessage);
    // isSendFromEmail
    return this.apiService.postAPI(conversations, 'v2/message', body).pipe(
      tap(() => {
        this.headerService.moveCurrentTaskToInprogress();
      })
    );
  }

  sendV3Message(body: any): Observable<any> {
    for (const item of body.textMessages) {
      item.message = item.message
        .replace(/(<p>&nbsp;<\/p>)+$/, '')
        .replace(/(&nbsp; )+/, '');
      this.handleMessageTurnOnApp(item);
    }
    // this.companyEmailSignatureService.mapEmailSignatureV3(body);
    return this.apiService.postAPI(conversations, 'v3/message', body).pipe(
      tap(() => {
        this.headerService.moveCurrentTaskToInprogress();
      })
    );
  }

  scheduleSendV3Message(data: any): Observable<any> {
    const body = data;
    const contacts = this.formatContactPayloadSendMessage(
      body.options?.contacts
    );
    body.options.contacts = contacts;
    return this.apiService.postAPI(
      conversations,
      'message/v3/schedule-send-message',
      body
    );
  }

  sendBulkMessage(body: any): Observable<any> {
    for (const item of body.message) {
      item.contentMessage = item?.contentMessage
        .replace(/(<p>&nbsp;<\/p>)+$/, '')
        .replace(/(&nbsp; )+/, '');
      this.handleMessageTurnOnApp(item);
    }
    return this.apiService
      .postAPI(conversations, 'send-bulk-message', body)
      .pipe(
        tap(() => {
          this.headerService.moveCurrentTaskToInprogress();
        })
      );
  }

  async formatBulkMessageBody(body: any, categoryId: string) {
    const propertyId =
      this.conversationService.currentConversation?.getValue()?.propertyId ||
      body.propertyId;
    const currentTask = this.taskService.currentTask$.getValue();
    const bulkBodyMessage = {
      actionLink: [],
      message: [],
      file: [],
      isResolveConversation: body.isResolveConversation
    };
    const fileUpload = await this.uploadFileS3(
      body?.listOfFiles?.filter((e) => !e?.mediaLink)
    );
    const fileS3 = body?.listOfFiles?.filter((e) => !!e?.mediaLink);
    const checkExistFile = fileS3 ? fileS3 : [];
    bulkBodyMessage.file = [...checkExistFile, ...fileUpload].map((file) => ({
      ...file,
      fileType: file.fileType?.name ?? file.fileType,
      fileName: file?.fileType?.name || file?.fileName,
      fileSize: file?.size || file?.fileSize
    }));
    const dataOptions = body?.contactInfos?.map((element) => ({
      title: element.type,
      address: element.address,
      firstName: element.firstName || '',
      lastName: element.lastName || '',
      mobileNumber: element.mobileNumber || '',
      phoneNumber: element.phoneNumber || '',
      email: element.email || '',
      landingPage: element.landingPage || ''
    }));
    const options = dataOptions?.length && {
      contacts: dataOptions
    };
    body.users.forEach((user) => {
      bulkBodyMessage.message.push({
        categoryId: categoryId,
        propertyId,
        status: 'OPEN',
        userId: body.userId,
        personUserId: user.user ? user.user.id : user.id,
        personUserType: user.user
          ? user?.user?.personUserType
          : user?.personUserType,
        personUserEmail: user.user
          ? user?.user?.personUserEmail
          : user?.personUserEmail,
        categoryMessage: body.categoryMessage,
        contentMessage: this.handleReplaceMess(body.message, user),
        options: options,
        // fileIds: [...this.ticket.fileIds],
        taskId: currentTask?.id
      });
    });
    return bulkBodyMessage;
  }

  async formatBulkLeaseRenewalMessageBody(
    body: any,
    categoryId: string,
    documentType = 'Other'
  ) {
    const propertyId = this.propertyService.currentPropertyId.value;
    const currentTask = this.taskService.currentTask$.getValue();
    const bulkBodyMessage = {
      actionLink: [],
      message: [],
      file: [],
      isResolveConversation: body.isResolveConversation
    };

    bulkBodyMessage.file = await this.uploadFileS3(
      body.listOfFiles,
      documentType
    );
    body.users.forEach((user) => {
      bulkBodyMessage.message.push({
        categoryId: categoryId,
        propertyId,
        status: 'OPEN',
        userId: body.userId,
        personUserId: user.user ? user.user.id : user.id,
        categoryMessage: body.categoryMessage,
        contentMessage: this.handleReplaceMess(body.message, user),
        // options: options,
        // fileIds: [...this.ticket.fileIds],
        taskId: currentTask?.id
      });
    });

    return bulkBodyMessage;
  }

  async formatBulkRoutineInspectionMessageBody(
    body: any,
    categoryId: string,
    documentType = 'Other'
  ) {
    const propertyId = this.propertyService.currentPropertyId.value;
    const currentTask = this.taskService.currentTask$.getValue();
    const bulkBodyMessage = {
      actionLink: [],
      message: [],
      file: [],
      isResolveConversation: body.isResolveConversation
    };

    bulkBodyMessage.file = await this.uploadFileS3(
      body.listOfFiles,
      documentType
    );
    body.users.forEach((user) => {
      bulkBodyMessage.message.push({
        categoryId: categoryId,
        propertyId,
        status: 'OPEN',
        userId: body.userId,
        personUserId: user.user ? user.user.id : user.id,
        categoryMessage: body.categoryMessage,
        contentMessage: this.handleReplaceMess(body.message, user),
        // options: options,
        // fileIds: [...this.ticket.fileIds],
        taskId: currentTask?.id
      });
    });
    return bulkBodyMessage;
  }

  async formatMessageBody(body: any) {
    const message = {} as any;
    message.conversationId =
      body.conversationId ||
      this.conversationService.trudiResponseConversation.getValue().id;
    message.textMessage = {
      message: body.message,
      userId: body.userId,
      isSendFromEmail: this.checkIsSendFromEmail(message.conversationId)
    };
    message.isResolveConversation = body.isResolveConversation;
    message.files = body.files;
    return message;
  }

  formatContactsList(contactInfos?: ISelectedReceivers[]) {
    if (contactInfos && contactInfos.length) {
      return contactInfos.map((contact) => ({
        title: contact.type.toLowerCase(),
        type: contact.type,
        address: contact['address'] || contact['streetLine'],
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        mobileNumber: contact.mobileNumber || '',
        phoneNumber: contact.phoneNumber || '',
        email: contact.email || '',
        landingPage: contact.landingPage || '',
        id: contact.id,
        propertyId: contact.propertyId
      }));
    }
    return [];
  }

  formatV3MessageBody(body: any) {
    const message = {} as any;
    message.isResolveConversation = body.isResolveConversation;
    message.files = body.files;
    message.conversationId = body.conversationId;
    message.textMessages = [];
    message.mailBoxId = this.currentMailBoxId;
    const contactsList = [];
    if (body?.contactInfos) {
      body?.contactInfos.forEach((element) => {
        contactsList.push({
          title:
            this.isRmEnvironment &&
            this.validTypeRM.includes(element.type as EUserPropertyType)
              ? USER_TYPE_IN_RM[element.type as EUserPropertyType]
              : this.landlordToOwnerPipe.transform(
                  element.type.charAt(0) + element.type.slice(1).toLowerCase()
                ),
          type: element.type,
          address: element['address'] || element['streetLine'],
          firstName: element.firstName || '',
          lastName: element.lastName || '',
          mobileNumber: element.mobileNumber || '',
          phoneNumber: element.phoneNumber || '',
          email: element.email || '',
          landingPage: element.landingPage || '',
          id: element.id
        });
      });
    }
    body?.users.forEach((user) => {
      message.textMessages = [
        ...message.textMessages,
        {
          id: body?.textMessages?.[0]?.id || uuid4(),
          message: this.handleReplaceMess(body.message, user),
          userId: body.isTrudi ? trudiUserId : body.userId,
          isSendFromEmail: this.checkIsSendFromEmail(message.conversationId),
          conversationId: user.conversationId,
          optionParam: {
            contacts: contactsList
          }
        }
      ];
    });
    return message;
  }

  async uploadFileS3(listOfFiles: IFile[] = [], documentType = 'Other') {
    if (listOfFiles?.length === 0) return [];
    const documentTypeArr = JSON.parse(
      localStorage.getItem('listDocumentType')
    );
    const documentTypeOtherId = documentTypeArr?.find(
      (item) => item.name === documentType
    )?.id;
    const listFileResponse: any[] = [];
    const propertyId = this.propertyService.currentPropertyId.value;
    const propertyIds = [];
    await Promise.all(
      listOfFiles.map(async (el) => {
        const fileToSend = el[0] ?? el;
        if (fileToSend.mediaLink || fileToSend.fileUrl) {
          const fileName = fileToSend.name || fileToSend.fileName;
          const extensionInName = this.filesService.getFileExtension(fileName);

          const customFileName: string =
            extensionInName === fileToSend.extension
              ? fileName
              : `${fileName}${
                  fileToSend.extension ? '.' + fileToSend.extension : ''
                }`;
          listFileResponse.push({
            localId: fileToSend?.localId,
            documentTypeId: fileToSend.documentTypeId || documentTypeOtherId,
            title: customFileName,
            fileName: customFileName,
            fileSize: fileToSend.size || fileToSend.fileSize,
            fileType:
              fileToSend.fileType?.name ||
              fileToSend.fileType ||
              fileToSend.type,
            mediaLink: fileToSend?.fileUrl || fileToSend.mediaLink,
            parentId: fileToSend?.parentId || '',
            propertyId,
            propertyIds
          });
        } else {
          const { name, size, type } = el;
          const userPropertyIds = [];
          const data = await this.fileUploadService.uploadFile2(
            fileToSend,
            propertyId
          );
          // File upload to s3 because it has no mediaLink
          listFileResponse.push({
            localId: fileToSend?.localId,
            documentTypeId: el.topicId || documentTypeOtherId,
            title: el.title || fileToSend.name,
            fileName: fileToSend.name,
            fileSize: fileToSend.size,
            fileType: fileToSend.type,
            mediaLink: data.Location,
            parentId: fileToSend?.parentId || '',
            propertyId,
            propertyIds
          });
          this.propertyService.addFile2(
            propertyId,
            name,
            size,
            type,
            data.Location,
            userPropertyIds,
            documentTypeOtherId,
            name
          );
        }
      })
    );
    return listFileResponse;
  }

  getListDocumentType() {
    this.apiService
      .getAPI(properties, 'list-of-documenttype')
      .subscribe((res) => {
        if (res) {
          localStorage.setItem('listDocumentType', JSON.stringify(res));
        }
      });
  }

  checkIsSendFromEmail(conversationId: string) {
    const listConversation =
      this.conversationService.listConversationByTask.getValue();
    const targetConversation = listConversation.find(
      (conv) => conv.id === conversationId
    );
    if (!targetConversation) return true;
    return (
      this.conversationService.getConversationType(
        targetConversation.status,
        targetConversation.inviteStatus,
        targetConversation.crmStatus,
        targetConversation.secondaryEmail
      ) === EConversationType.nonApp
    );
  }

  handleReplaceMess(msgContent: string, listUser: any) {
    const firstName = listUser?.firstName ?? '';
    const lastName = listUser?.lastName ?? '';
    const fullName = firstName ? firstName + ' ' + lastName : lastName;

    if (listUser.lastActivity) {
      msgContent = msgContent?.split("<div id='email-signature'>")[0];
    }

    const replacements = [
      { pattern: /{name}/g, value: fullName },
      { pattern: /{Name}/g, value: fullName },
      { pattern: /{owner name}/g, value: fullName },
      { pattern: /{tenant name}/g, value: fullName },
      { pattern: /{receiver name}/g, value: fullName },
      { pattern: /{landlord name}/g, value: fullName },
      { pattern: /{supplier name}/g, value: fullName },
      { pattern: /{amount}/g, value: listUser?.amount || '' },
      {
        pattern: /{property address}/g,
        value: listUser?.propertyAddress || ''
      },
      {
        pattern: /{maintenance issue}/g,
        value: listUser?.maintenanceIsue || ''
      }
    ];

    let optimizedContent = msgContent;
    for (const replacement of replacements) {
      optimizedContent = optimizedContent.replace(
        replacement.pattern,
        replacement.value
      );
    }

    return optimizedContent;
  }

  hasLandlords() {
    return this.mapUsers('ownerships');
  }

  hasTenants() {
    return this.mapUsers('tenancies');
  }

  mapUsers(type: string) {
    const listofUser: IPersonalInTab = this.propertyService.peopleList.value;
    let userProperties = listofUser[type].map((own) => ({
      userProperties: own.userProperties.map((item) => ({
        status: own.status,
        groupId: own.id,
        ...item
      }))
    }));
    const landlords = userProperties.flatMap((item) => item.userProperties);
    const listUserConversation =
      this.conversationService.listConversationByTask.value.map(
        (c) => c.userId
      );
    let intersection = landlords.filter((x) =>
      listUserConversation.includes(x.user.id)
    );
    return intersection.map((userProperty) => ({
      id: userProperty.user.id,
      type: userProperty.type,
      firstName: userProperty.user.firstName,
      lastName: userProperty.user.lastName,
      status: userProperty.status,
      inviteSent: userProperty.user.iviteSent,
      lastActivity: userProperty.user.lastActivity,
      offBoarded: userProperty.user.offBoardedDate,
      propertyId: userProperty.propertyId,
      userPropertyId: userProperty.id,
      groupId: userProperty.groupId,
      checked: false,
      isPrimary: userProperty.isPrimary,
      conversationId:
        this.conversationService.listConversationByTask.value.find(
          (item) => item.userId === userProperty.user.id
        ).id
    }));
  }

  markResolvedConversation(
    isResolveConversation: boolean,
    userId: string,
    isNewConversation: boolean = false
  ) {
    if (!isResolveConversation) return;
    if (isNewConversation) return;
    const currentUser = this.userService.userInfo$.getValue();
    let user: LastUser = null;
    if (userId === trudiUserId) {
      user = {
        firstName: 'Trudi',
        status: 'status',
        isUserPropetyTree: false,
        lastName: '',
        avatar: 'assets/icon/trudi-logo.svg',
        id: trudiUserId,
        type: 'trudi'
      };
    } else if (userId === currentUser.id) {
      user = {
        firstName: currentUser.firstName,
        status: currentUser.status,
        isUserPropetyTree: currentUser.userProperties?.idUserPropetyTree,
        lastName: currentUser.lastName,
        avatar: currentUser.googleAvatar,
        id: currentUser.id,
        type: currentUser.type
      };
    }
    this.headerService.headerState$.next({
      ...this.headerService.headerState$.value,
      currentStatus: TaskStatusType.completed
    });
    this.conversationService.updateConversationStatus$.next({
      status: EMessageType.solved,
      option: null,
      user,
      addMessageToHistory: false
    });
  }

  handleMessageTurnOnApp(item) {
    if (!item.isSendFromEmail && !this.activeMobileApp) {
      item.isSendFromEmail = true;
    }
  }

  formatContactPayloadSendMessage(contacts) {
    return contacts.map((contact) => ({
      ...contact,
      title:
        this.isRmEnvironment &&
        this.validTypeRM.includes(contact.type as EUserPropertyType)
          ? USER_TYPE_IN_RM[contact.type as EUserPropertyType]
          : this.landlordToOwnerPipe.transform(
              contact.type.charAt(0) + contact.type.slice(1).toLowerCase()
            )
    }));
  }
}
