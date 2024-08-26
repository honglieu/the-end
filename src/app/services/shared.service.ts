import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { EUserPropertyType, UserTypeEnum } from '@shared/enum/user.enum';
import { SendBulkMessageResponse } from '@shared/types/conversation.interface';
import { SyncResponse } from '@shared/types/send-maintenance.interface';
import { TypeWithTForConversationMap } from '@shared/types/share.model';
import {
  Intents,
  IShowPopupNotifyNewVersion
} from '@shared/types/trudi.interface';
import { FilesService } from './files.service';
import dayjs from 'dayjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private globalSearching = new Subject<void>();
  public isLoadingSyncCard$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  textContainerHeight = new BehaviorSubject(36);
  rightSidebarCollapseState$ = new BehaviorSubject(false);
  leftSidebarCollapseState$ = new BehaviorSubject(false);
  isStatusStepQuote$ = new BehaviorSubject(false);
  isResetListFile = new BehaviorSubject(false);
  maintenanceBottom = new BehaviorSubject(false);
  statusMaintenace = new BehaviorSubject('');
  statusMaintenaceRealTime: BehaviorSubject<SyncResponse> = new BehaviorSubject(
    null
  );
  checkStatus = new BehaviorSubject('');
  assignTaskInTooltipSemiPath = new BehaviorSubject<Intents>(null);
  checkConversationRealId: BehaviorSubject<string> = new BehaviorSubject('');
  userType: UserTypeEnum | string;
  public showPopupNotifyNewVersion: BehaviorSubject<IShowPopupNotifyNewVersion> =
    new BehaviorSubject(null);
  public showPopupNotifyNewVersion$ =
    this.showPopupNotifyNewVersion.asObservable();
  private loadingDetailHeader = new BehaviorSubject<boolean>(false);
  constructor(
    private filesService: FilesService,
    private userService: UserService
  ) {}

  setLoadingDetailHeader(isLoading: boolean) {
    this.loadingDetailHeader.next(isLoading);
  }

  getLoadingDetailHeader(): Observable<boolean> {
    return this.loadingDetailHeader.asObservable();
  }

  triggerGlobalSearching() {
    this.globalSearching.next();
  }

  isGlobalSearching$() {
    return this.globalSearching.asObservable();
  }

  setShowPopupNotifyNewVersion(value: IShowPopupNotifyNewVersion) {
    this.showPopupNotifyNewVersion.next(value);
  }

  getUserPropertyStatus(status: string) {
    if (status.toLowerCase() === 'prospect') {
      return 'prospective';
    }
    return status.toLowerCase();
  }

  isConsoleUsers(): boolean {
    const currentUser = this.userService.userInfo$?.getValue();
    return (
      window.location.href.includes('console') ||
      [
        UserTypeEnum.AGENT,
        UserTypeEnum.ADMIN,
        UserTypeEnum.SUPERVISOR
      ].includes(currentUser?.type as UserTypeEnum)
    );
  }

  displayName(firstName: string, lastName: string): string {
    if (!firstName && !lastName) {
      return null;
    }
    if (!firstName) {
      return lastName.trim();
    }
    return (firstName + ' ' + (lastName || '')).trim();
  }

  removeCommaInNumber(number: string) {
    if (!number) {
      return '';
    }
    return number.split(',').join('');
  }

  displayCapitalizedName(firstName: string, lastName: string): string {
    const arrName = `${firstName || ''} ${lastName || ''}`.trim().split(' ');
    if (arrName.length >= 2) {
      return arrName[0].charAt(0) + arrName[1].charAt(0);
    } else if (arrName.length === 1) {
      return arrName[0].charAt(0) + (arrName[0]?.charAt(1) || '');
    } else {
      return '';
    }
  }

  nthNumber(number) {
    const nth =
      number > 0
        ? ['th', 'st', 'nd', 'rd'][
            (number > 3 && number < 21) || number % 10 > 3 ? 0 : number % 10
          ]
        : '';
    return number + nth;
  }

  formatDateNth(date) {
    const dateUtc = dayjs(date).utc();
    const month = dateUtc.format('MMMM');
    const nth = this.nthNumber(Number(dateUtc.format('DD')));
    const day = dateUtc.format('dddd');
    return `${day} ${nth} ${month}`;
  }

  displayCapitalizeFirstLetter(string: string) {
    if (!string) return '';
    return string?.charAt(0)?.toUpperCase() + string?.slice(1);
  }

  displayAllCapitalizeFirstLetter(string: string) {
    if (!string) {
      return '';
    } else {
      const contactTypeArr = string.split(' ');
      if (contactTypeArr.length > 1) {
        return (
          this.displayCapitalizeFirstLetter(contactTypeArr[0]) +
          ' ' +
          this.displayCapitalizeFirstLetter(contactTypeArr[1])
        );
      }
      return this.displayCapitalizeFirstLetter(contactTypeArr[0]);
    }
  }

  isPlural(number): string {
    return number > 1 ? 's' : '';
  }

  getFileType(typeValue: string) {
    if (!typeValue) {
      return null;
    }
    const nameDividedBySlash = typeValue.split('/');
    return nameDividedBySlash[nameDividedBySlash.length - 1];
  }

  mapFileTypeDot(fileProperties) {
    fileProperties = fileProperties?.map((item) => {
      item.fileTypeDot = this.filesService.getFileTypeDot(item.name);
      item.thumbnail = this.filesService.getThumbnail(item);
      return item;
    });
  }

  mapConversationToUser<T, V>(
    receivers: TypeWithTForConversationMap<T, V>[],
    newUsers: TypeWithTForConversationMap<T, V>[],
    res: SendBulkMessageResponse[],
    action: V
  ) {
    const oldReceivers = receivers.map((receiver) => ({
      ...receiver,
      conversationId:
        receiver.raiseBy !== 'USER' && !receiver.conversationId
          ? this.findConversationIdByPersonUserId(receiver.id, res)
          : receiver.conversationId
    }));
    const oldReceiverIds = oldReceivers.map((e) => e.id);
    const newReceiver = newUsers
      .filter((user) => !oldReceiverIds.includes(user.id))
      .map((el) => ({
        ...el,
        conversationId: this.findConversationIdByPersonUserId(el.id, res),
        action: action,
        raiseBy: EUserPropertyType.AGENT
      }));

    return [...oldReceivers, ...newReceiver];
  }

  findConversationIdByPersonUserId(
    personUserId: string,
    sendBulkResponse: SendBulkMessageResponse[]
  ) {
    return sendBulkResponse.find((el) => el.personUserId === personUserId)
      ?.conversationId;
  }
}
