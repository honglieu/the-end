export const taskFolderRouteMockData: any = {
  name: 'TASKS',
  type: 'TASKS',
  isOpen: true,
  icon: 'iconPlus2',
  taskStatus: 'INPROGRESS',
  children: [
    {
      id: '3b4104dd-d42c-401a-a217-dce7115ce3af',
      name: 'AT test',
      order: 1,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiFiSrMicrophoneAlt',
      labelId: 'bf5bbefc-94fa-4ead-8d7b-666901ecb432',
      taskGroups: [
        {
          id: 'fd873ae4-53c1-40ba-af3e-f4e5c35e38ae',
          taskFolderId: '3b4104dd-d42c-401a-a217-dce7115ce3af',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: false,
          isCompletedGroup: false
        },
        {
          id: '0a6f560c-5ab8-435a-a0e2-1c2cafaf9f21',
          taskFolderId: '3b4104dd-d42c-401a-a217-dce7115ce3af',
          name: 'NEW GROUP 1',
          color: '#74737E',
          order: 3,
          isDefault: false,
          isCompletedGroup: false
        },
        {
          id: 'd37f89ba-7580-43cb-ae44-a62b5b641a15',
          taskFolderId: '3b4104dd-d42c-401a-a217-dce7115ce3af',
          name: 'completed group',
          color: '#74737E',
          order: 4,
          isDefault: false,
          isCompletedGroup: false
        },
        {
          id: 'b4594445-023f-4cf0-b589-93b483443ea2',
          taskFolderId: '3b4104dd-d42c-401a-a217-dce7115ce3af',
          name: 'COMPLETED 1',
          color: '#F03838',
          order: 2,
          isDefault: true,
          isCompletedGroup: true
        }
      ],
      label: {
        id: 'bf5bbefc-94fa-4ead-8d7b-666901ecb432',
        name: 'Folder 1',
        externalId: 'Label_3'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: '3b4104dd-d42c-401a-a217-dce7115ce3af',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 2,
      taskCount: 5,
      unreadInternalNoteCount: 0
    },
    {
      id: 'bec343e1-dd0a-4c50-ba5e-cbd20a72f14d',
      name: 'Agg',
      order: 2,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiStar',
      labelId: 'bf5bbefc-94fa-4ead-8d7b-666901ecb432',
      taskGroups: [
        {
          id: '7e20e827-53a1-45ba-9fee-f4972a452cd2',
          taskFolderId: 'bec343e1-dd0a-4c50-ba5e-cbd20a72f14d',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: '262a29d8-f009-414a-9b90-5542ad08731f',
          taskFolderId: 'bec343e1-dd0a-4c50-ba5e-cbd20a72f14d',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: 'bf5bbefc-94fa-4ead-8d7b-666901ecb432',
        name: 'Folder 1',
        externalId: 'Label_3'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: 'bec343e1-dd0a-4c50-ba5e-cbd20a72f14d',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 0,
      unreadInternalNoteCount: 0
    },
    {
      id: 'edcdf60f-a43f-4fd5-ab78-9f1dd9b173d7',
      name: 'Ggjj',
      order: 3,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiBox',
      labelId: '0d8dbe20-cfca-4793-8949-db4520c6683d',
      taskGroups: [
        {
          id: '8bb30b19-a38a-4f9d-a475-1909797d7fc4',
          taskFolderId: 'edcdf60f-a43f-4fd5-ab78-9f1dd9b173d7',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: '8d09ee01-c6fc-4429-920d-08860eda0b6f',
          taskFolderId: 'edcdf60f-a43f-4fd5-ab78-9f1dd9b173d7',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: '0d8dbe20-cfca-4793-8949-db4520c6683d',
        name: 'CATEGORY_UPDATES',
        externalId: 'CATEGORY_UPDATES'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: 'edcdf60f-a43f-4fd5-ab78-9f1dd9b173d7',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 1,
      unreadInternalNoteCount: 0
    },
    {
      id: '0b3b8b60-e402-44a7-aa1f-09108856e19f',
      name: 'An test',
      order: 4,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiStar',
      labelId: 'dfcb2206-9c58-4294-bc93-3c32fddea972',
      taskGroups: [
        {
          id: 'faaaeb19-1f16-4c40-af2b-37bc851af466',
          taskFolderId: '0b3b8b60-e402-44a7-aa1f-09108856e19f',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: '0d146b74-79ff-4cd0-8148-63acb5eeb759',
          taskFolderId: '0b3b8b60-e402-44a7-aa1f-09108856e19f',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: 'dfcb2206-9c58-4294-bc93-3c32fddea972',
        name: 'Folder2-2',
        externalId: 'Label_15'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: '0b3b8b60-e402-44a7-aa1f-09108856e19f',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 2,
      unreadInternalNoteCount: 0
    },
    {
      id: '0ca836b0-79ed-42b4-940a-aecda289e9d7',
      name: 'name2',
      order: 5,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiClock',
      labelId: null,
      taskGroups: [
        {
          id: 'afb6c8e1-c79e-403b-b615-9aaed363cfa4',
          taskFolderId: '0ca836b0-79ed-42b4-940a-aecda289e9d7',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: 'f9cdbf33-1bdf-4cfd-aa36-f1c07a029691',
          taskFolderId: '0ca836b0-79ed-42b4-940a-aecda289e9d7',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: null,
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: '0ca836b0-79ed-42b4-940a-aecda289e9d7',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 0,
      unreadInternalNoteCount: 0
    },
    {
      id: '8aeb0f24-3040-4c92-8b4f-7a8a68c32e6b',
      name: 'an test trjjjfg rifgiie re  ueruue ieriiiiir    r r r r  fil',
      order: 6,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiStar',
      labelId: '33cf449e-bfca-4b08-853e-0bed1aae363e',
      taskGroups: [
        {
          id: '30c7281e-f615-4424-8aa8-a3da9dc8ddc9',
          taskFolderId: '8aeb0f24-3040-4c92-8b4f-7a8a68c32e6b',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: 'e8666ba1-581d-42f6-accb-a9eac4ea052e',
          taskFolderId: '8aeb0f24-3040-4c92-8b4f-7a8a68c32e6b',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: '33cf449e-bfca-4b08-853e-0bed1aae363e',
        name: 'CATEGORY_FORUMS',
        externalId: 'CATEGORY_FORUMS'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: '8aeb0f24-3040-4c92-8b4f-7a8a68c32e6b',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 0,
      unreadInternalNoteCount: 0
    },
    {
      id: '0fb5690b-6b87-49b3-996b-0be6361ae30f',
      name: 'chap6',
      order: 7,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiCircle',
      labelId: '0d8dbe20-cfca-4793-8949-db4520c6683d',
      taskGroups: [
        {
          id: '0c4e66cf-ebeb-49e1-846e-f9d95460d743',
          taskFolderId: '0fb5690b-6b87-49b3-996b-0be6361ae30f',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: 'f903cf97-8f30-4870-8906-c6aebfd22a7f',
          taskFolderId: '0fb5690b-6b87-49b3-996b-0be6361ae30f',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: '0d8dbe20-cfca-4793-8949-db4520c6683d',
        name: 'CATEGORY_UPDATES',
        externalId: 'CATEGORY_UPDATES'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: '0fb5690b-6b87-49b3-996b-0be6361ae30f',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 0,
      unreadInternalNoteCount: 0
    },
    {
      id: 'd87ec251-3056-4263-9262-558d89a9ffa6',
      name: 'Contact4:15',
      order: 8,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiGift',
      labelId: '6e3ba812-5431-4658-9747-5a70b32c25d4',
      taskGroups: [
        {
          id: '0877e3ed-5896-407d-9a27-64f8426cee08',
          taskFolderId: 'd87ec251-3056-4263-9262-558d89a9ffa6',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: '35bab4ef-2b0d-46b2-b5c2-c8e1b66ef414',
          taskFolderId: 'd87ec251-3056-4263-9262-558d89a9ffa6',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: '6e3ba812-5431-4658-9747-5a70b32c25d4',
        name: 'Folder2-1',
        externalId: 'Label_4'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: 'd87ec251-3056-4263-9262-558d89a9ffa6',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 0,
      unreadInternalNoteCount: 0
    },
    {
      id: 'adb2b5d8-cf58-4d91-9f46-3b661e2eb92c',
      name: 'ni hao ma',
      order: 9,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiChartNetwork',
      labelId: '8bd8d05f-547f-42ab-b755-66e443744224',
      taskGroups: [
        {
          id: 'b18cd1f5-afc3-4c34-9386-d86c4f30f734',
          taskFolderId: 'adb2b5d8-cf58-4d91-9f46-3b661e2eb92c',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: 'cb323eac-bb39-4fe9-a215-ed546a869dc9',
          taskFolderId: 'adb2b5d8-cf58-4d91-9f46-3b661e2eb92c',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: '8bd8d05f-547f-42ab-b755-66e443744224',
        name: 'CATEGORY_PROMOTIONS',
        externalId: 'CATEGORY_PROMOTIONS'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: 'adb2b5d8-cf58-4d91-9f46-3b661e2eb92c',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 1,
      taskCount: 8,
      unreadInternalNoteCount: 0
    },
    {
      id: '5ba3636e-78be-4f02-bffc-288771334790',
      name: 'Ffo',
      order: 10,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiBoxAlt',
      labelId: 'bf5bbefc-94fa-4ead-8d7b-666901ecb432',
      taskGroups: [
        {
          id: 'b65fd031-7e14-44e3-bafc-692c08db165b',
          taskFolderId: '5ba3636e-78be-4f02-bffc-288771334790',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: '9681cf70-d251-4a91-88bb-db9263cfaf07',
          taskFolderId: '5ba3636e-78be-4f02-bffc-288771334790',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: 'bf5bbefc-94fa-4ead-8d7b-666901ecb432',
        name: 'Folder 1',
        externalId: 'Label_3'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: '5ba3636e-78be-4f02-bffc-288771334790',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 1,
      unreadInternalNoteCount: 0
    },
    {
      id: 'd605351c-2810-402b-beed-b1b57ce41fe3',
      name: 'eee',
      order: 11,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiStar',
      labelId: '3583e024-3d6b-4926-a85a-5bdfee40dee4',
      taskGroups: [
        {
          id: '29a6612e-b610-44a1-b203-f9277ba658df',
          taskFolderId: 'd605351c-2810-402b-beed-b1b57ce41fe3',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: false,
          isCompletedGroup: false
        },
        {
          id: '8de9450e-03b1-40e2-a9ab-1a7f5288de40',
          taskFolderId: 'd605351c-2810-402b-beed-b1b57ce41fe3',
          name: 'NEW GROUPuuiu65',
          color: '#74737E',
          order: 3,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: '4963d5b8-d8de-454e-8720-6c56169532c8',
          taskFolderId: 'd605351c-2810-402b-beed-b1b57ce41fe3',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: '3583e024-3d6b-4926-a85a-5bdfee40dee4',
        name: 'CHAT',
        externalId: 'CHAT'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: 'd605351c-2810-402b-beed-b1b57ce41fe3',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 0,
      unreadInternalNoteCount: 0
    },
    {
      id: '4888e3ee-15bc-4f8f-bb45-b825a0592eaf',
      name: 'Happy',
      order: 12,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiButterfly',
      labelId: '8bd8d05f-547f-42ab-b755-66e443744224',
      taskGroups: [
        {
          id: 'efb80814-3bbe-4181-bdb4-5c469d43c960',
          taskFolderId: '4888e3ee-15bc-4f8f-bb45-b825a0592eaf',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: '78140b4f-448b-4153-91f6-01f58a492c65',
          taskFolderId: '4888e3ee-15bc-4f8f-bb45-b825a0592eaf',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: '8bd8d05f-547f-42ab-b755-66e443744224',
        name: 'CATEGORY_PROMOTIONS',
        externalId: 'CATEGORY_PROMOTIONS'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: '4888e3ee-15bc-4f8f-bb45-b825a0592eaf',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 0,
      unreadInternalNoteCount: 0
    },
    {
      id: 'a3ceda2e-28e2-4d31-afd0-9b09dc73c2a1',
      name: 'Dhh',
      order: 13,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiCar',
      labelId: '076c01f0-13ba-447c-935b-7699c67fd5a2',
      taskGroups: [
        {
          id: '02f2c170-0260-426e-8594-fba1c8b09232',
          taskFolderId: 'a3ceda2e-28e2-4d31-afd0-9b09dc73c2a1',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: 'e7c019ec-ad03-4917-ba53-ebf25b1c623c',
          taskFolderId: 'a3ceda2e-28e2-4d31-afd0-9b09dc73c2a1',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: '076c01f0-13ba-447c-935b-7699c67fd5a2',
        name: 'Folder1-4',
        externalId: 'Label_9'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: 'a3ceda2e-28e2-4d31-afd0-9b09dc73c2a1',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 0,
      unreadInternalNoteCount: 0
    },
    {
      id: '2359d7fa-ff83-4b56-b84a-4b398d196a77',
      name: 'No newbee1166',
      order: 15,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiCheckbox',
      labelId: '33cf449e-bfca-4b08-853e-0bed1aae363e',
      taskGroups: [
        {
          id: '6e0953b0-9688-4ac2-955d-ceeab1f2ec6a',
          taskFolderId: '2359d7fa-ff83-4b56-b84a-4b398d196a77',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: '511451c7-0c5a-4cb8-8f4a-82798e7b1f02',
          taskFolderId: '2359d7fa-ff83-4b56-b84a-4b398d196a77',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: '33cf449e-bfca-4b08-853e-0bed1aae363e',
        name: 'CATEGORY_FORUMS',
        externalId: 'CATEGORY_FORUMS'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: '2359d7fa-ff83-4b56-b84a-4b398d196a77',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 0,
      unreadInternalNoteCount: 0
    },
    {
      id: '13cfaac5-8510-4a9a-95db-2178827c552c',
      name: 'Chap 5',
      order: 17,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiBalloons',
      labelId: '076c01f0-13ba-447c-935b-7699c67fd5a2',
      taskGroups: [
        {
          id: '6ce5a768-33fc-40e3-a880-19db2f6e0c1c',
          taskFolderId: '13cfaac5-8510-4a9a-95db-2178827c552c',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: 'eab9ccec-015f-4ecf-97e0-ccf546828819',
          taskFolderId: '13cfaac5-8510-4a9a-95db-2178827c552c',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: '076c01f0-13ba-447c-935b-7699c67fd5a2',
        name: 'Folder1-4',
        externalId: 'Label_9'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: '13cfaac5-8510-4a9a-95db-2178827c552c',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 0,
      unreadInternalNoteCount: 0
    },
    {
      id: '6f6c2d24-c5cf-4a58-9034-db3c89150274',
      name: 'Yuki',
      order: 18,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiBackpack',
      labelId: '3ce6cdef-21ce-4334-ac5d-772c693dab9c',
      taskGroups: [
        {
          id: 'ef45a695-8dc8-48b3-acda-ee4369785149',
          taskFolderId: '6f6c2d24-c5cf-4a58-9034-db3c89150274',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: '33d26ae6-dfb4-4341-880b-e8f5469488fc',
          taskFolderId: '6f6c2d24-c5cf-4a58-9034-db3c89150274',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: '3ce6cdef-21ce-4334-ac5d-772c693dab9c',
        name: 'Folder1-3',
        externalId: 'Label_6'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: '6f6c2d24-c5cf-4a58-9034-db3c89150274',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 0,
      unreadInternalNoteCount: 0
    },
    {
      id: '7cd73e5a-d1ed-4189-b6ec-e0f5a772b5e4',
      name: 'An test 001',
      order: 19,
      agencyId: '59287cee-cfff-4109-897d-6e470af86798',
      mailBoxId: '76f2c88a-c8a9-4826-be18-fc8e5f0b40e0',
      icon: 'TrudiCar',
      labelId: '0d8dbe20-cfca-4793-8949-db4520c6683d',
      taskGroups: [
        {
          id: 'fcdcb757-e43f-4df0-a298-ad37da4a2709',
          taskFolderId: '7cd73e5a-d1ed-4189-b6ec-e0f5a772b5e4',
          name: 'TO DO',
          color: '#FF7F37',
          order: 1,
          isDefault: true,
          isCompletedGroup: false
        },
        {
          id: 'a5aa87d7-4186-402b-9e39-d830fea8fc9f',
          taskFolderId: '7cd73e5a-d1ed-4189-b6ec-e0f5a772b5e4',
          name: 'COMPLETED',
          color: '#999999',
          order: 2,
          isDefault: false,
          isCompletedGroup: true
        }
      ],
      label: {
        id: '0d8dbe20-cfca-4793-8949-db4520c6683d',
        name: 'CATEGORY_UPDATES',
        externalId: 'CATEGORY_UPDATES'
      },
      canEditFolder: true,
      routerLink: 'tasks',
      queryParams: {
        taskTypeID: '7cd73e5a-d1ed-4189-b6ec-e0f5a772b5e4',
        aiAssistantType: null,
        taskId: null,
        conversationId: null,
        threadId: null,
        sortTaskType: 'OLDEST_TO_NEWEST'
      },
      unReadTaskCount: 0,
      taskCount: 0,
      unreadInternalNoteCount: 0
    }
  ],
  folderType: 'TASKS'
};
