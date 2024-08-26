import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TreeNodeOptions } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';
import uuid4 from 'uuid4';

@Injectable()
export class DecisionTreeMockService {
  getData(): Observable<TreeNodeOptions[]> {
    return of([
      {
        title: 'Send basic email',
        key: uuid4(),
        type: 'STEP',
        stepType: 'COMMUNICATE',
        action: 'send_basic_email',
        reminderTimes: [],
        isRequired: false,
        status: 'PENDING',
        fields: {
          send_to: ['ALL_ACTIVE_LANDLORD'],
          msg_title: 'Subject: Basic {task_title} {short_property_address}',
          msg_body:
            'Hi {receiver first name},\n\nThank you for passing this request along.\n\nI will reach out to your landlord and respond with their decision when received.\n\nThank you,\n\n{Name}, {Role}\n{Agency}'
        },
        children: []
      },
      {
        type: 'SECTION',
        key: uuid4(),
        title: 'TENANT INTENTIONS',
        children: [
          {
            title: 'Send tenant entry notice',
            id: '2',
            type: 'STEP',
            key: uuid4(),
            stepType: 'COMMUNICATE',
            action: 'send_attachment',
            reminderTimes: [],
            isRequired: false,
            status: 'PENDING',
            fields: {
              pre_screen_attachment: {
                isRequired: true,
                title: 'Please attach: Rental appraisal - CMA(required)'
              },
              send_to: ['ALL_ACTIVE_TENANTS', 'ALL_PROSPECTIVE_TENANTS'],
              msg_title:
                'Subject: Send attachment {task_title} {short_property_address}',
              msg_body:
                'Hi {receiver first name},\n\nThank you for passing this request along.\n\nI will reach out to your landlord and respond with their decision when received.\n\nThank you,\n\n{Name}, {Role}\n{Agency}'
            },
            children: []
          },
          {
            title: 'Ask suppliers to quote',
            key: uuid4(),
            type: 'STEP',
            stepType: 'COMMUNICATE',
            action: 'send_basic_email',
            reminderTimes: [],
            isRequired: false,
            status: 'PENDING',
            fields: {
              send_to: ['ALL_ACTIVE_TENANTS', 'ALL_PROSPECTIVE_TENANTS'],
              msg_title: 'Subject: Maintenance - {task_title}',
              msg_body:
                'Hi {receiver first name},\n\nThank you for passing this request along.\n\nI will reach out to your landlord and respond with their decision when received.\n\nThank you,\n\n{Name}, {Role}\n{Agency}'
            },
            children: []
          }
        ]
      },
      {
        type: 'SECTION',
        key: uuid4(),
        title: 'LANDLORD INTENTIONS',
        children: [
          {
            title: 'Send tenant entry notice (optional)',
            key: uuid4(),
            type: 'STEP',
            stepType: 'COMMUNICATE',
            action: 'send_attachment',
            reminderTimes: [],
            isRequired: false,
            status: 'PENDING',
            fields: {
              pre_screen_attachment: {
                isRequired: false,
                title: 'Please attach: Rental appraisal - CMA(optional)'
              },
              send_to: [],
              msg_title:
                'Subject: Send attachment {task_title} {short_property_address}',
              msg_body:
                'Hi {receiver first name},\n\nThank you for passing this request along.\n\nI will reach out to your landlord and respond with their decision when received.\n\nThank you,\n\n{Name}, {Role}\n{Agency}'
            },
            children: []
          }
        ]
      },
      {
        title: 'Send Request',
        key: uuid4(),
        type: 'STEP',
        stepType: 'COMMUNICATE',
        action: 'send_request',
        reminderTimes: [],
        isRequired: false,
        status: 'PENDING',
        fields: {
          send_to: [],
          msg_title: 'Subject: Basic {task_title} {short_property_address}',
          msg_body:
            'Hi {receiver first name},\n\nThank you for passing this request along.\n\nI will reach out to your landlord and respond with their decision when received.\n\nThank you,\n\n{Name}, {Role}\n{Agency}'
        },
        children: []
      },
      {
        type: 'DECISION',
        title: 'Request approved',
        key: uuid4(),
        index: 0,
        children: [
          {
            type: 'SECTION',
            title: 'QUOTES',
            key: uuid4(),
            children: [
              {
                title: 'Send report to landlord',
                key: '6',
                type: 'STEP',
                stepType: 'COMMUNICATE',
                action: 'send_conversation_files',
                reminderTimes: [],
                isRequired: false,
                status: 'PENDING',
                fields: {
                  send_to: [],
                  pre_screen_select_files: {
                    isRequired: false,
                    title:
                      'Which PDF attachments would you like to send to the landlord?'
                  },
                  msg_title:
                    'Subject: Basic {task_title} {short_property_address}',
                  msg_body:
                    'Hi {receiver first name},\n\nThank you for passing this request along.\n\nI will reach out to your landlord and respond with their decision when received.\n\nThank you,\n\n{Name}, {Role}\n{Agency}'
                }
              },
              {
                title: 'Create maintenance job',
                key: '7',
                type: 'STEP',
                stepType: 'PROPERTY_TREE',
                action: 'pt_new_component',
                componentType: 'NOTE',
                reminderTimes: [],
                isRequired: false,
                status: 'PENDING',
                fields: {
                  send_to: [],
                  msg_title:
                    'Subject: Basic {task_title} {short_property_address}',
                  msg_body:
                    'Hi {receiver first name},\n\nThank you for passing this request along.\n\nI will reach out to your landlord and respond with their decision when received.\n\nThank you,\n\n{Name}, {Role}\n{Agency}'
                }
              }
            ]
          },
          {
            type: 'SECTION',
            title: 'WORK ORDER',
            key: uuid4(),
            children: [
              {
                title: 'Send contact to tenant with individual supplier',
                key: '8',
                type: 'STEP',
                stepType: 'COMMUNICATE',
                action: 'send_contact_card',
                reminderTimes: [],
                isRequired: false,
                status: 'PENDING',
                fields: {
                  select_contact_card: {
                    isRequired: true,
                    individual: [
                      '73fa7ade-ad81-4161-aff6-5049912341a6',
                      'bd151819-82ca-425b-a628-5548e92d06ad'
                    ],
                    contactType: []
                  },
                  send_to: [],
                  msg_title:
                    'Subject: Send attachment {task_title} {short_property_address}',
                  msg_body:
                    'Hi {receiver first name},\n\nThank you for passing this request along.\n\nI will reach out to your landlord and respond with their decision when received.\n\nThank you,\n\n{Name}, {Role}\n{Agency}'
                }
              },
              {
                title: 'Send contact to tenant with contact type',
                key: '9',
                type: 'STEP',
                stepType: 'COMMUNICATE',
                action: 'send_contact_card',
                reminderTimes: [],
                isRequired: false,
                status: 'PENDING',
                fields: {
                  select_contact_card: {
                    isRequired: true,
                    individual: [],
                    contactType: [
                      'ALL_ACTIVE_LANDLORD',
                      'ALL_ACTIVE_TENANTS',
                      'ALL_PROSPECTIVE_TENANTS'
                    ]
                  },
                  send_to: [],
                  msg_title:
                    'Subject: Send contact card {task_title} {short_property_address}',
                  msg_body:
                    'Hi {receiver first name},\n\nThank you for passing this request along.\n\nI will reach out to your landlord and respond with their decision when received.\n\nThank you,\n\n{Name}, {Role}\n{Agency}'
                }
              },
              {
                title: 'Complete maintenance job',
                key: '10',
                type: 'STEP',
                stepType: 'PROPERTY_TREE',
                action: 'pt_update_component',
                componentType: 'NOTE',
                reminderTimes: [],
                isRequired: false,
                status: 'PENDING',
                fields: {
                  send_to: [],
                  msg_title: 'Subject: Maintenance - {task_title}',
                  msg_body:
                    'Hi {receiver first name},\n\nThank you for passing this request along.\n\nI will reach out to your landlord and respond with their decision when received.\n\nThank you,\n\n{Name}, {Role}\n{Agency}'
                }
              }
            ]
          },
          {
            type: 'SECTION',
            title: 'COMPLETED',
            key: uuid4(),
            children: [
              {
                title: 'Notify tenant of ingoing inspection',
                key: '11',
                type: 'STEP',
                stepType: 'COMMUNICATE',
                action: 'send_calendar_event',
                reminderTimes: [],
                isRequired: false,
                status: 'PENDING',
                fields: {
                  send_to: [],
                  event_type: {
                    isRequired: true,
                    value: 'COMPLIANCE_NEXT_SERVICE'
                  },
                  msg_title: 'Subject: Maintenance - {task_title}',
                  msg_body:
                    'Hi {receiver first name},\n\nThank you for passing this request along.\n\nI will reach out to your landlord and respond with their decision when received.\n\nThank you,\n\n{Name}, {Role}\n{Agency}'
                }
              }
            ]
          }
        ]
      },
      {
        type: 'DECISION',
        title: 'Request denied',
        key: uuid4(),
        index: 1,
        children: [
          {
            type: 'SECTION',
            title: 'COMPLETED',
            key: uuid4(),
            children: [
              {
                title: 'Send reminder notice',
                id: '12',
                key: uuid4(),
                type: 'STEP',
                stepType: 'schedule_reminder',
                action: 'schedule_reminder',
                reminderTimes: [],
                isRequired: false,
                status: 'PENDING',
                fields: {
                  send_to: [],
                  suggested_reminder: {
                    reminder_time: '2023-08-11T06:05:00.000Z',
                    day: 3,
                    operator: 'BEFORE',
                    event_type: {
                      value: 'COMPLIANCE_NEXT_SERVICE'
                    }
                  },
                  msg_title: 'Subject: Maintenance - {task_title}',
                  msg_body:
                    'Hi {receiver first name},\n\nThank you for passing this request along.\n\nI will reach out to your landlord and respond with their decision when received.\n\nThank you,\n\n{Name}, {Role}\n{Agency}'
                }
              }
            ]
          }
        ]
      }
    ] as any[]);
  }
}
