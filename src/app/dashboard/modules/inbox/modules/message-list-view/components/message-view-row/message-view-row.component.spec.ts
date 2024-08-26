import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageViewRowComponent } from './message-view-row.component';
import { RouterTestingModule } from '@angular/router/testing';
import { FormBuilder } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  NzContextMenuService,
  NzDropDownModule,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import { OverlayComponentModule } from '@/app/overlay/overlay.module';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { MockComponent } from 'ng-mocks';
import { TrudiIconComponent } from '@trudi-ui';
import {
  EConfirmContactType,
  EPropertyStatus,
  TaskNameId,
  TaskStatusType,
  TaskType,
  TrudiButtonEnumStatus
} from '@shared/enum';
import { TaskItem } from '@shared/types/task.interface';
import { NodeType } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/node-type.enum';
import { TrudiDateTimePipe } from '@shared/pipes/trudi-date-time-pipe';
import 'jest-extended';
import { E2eAttributeDirective } from '@shared/directives/e2eAttribute.directive';
import { EMessageMenuOption } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { ToastrModule } from 'ngx-toastr';

describe('MessageViewRowComponent', () => {
  let component: MessageViewRowComponent;
  let fixture: ComponentFixture<MessageViewRowComponent>;
  const messageTestData: TaskItem = {
    id: '1',
    note: 'This is a task note',
    status: TaskStatusType.inprogress,
    indexTitle: 'Task Index Title',
    title: 'Task Title',
    assignToAgent: {
      id: 'agent1',
      firstName: 'John',
      lastName: 'Doe',
      googleAvatar: 'https://example.com/avatar.jpg',
      fullName: 'John Doe'
    },
    assignToAgents: [
      {
        id: 'agent1',
        firstName: 'John',
        lastName: 'Doe',
        googleAvatar: 'https://example.com/avatar.jpg',
        fullName: 'John Doe'
      },
      {
        id: 'agent2',
        firstName: 'Jane',
        lastName: 'Doe',
        googleAvatar: 'https://example.com/avatar.jpg',
        fullName: 'Jane Doe'
      }
    ],
    createdAt: '2024-04-23T12:00:00Z',
    updatedAt: '2024-04-23T13:00:00Z',
    topicId: 'topic1',
    property: {
      id: 'property1',
      streetline: '123 Main Street',
      unitNo: 'Apt 101',
      address: '123 Main Street, Apt 101',
      region: {
        id: 'region1',
        name: 'Region Name'
      },
      status: 'Active',
      keyNumber: 'key123',
      keyDescription: 'Key Description',
      nextInspectionDate: '2024-05-01',
      nextInspectionEndTime: '10:00 AM',
      nextInspectionStartTime: '09:00 AM',
      expenditureLimit: '$1000',
      agencyId: 'agency1',
      propertyName: 'Property Name',
      propertyType: 'Residential',
      isTemporary: false,
      suburb: '',
      postCode: '',
      userId: '',
      currentPropertyAgreementId: '',
      country: '',
      deleted: false,
      archived: false,
      streetNumber: '',
      managementType: '',
      state: '',
      regionId: '',
      authorityStartDate: '',
      authorityEndDate: '',
      nextInspection: '',
      managerName: ''
    },
    isRead: false,
    isDraft: false,
    isSeen: false,
    isDeleting: false,
    isOpened: true,
    isSuperHappyPath: false,
    isUnHappyPath: false,
    isUnindentifiedEmail: false,
    isUnindentifiedProperty: false,
    unhappyStatus: {
      isAssignNewTask: false,
      isConfirmProperty: false,
      confirmContactType: EConfirmContactType.LANDLORD,
      isConfirmContactUser: false
    },
    userPropertyType: 'Property Type',
    conversations: [],
    taskType: TaskType.TASK,
    taskFolderId: 'folder1',
    taskGroupId: 'group1',
    titleStatus: {
      currentDecision: 'decision1',
      currentSubNav: 'Sub Nav',
      isFirstSubNav: true,
      nextSubNav: 'Next Sub Nav',
      numberOfRemainingSubNav: 2
    },
    propertyManager: {
      id: 'manager1',
      firstName: 'Property',
      lastName: 'Manager',
      type: '',
      user: undefined,
      status: '',
      propertyId: '',
      googleAvatar: ''
    },
    taskNameRegion: {
      id: 'taskNameRegion1',
      regionId: 'region1',
      regionName: 'Region Name',
      taskNameRegionId: 'taskNameRegion1'
    },
    taskName: {
      conversationCategoryName: 'Category Name',
      conversationCategoryId: 'categoryId',
      isEnable: true,
      taskNameRegions: [],
      taskNameRegion: {
        id: 'taskNameRegion1',
        regionId: 'region1',
        regionName: 'Region Name',
        taskNameRegionId: 'taskNameRegion1'
      }
    },
    groupType: 'Group Type',
    isSelected: true,
    disabled: false,
    taskNameId: TaskNameId.taskTemplate,
    propertyStatus: EPropertyStatus.active,
    propertyType: 'Residential',
    mailBoxId: 'mailbox1',
    idUserPropertyGroup: 'userPropertyGroup1',
    isExistScheduledMessage: true,
    isExistInternalNote: false,
    unreadConversations: ['conversation1', 'conversation2'],
    calendarEvents: [
      {
        id: 'event1'
      }
    ],
    workflow: {
      steps: [
        {
          id: 'step1',
          name: 'Step 1',
          type: NodeType.DECISION,
          status: TrudiButtonEnumStatus.COMPLETED,
          buttons: []
        }
      ],
      decision: {
        id: 'decision1',
        name: 'Decision 1',
        steps: []
      }
    },
    isAutoReopen: false,
    msgIndex: 1,
    propertyId: 'property1',
    streetline: '123 Main Street',
    contentMessage: 'Message content',
    startMessageBy: 'John Doe',
    threadId: ['thread1', 'thread2'],
    textContent: 'Text content',
    taskId: 'task1',
    agencyId: 'agency1',
    companyId: 'company1',
    taskGroupName: 'Group Name',
    conversationId: 'conversation1',
    isSelectedByCheckBox: true,
    taskSyncs: [],
    isDisallowReassignProperty: false
  };

  beforeEach(() => {
    // Mock ResizeObserver
    const mockResizeObserver = jest.fn();
    mockResizeObserver.prototype.observe = jest.fn();
    mockResizeObserver.prototype.disconnect = jest.fn();
    (window as any).ResizeObserver = mockResizeObserver;
  });

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule,
        OverlayComponentModule,
        E2eAttributeDirective,
        NzDropDownModule,
        ToastrModule.forRoot()
      ],
      declarations: [
        MessageViewRowComponent,
        NzDropdownMenuComponent,
        MockComponent(TrudiIconComponent),
        TrudiDateTimePipe
      ],
      providers: [
        FormBuilder,
        NzContextMenuService,
        ContactTitleByConversationPropertyPipe
      ]
    });

    await TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageViewRowComponent);
    component = fixture.componentInstance;

    component.message = messageTestData;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set message correctly', () => {
    component.message = messageTestData;
    fixture.detectChanges();

    expect(component.message).toEqual(messageTestData);
  });

  it('should correctly check menu condition', () => {
    component.isReadMsg = true;
    component.message.status = TaskStatusType.deleted;
    // Call the method to be tested
    component.checkMenuCondition();
    expect(component.menuDropDown.resolve).toBeFalsy();
    expect(component.menuDropDown.unread).toBeTruthy();
  });

  it('should handle menu option correctly', () => {
    const option = EMessageMenuOption.CREATE_NEW_TASK;
    const event = new MouseEvent('click');
    spyOn(component.menuChange, 'emit');

    component.handleMenu(option, false, event);

    expect(component.menuChange.emit).toHaveBeenCalledWith({
      message: component.message,
      option: option
    });
  });

  afterEach(() => {
    delete (window as any).ResizeObserver;
  });
});
