import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import {
  Observable,
  catchError,
  combineLatest,
  concatMap,
  distinctUntilChanged,
  filter,
  finalize,
  first,
  forkJoin,
  map,
  of,
  switchMap,
  take,
  tap
} from 'rxjs';
import { EAddOn } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ConfigPlan } from '@/app/console-setting/agencies/utils/console.type';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ChatGptService } from '@services/chatGpt.service';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { UPGRADE_REQUEST_SENT } from '@services/messages.constants';
import { PermissionService } from '@services/permission.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { EMessageType } from '@shared/enum/messageType.enum';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { TaskItem } from '@shared/types/task.interface';
import { PropertyDocument } from '@shared/types/user-file.interface';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ISummaryContent } from '@/app/task-detail/modules/steps/utils/communicationType';
import { AISummaryApiService } from './apis/ai-summary-api.service';
import { Conversation, TaskSummary } from './models';
import { ConversationState } from './state/conversation-state';
import { FileState } from './state/file-state';
import { SummaryContentState } from './state/summary-content-state';
import { CompanyService } from '@services/company.service';
import { preventOpenModalList } from '@shared/constants/prevent-list-open.constant';

@Injectable()
export class AISummaryFacadeService {
  constructor(
    private conversationState: ConversationState,
    private summaryContentState: SummaryContentState,
    private fileState: FileState,
    private widgetAiSummaryApi: AISummaryApiService,
    private conversationService: ConversationService,
    private fileService: FilesService,
    private agencySerivce: AgencyService,
    private userService: UserService,
    private toastService: ToastrService,
    private taskService: TaskService,
    private permissionService: PermissionService,
    private sharedService: SharedService,
    private inboxService: InboxService,
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    private stepService: StepService,
    private companyService: CompanyService,
    private chatGptService: ChatGptService
  ) {}

  public getSummary(
    receiveUserId: string,
    mailboxId: string,
    triggerFromClickAIbtn: boolean
  ): Observable<TaskSummary> {
    this.summaryContentState.setLoading(true);
    this.loadFiles().subscribe();
    const taskId$ = this.taskService.currentTaskId$.pipe(
      first((taskId) => Boolean(taskId))
    );
    const conversationId$ = this.conversationService.currentConversation.pipe(
      map((conversation) => conversation?.id),
      first(Boolean)
    );

    return forkJoin([taskId$, conversationId$]).pipe(
      tap(() => this.summaryContentState.setLoading(true)),
      concatMap(([taskId, resConversationId]) => {
        return this.widgetAiSummaryApi
          .getSummary(taskId, resConversationId)
          .pipe(
            switchMap((taskSummary) => {
              const { summaryContent, propertyDocumentIds } =
                taskSummary?.[0] || {};
              const isConsoleUser = this.sharedService.isConsoleUsers();
              const isAiEnabled =
                ChatGptService.enableSuggestReplySetting.getValue();

              if (
                isAiEnabled &&
                !isConsoleUser &&
                !summaryContent &&
                !propertyDocumentIds?.length &&
                triggerFromClickAIbtn
              ) {
                return this.generateSummary(
                  resConversationId,
                  receiveUserId,
                  null,
                  mailboxId
                ).pipe(map((response) => response?.body?.taskSummary));
              }
              return of(taskSummary);
            }),
            tap((taskSummary) => {
              this.handleTaskSummary(taskSummary, resConversationId);
            }),
            catchError(() => {
              this.summaryContentState.setNoData(true);
              return of(null);
            }),
            finalize(() => {
              this.summaryContentState.setLoading(false);
            })
          );
      })
    );
  }

  public handleTaskSummary(taskSummary, resConversationId): void {
    const {
      conversationId,
      summaryContent,
      propertyDocumentIds,
      propertyDocuments
    } = taskSummary?.[0] || taskSummary || {};
    this.summaryContentState.setContent(summaryContent);
    this.setSelectedFiles(propertyDocuments);
    this.setSelectedFilesByIds(propertyDocumentIds);
    const noDataSummary = this.hasNoData(
      conversationId,
      summaryContent,
      propertyDocumentIds
    );
    this.summaryContentState.setNoData(noDataSummary);
    this._setSelectedConversationById(
      conversationId || resConversationId
    ).subscribe();
    this._setFilesByConversation(conversationId).subscribe();
  }

  prefillTitleMsg() {
    return combineLatest([
      this.taskService.currentTask$,
      this.taskService.reloadTaskDetail
    ]).pipe(
      filter(([task, _]) => Boolean(task?.id)),
      map(([task, _]) => {
        return [task.title, task.property?.shortenStreetline]
          .filter(Boolean)
          .join(' - ');
      })
    );
  }

  public updateSummaryMedia(ids: string[]) {
    const taskId$ = this.taskService.currentTaskId$.pipe(first(Boolean));
    const conversationId$ = this.conversationState.selectedConversation$.pipe(
      map((conversation) => conversation?.id),
      first(Boolean)
    );
    return forkJoin([taskId$, conversationId$]).pipe(
      concatMap(([taskId, conversationId]) => {
        return this.widgetAiSummaryApi
          .updateSummaryMedia(taskId, conversationId, ids)
          .pipe(take(1));
      })
    );
  }

  public generateSummary(
    conversationId: string,
    receiveUserId: string,
    isSetSelectedConversation: boolean = false,
    currentMailboxId: string
  ) {
    let previousConversationId;
    this.summaryContentState.setLoading(true);
    this.summaryContentState.setGenerating(true);
    this.conversationService.currentConversationId.subscribe(
      (conversationId) => {
        previousConversationId = conversationId;
      }
    );

    if (isSetSelectedConversation) {
      this._setSelectedConversationById(conversationId).subscribe();
    }
    const userId = this.userService.userInfo$.getValue()?.id;

    this.loadFiles().subscribe(() => {
      this._setFilesByConversation(conversationId).subscribe();
    });

    return this.widgetAiSummaryApi
      .generateSummaryContent(
        conversationId,
        userId,
        receiveUserId,
        null,
        currentMailboxId
      )
      .pipe(
        tap((response) => {
          const summary = response.body.taskSummary;
          const noDataSummary = this.hasNoData(
            summary?.conversationId,
            summary?.summaryContent,
            summary?.propertyDocumentIds
          );
          this.summaryContentState.setNoData(noDataSummary);
          this.setSelectedFiles(summary?.propertyDocuments);
          this.setSummaryContent(summary?.summaryContent);

          const overPopups = [...preventOpenModalList];

          const hasOtherPopup = overPopups.some((o) => {
            const nodes: NodeListOf<HTMLElement> = document.querySelectorAll(o);
            let isDisplayed = false;
            nodes.forEach((nd) => {
              if (nd.style['display'] !== 'none') {
                isDisplayed = true;
              }
            });
            return isDisplayed;
          });

          const hasSameConversationId =
            conversationId === previousConversationId;
          if (!hasOtherPopup && hasSameConversationId) {
            this.setShowAITemplate(true);
          }
        }),
        catchError((_) => {
          this.toastService.error('Fail to summarize. Please try again');
          this.setShowAITemplate(false);
          this._rollBackSelectedConversation();
          return of(null);
        }),
        finalize(() => {
          this.summaryContentState.setLoading(false);
          this.summaryContentState.setGenerating(false);
        })
      );
  }

  private hasNoData(
    conversationId,
    summaryContent,
    propertyDocumentIds
  ): boolean {
    const validDocuments = propertyDocumentIds?.filter((p) => !!p);
    return !Boolean(
      conversationId && (summaryContent || validDocuments?.length)
    );
  }

  private _rollBackSelectedConversation() {
    this.conversationState.previouseConversations$
      .pipe(take(1))
      .subscribe((conversation) => {
        this.setSelectedConversation(conversation);
      });
  }

  //#region  load data
  public loadConversations(): Observable<Conversation[]> {
    return this.getCurrentTaskId()
      .pipe(filter(Boolean))
      .pipe(
        switchMap((taskId) => {
          return this.conversationService.listConversationByTask
            .asObservable()
            .pipe(
              map((conversations) =>
                conversations
                  ?.filter((conversation) => conversation?.taskId == taskId)
                  ?.map((conversation) => ({
                    id: conversation.id,
                    type: conversation.propertyType,
                    firstName: conversation.firstName,
                    lastName: conversation.lastName,
                    fullName: `${conversation.firstName || ''} ${
                      conversation.lastName || ''
                    }`.trim(),
                    startMessageBy: conversation.startMessageBy,
                    propertyType: conversation.propertyType,
                    contactType: conversation.contactType,
                    isPrimary: conversation.isPrimary,
                    receiveUserId: conversation.userId,
                    messageOwnerId: conversation.messageOwner,
                    categoryName: conversation.categoryName
                  }))
              ),
              tap((conversations) => {
                this.conversationState.setConversations(conversations);
              })
            );
        })
      );
  }

  public loadFiles(): Observable<PropertyDocument[]> {
    const attachments$ = this.fileService.getAttachmentFilesDocument().pipe(
      map((documents) => {
        if (!Array.isArray(documents)) return [];
        let files = [];
        for (const document of documents) {
          const conversaionFiles =
            document?.propertyDocuments?.map((element) => ({
              ...element,
              conversationId: document.conversationId
            })) || [];
          files = [...files, ...conversaionFiles];
        }
        return files;
      })
    );

    const callFiles$ = this.fileService.getCallFiles();

    const files$ = combineLatest([attachments$, callFiles$]).pipe(
      map(([attachments, files]) => {
        return [...(attachments || []), ...(files || [])];
      }),
      first((files) => Array.isArray(files) && files?.length > 0),
      map((files) =>
        files.filter((file) => {
          const allowed = ['photo', 'video'];
          const fileType = this.fileService.getFileTypeDot(file.name);
          file.mediaType = fileType;
          return allowed.includes(fileType);
        })
      ),
      tap((files) => {
        this.fileState.setSourceFiles(files);
      })
    );

    return files$;
  }
  //#endregion
  //#region conversation
  public getConversations(): Observable<any[]> {
    return this.conversationState.conversations$;
  }

  public setConversations(conversations): void {
    return this.conversationState.setConversations(conversations);
  }

  public getSelectedConverstion() {
    return this.conversationState.selectedConversation$;
  }

  public getCurrentConversation() {
    return this.conversationService.currentConversation.asObservable();
  }

  public setSelectedConversation(conversation: Conversation): void {
    this.conversationState.setSelectedConversation(conversation);
    this.setShowAITemplate(false);
    this._setFilesByConversation(conversation?.id).subscribe();
  }

  //#endregion
  //#region  file
  public getFiles(): Observable<any[]> {
    return this.fileState.conversationFiles$;
  }

  public setFiles(files): void {
    this.fileState.setSourceFiles(files);
  }

  public getSelectedFiles(): Observable<any[]> {
    return this.fileState.selectedFiles$.pipe(
      map((files) => {
        const selectedFiles =
          files
            ?.filter((file) => file.mediaLink || file.thumbMediaLink)
            ?.slice(0, 5)
            ?.map((file) => {
              return {
                ...file,
                mediaType: this.fileService.getFileTypeDot(file.name)
              };
            }) || [];
        if (selectedFiles.length == 5) return selectedFiles;
        return [...selectedFiles, {}];
      })
    );
  }

  public setSelectedFiles(files: any[]): void {
    this.fileState.setSelectedFiles(files);
  }

  public setSelectedFilesByIds(fileIds: string[]): void {
    if (!Array.isArray(fileIds) || !fileIds?.length) return;
    this.fileState.sourceFiles$
      .pipe(
        filter((files) => files?.length > 0),
        take(1)
      )
      .subscribe((files) => {
        const selectedFile = files.filter((file) => fileIds.includes(file.id));
        this.setSelectedFiles(selectedFile);
      });
  }

  public removeSelectedFile(fileId: string): void {
    this.fileState.removeSelectedFile(fileId);
  }
  //#endregion

  public getSummaryContent(): Observable<string> {
    return this.summaryContentState.content$;
  }

  public setSummaryContent(content: string): void {
    this.summaryContentState.setContent(content);
  }

  public setGenerating(value: boolean): void {
    this.summaryContentState.setGenerating(value);
  }

  public isGenerating(): Observable<boolean> {
    return this.summaryContentState.isGenerating$;
  }

  public isLoading(): Observable<boolean> {
    return this.summaryContentState.isLoading$;
  }

  public getAgencyPlan(): Observable<ConfigPlan> {
    return this.agencySerivce.currentPlan$;
  }

  public getCurrentTaskId(): Observable<string> {
    return this.taskService.currentTaskId$.pipe(distinctUntilChanged());
  }

  public getCurrentTask(): Observable<TaskItem> {
    return this.taskService.currentTask$.asObservable();
  }

  public canUseAI() {
    return ChatGptService.enableSuggestReplySetting.asObservable();
  }

  public getUpradeAction(): Observable<string> {
    return this.userService.userInfo$.pipe(
      map((user) => user?.type),
      first(Boolean),
      concatMap((type) => {
        const isUserRoleAdminConsole = [UserTypeEnum.ADMIN].includes(
          type as UserTypeEnum
        );
        if (
          this.permissionService.isAdministrator ||
          this.permissionService.isOwner ||
          isUserRoleAdminConsole
        ) {
          return of('upgrade');
        } else {
          return of('request');
        }
      })
    );
  }

  public isConsoleUser() {
    return this.userService.userInfo$.pipe(
      map((user) => user?.type),
      first(Boolean),
      concatMap(() => {
        return of(this.sharedService.isConsoleUsers());
      })
    );
  }

  public sendRequestUpgrade(): Observable<void> {
    let currentMailboxId: string;
    return this.inboxService.getCurrentMailBoxId().pipe(
      tap((res) => {
        currentMailboxId = res;
      }),
      concatMap(() =>
        this.conversationService
          .sendMailRequestFeature(EAddOn.AI_SUMMARY, currentMailboxId)
          .pipe(
            tap(() => {
              this.toastService.success(UPGRADE_REQUEST_SENT);
            })
          )
      )
    );
  }

  public noData(): Observable<boolean> {
    return this.summaryContentState.noData$;
  }

  public isShowAITemplate(): Observable<boolean> {
    return this.summaryContentState.isShow$;
  }

  public setShowAITemplate(show: boolean) {
    this.summaryContentState.setShow(show);
  }

  public resetData(): void {
    this.fileState.resetData();
    this.conversationState.resetData();
    this.summaryContentState.resetData();
  }

  public getAgencyName(): Observable<string> {
    return this.companyService
      .getCurrentCompany()
      .pipe(map((company) => company?.name));
  }

  public getPreviousConversation(): Observable<string> {
    return this.conversationState.previouseConversations$.pipe(
      map((conversation) => conversation?.id),
      first(Boolean)
    );
  }

  public updateDynamicFieldData() {
    return combineLatest([
      this.getSummaryContent().pipe(distinctUntilChanged()),
      this.getSelectedFiles()
    ]).pipe(
      map(([summaryContent, files]) => {
        const summary: ISummaryContent = {
          summaryNote: summaryContent,
          summaryPhotos: files?.filter((file) => Boolean(file?.id))
        };
        return summary;
      }),
      tap((summary) => {
        // this.stepService.setSummaryContent(summary);
      })
    );
  }

  public getMessage() {
    return this.conversationService.messages$;
  }

  public checkNoMessageOnConversation(
    conversationId: string
  ): Observable<boolean> {
    return this.conversationService.messages$.pipe(
      map((messsages) => {
        if (!messsages) return false;
        const conversationMessage = messsages.find(
          (m) => m.conversationId === conversationId
        );

        if (!conversationMessage?.isLoading && conversationMessage?.messages) {
          const hasMessageContent = conversationMessage.messages?.some((m) => {
            const hasTextContent = Boolean(
              m.textContent && m.messageType !== EMessageType.moveToTask
            );
            const hasFileContent =
              m.files.fileList?.length ||
              m.files.mediaList?.length ||
              m.files.unSupportedList?.length;

            return hasTextContent || hasFileContent;
          });

          return !hasMessageContent;
        }

        return false;
      })
    );
  }

  private _setSelectedFileByIds(filesIds: string[]) {
    if (!Array.isArray(filesIds)) return of(null);
    const conversationId$ = this.conversationState.selectedConversation$.pipe(
      map((conversation) => conversation?.id),
      first(Boolean)
    );
    const files$ = this.fileState.sourceFiles$.pipe(
      first((files) => files?.length > 0)
    );
    return forkJoin([conversationId$, files$]).pipe(
      tap(([conversationId, files]) => {
        const selectedFiles = files.filter(
          (file) =>
            filesIds?.includes(file.id) && file.conversationId == conversationId
        );
        this.fileState.setSelectedFiles(selectedFiles);
      })
    );
  }

  private _setSelectedConversationById(
    conversationId: string
  ): Observable<Conversation[]> {
    if (!conversationId) {
      this.conversationState.setSelectedConversation(null);
      return of(null);
    }
    return this.conversationState.conversations$.pipe(
      first((conversations) => conversations?.length > 0),
      tap((conversations) => {
        const selectedConversations = conversations.find(
          (conversation) => conversation.id == conversationId
        );
        this.conversationState.setSelectedConversation(selectedConversations);
      })
    );
  }

  private _setFilesByConversation(conversationId: string): Observable<any[]> {
    if (!conversationId) return of(null);
    return this.fileState.sourceFiles$.pipe(
      map((files) =>
        files?.filter((file) => file?.conversationId == conversationId)
      ),
      tap((files) => {
        this.fileState.setConversationFiles(files);
      })
    );
  }
}
