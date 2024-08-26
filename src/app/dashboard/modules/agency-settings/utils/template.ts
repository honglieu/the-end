export enum ActionSectionPolicies {
  BuildingAndContentsInsuranceClaims = 'Building and contents insurance claims',
  LandlordInsuranceClaims = 'Owner insurance claims',
  LandlordInsuranceProviders = 'Owner insurance providers',
  ContentsInsurance = 'Contents insurance',
  NonUrgentEnquiries = 'Non-urgent enquiries',
  UrgentEnquiries = 'Urgent enquiries',
  SmokeAlarmServicing = 'Smoke alarm servicing',
  FaultySmokeAlarms = 'Faulty smoke alarms',
  PoolSpaSafety = 'Pool/Spas safety',
  TemporaryPoolSpaCompliance = 'Temporary pool/spas compliance',
  PestControl = 'Pest control',
  PropertyViewings = 'Property viewings',
  ApplicationProcess = 'Application process',
  ApplicationForm = 'Application form (optional)',
  VacateInstructions = 'Vacate instructions',
  ArrearsPolicyDocument = 'Arrears policy document (optional)',
  VacateChecklist = 'Vacate checklist (optional)',
  BreakIns = 'Break ins',
  LostOrStolenKeys = 'Lost or stolen keys',
  PetRequests = 'Pet requests',
  ChangesToApprovedOccupants = 'Changes to approved occupants',
  ChangesToPropertyHooksNails = 'Changes to property - installing hooks and nails',
  ChangesToPropertyApplianceFixture = 'Changes to property - appliance / fixture replacement',
  RoutineInspectionPolicy = 'Routine inspection policy including standard agency timeframes',
  NewBussinessEnquiry = 'New business enquiry (optional)',
  AgencyManagementAgreement = 'Agency management agreement (optional)'
}

export const TemplateOptionsData = {
  Insurance: {
    [ActionSectionPolicies.BuildingAndContentsInsuranceClaims]: {
      subTitle:
        'What is your policy for assisting with building and contents insurance claims?',
      options: [
        {
          id: '5b33ce2b-15d9-4dfc-9080-fd390712cdc5',
          text: 'We require details of the insurance claim to determine if this is something we can assist with'
        },
        {
          id: 'ce37925e-63e9-4172-8b32-db0fe76da7b1',
          text: 'We can assist with managing trades but the property owner must lodge the initial insurance claim and liaise with the insurance company'
        },
        {
          id: '9c749b9b-317e-445f-8ebf-317cc08601e1',
          text: 'We charge a fee of ${fee} for this service',
          config: {
            fee: {
              type: 'input-number',
              css: { width: '160px', display: 'inline-block' },
              defaultValue: 55
            }
          }
        },
        {
          id: 'eac8dfc1-7b76-48e5-b41b-f4a67b521e8a',
          text: 'We unfortunately are unable to assist with these types of claims'
        }
      ]
    },
    [ActionSectionPolicies.LandlordInsuranceClaims]: {
      subTitle:
        'What is your policy for assisting with owner insurance Claims?',
      options: [
        {
          id: '2aa7d792-4bfc-4cf4-b650-fbb435254fb9',
          text: 'We require details of the insurance claim to determine if this is something we can assist with'
        },
        {
          id: '61e236e6-4b68-4b50-9e9c-e01804502407',
          text: 'We can assist with managing trades but the property owner must lodge the initial insurance claim and liaise with the insurance company'
        },
        {
          id: 'dbee2063-ce6d-46c3-90c0-63736c586ed8',
          text: 'We charge a fee of ${feeSecond} for this service',
          config: {
            feeSecond: {
              type: 'input-number',
              css: { width: '160px', display: 'inline-block' },
              defaultValue: 55
            }
          }
        },
        {
          id: '0adb12c5-571f-47ac-931e-ecb7efb50683',
          text: 'We unfortunately are unable to assist with these types of claims'
        }
      ]
    },
    [ActionSectionPolicies.ContentsInsurance]: {
      subTitle: 'Your policy for tenant contents Insurance?',
      options: [
        {
          id: 'bfb5eb43-37cc-4443-a276-cde98d99e504',
          text: 'We recommend that Tenants obtain contents insurance for their belongings'
        },
        {
          id: '811d5be1-578d-4732-aefc-137c4e07cfbb',
          text: 'Tenants must arrange and purchase their own contents insurance'
        },
        {
          id: '87236d52-1509-4e19-8142-f55e6132945f',
          text: 'Tenants are responsible for their own claims and valuations'
        }
      ]
    }
  },
  Compliance: {
    [ActionSectionPolicies.SmokeAlarmServicing]: {
      subTitle: 'Summarize your smoke alarm compliance procedure',
      options: [
        {
          id: 'e7a83986-bbdb-4a3e-a85e-f30726721c5b',
          text: 'Smoke Alarms are maintained in compliance with state specific legislation'
        },
        {
          id: 'b601a304-7cda-4624-9828-0c611cf4d9b5',
          text: 'Smoke Alarms are maintained every ${maintain} months',
          config: {
            maintain: {
              type: 'input-selected',
              css: { width: '100px', display: 'inline-block', heigth: '32px' },
              defaultValue: 6
            }
          }
        },
        {
          id: 'de9b63db-5771-4e99-82b5-b8c5deaff0b2',
          text: 'Smoke Alarms are checked when a new tenant moves into a property'
        },
        {
          id: 'baa61c42-08d6-4f89-b4db-25d49c48efe2',
          text: 'Smoke Alarms are checked when a current tenant renews their lease agreement'
        }
      ]
    },
    [ActionSectionPolicies.FaultySmokeAlarms]: {
      subTitle: 'Your procedure in the case of a malfunctioning smoke alarm',
      options: [
        {
          id: 'ea0c89aa-b62d-444b-890a-f7b655498e22',
          text: 'Tenant to contact Agency to request maintenance/repair'
        },
        {
          id: '3da4820b-bac5-4612-bc5a-6d84119c41b6',
          text: 'Tenant should contact the Annual Smoke Alarm Provider directly'
        },
        {
          id: '014c6182-32fd-46f9-8ba3-123484d7e1fb',
          text: 'Tenant should report malfunctioning smoke alarms as Emergency Maintenance'
        }
      ]
    },
    [ActionSectionPolicies.PoolSpaSafety]: {
      subTitle: 'Your policy for pool/spa compliance',
      sections: [
        {
          isRadioButton: true,
          formRadioControl: 'db3d283a-a95f-4649-b6bc-9ad37edcd756',
          options: [
            {
              id: 'f283094e-7732-4cf8-9dcd-fd0158f5088f',
              text: 'Certificates renewed as per legislative requirements'
            },
            {
              id: 'c7082c40-92ed-4df6-a2f4-df061b9a570f',
              text: 'Certificates renewed annually'
            },
            {
              id: '53589565-5b92-4126-acd7-84d6e5f92b9d',
              text: 'Certificates renewed biennially'
            },
            {
              id: 'c4d820bb-b55b-411e-8b53-b6095a7cdc63',
              text: 'Certificates do not require renewal (does not expire)'
            }
          ]
        }
      ]
    },
    [ActionSectionPolicies.TemporaryPoolSpaCompliance]: {
      subTitle: 'Your policy on temporary / blow up pools',
      sections: [
        {
          isRadioButton: true,
          formRadioControl: 'ca77c58f-e7c9-4a37-ab7a-f816fe496224',
          options: [
            {
              id: '94900d71-bd9b-48ca-bc39-08605221162b',
              text: 'Tenants must not install/erect any pools/spas over legal depth'
            },
            {
              id: 'd52decd3-9b42-45f7-9946-523d6f77bf42',
              text: 'Tenants must not install/erect any pools/spas over legal depth without express written permission and compliance inspection'
            }
          ]
        }
      ]
    },
    [ActionSectionPolicies.PestControl]: {
      subTitle: 'Your policy on pest control',
      options: [
        {
          id: '48dce5ad-93b1-4f4d-bbcf-bdf1e5b2d19e',
          text: 'Owners are responsible for regular termite inspections'
        },
        {
          id: 'eb30937c-ef5f-4fce-8114-e4343e7e0863',
          text: 'Owners are responsible for regular general pest control (ie. cockroaches/ants/spiders/vermin)'
        },
        {
          id: '2d858969-5ddc-484f-a7e8-5527233d1fdf',
          text: 'Tenants are responsible for regular general pest control (ie. cockroaches/ants/spiders/vermin)'
        },
        {
          id: 'ebe571c2-b15d-4bb5-b5c2-de3ab460ce4f',
          text: 'Tenants are responsible for maintaining the property in a way that will discourage pests (ie. cockroaches/ants/spiders/vermi)'
        }
      ]
    }
  },
  Leasing: {
    [ActionSectionPolicies.PropertyViewings]: {
      subTitle: 'Guidelines on attending property viewings',
      options: [
        {
          id: '6df07c9f-1ff4-470a-9f33-eb9979072346',
          text: "Properties are usually shown at an advertised 'Open for Inspection' time"
        },
        {
          id: 'e62a70dd-65cf-490c-9ede-f8c28ac8bb8b',
          text: 'Private viewings are conducted for rental properties'
        },
        {
          id: '85550063-c253-4f0a-9811-107dbaeb4ab5',
          text: 'Open home times are advertised (via ${advertisement})',
          config: {
            advertisement: {
              type: 'input-text',
              css: { width: '160px', display: 'inline-block' },
              maxLength: 100
            }
          }
        },
        {
          id: '0487314b-739d-4055-9cd1-5545a04914f7',
          text: 'You must pre-register for an open home.'
        },
        {
          id: 'ada2691e-0e83-412f-9190-58ba71347ea0',
          text: 'You will be notified of your intended attendance.'
        },
        {
          id: '5ab5cf6c-0643-4ee6-9731-76e42ecc8d0e',
          text: 'If there is no open for inspection time scheduled we will take enquiries and schedule one when possible'
        }
      ]
    },
    [ActionSectionPolicies.ApplicationProcess]: {
      subTitle: 'How to apply for a property',
      options: [
        {
          id: 'ec92cea7-15da-4445-8865-762a0c293fca',
          text: 'Potential tenants must first view the property they are applying for'
        },
        {
          id: '5e2c3bb5-034a-4925-8bc2-6ccfe2d6247d',
          text: 'All persons who intend to be reside at the property must complete an application form (via ${application})',
          config: {
            application: {
              type: 'input-text',
              css: { width: '160px', display: 'inline-block' },
              maxLength: 100
            }
          }
        },
        {
          id: '96c76ba0-ff50-4fd7-bb28-970b8985cc5f',
          text: 'All persons who intend to reside at the property must',
          isParent: true,
          children: [
            {
              id: 'f6cf6e18-5162-4d39-8397-11943daaad50',
              text: 'Complete an application form.',
              isSubOption: true
            },
            {
              id: 'fbc6d6d4-0110-462c-9414-bb9587cb2a73',
              text: 'Provide 100 points of identification',
              isSubOption: true
            },
            {
              id: '68990e46-824b-474c-bb39-06439a29a8b0',
              text: 'Provide previous rental history including a rental ledger if possible',
              isSubOption: true
            },
            {
              id: '75be39d1-c381-4e79-9063-b2ed7a3b4f7a',
              text: 'Provide personal references',
              isSubOption: true
            },
            {
              id: '162ab5d8-ed72-48a3-9f4c-501fd71951fa',
              text: 'Provide proof of income including payslips',
              isSubOption: true
            }
          ]
        }
      ]
    },
    [ActionSectionPolicies.VacateInstructions]: {
      subTitle: 'What is a tenant responsible for when vacating?',
      options: [
        {
          id: '4d425e62-fe05-4170-9c7c-84fe07c80305',
          text: 'Return of keys ${keys}',
          config: {
            keys: {
              type: 'input-textarea',
              css: { width: '984px', display: 'inline-block' },
              maxLength: 300,
              defaultValue:
                'All keys, remotes/access fobs and cards are to be returned to our office upon vacate. This includes any extra keys that you have had cut during your tenancy.'
            }
          }
        },
        {
          id: '57591c61-1952-422c-bebf-a348ae870bd6',
          text: 'Outstanding payments ${payment}',
          config: {
            payment: {
              type: 'input-textarea',
              css: { width: '984px', display: 'inline-block' },
              maxLength: 300,
              defaultValue:
                'We will send through details for your final rental payment and any outstanding invoices. If you pay for water consumption, there may be one last reading and bill to pay, based on your water meter reading at vacate.'
            }
          }
        },
        {
          id: '345ccc74-9f4f-4c14-92ef-bb392ffd1ebd',
          text: 'Vacate inspection ${inspection}',
          config: {
            inspection: {
              type: 'input-textarea',
              css: { width: '984px', display: 'inline-block' },
              maxLength: 300,
              defaultValue:
                'After you have vacated the property, we will be conducting a vacate/exit inspection. If anything needs rectifying, we will be in touch to advise if any actions are required.'
            }
          }
        },
        {
          id: '21981436-10b6-48c1-85ac-dd99383bcf64',
          text: 'Bond/Security deposit ${Bond}',
          config: {
            Bond: {
              type: 'input-textarea',
              css: { width: '984px', display: 'inline-block' },
              maxLength: 300,
              defaultValue:
                'Your bond/security deposit will be processed once any issues at the property, along with any outstanding rent and invoices (if applicable), have been finalised.'
            }
          }
        }
      ]
    }
  },
  BreakInsKeys: {
    [ActionSectionPolicies.BreakIns]: {
      subTitle:
        'Your policy regarding repairs and lock/key replacement as a result of a break in',
      options: [
        {
          id: 'c8c557d4-42c6-40b3-adde-f82be07ecdd5',
          text: '{Owners} are responsible for the cost of repairs, replacing locks and replacement keys as a result of a break-in/attempted break-in',
          config: {
            Owners: {
              type: 'input-selected',
              css: {
                width: '120px',
                'min-height': '32px !important',
                display: 'inline-block',
                'margin-left': 0
              },
              items: [
                { id: 1, text: 'Owners' },
                { id: 2, text: 'Tenants' }
              ],
              bindValue: 'id',
              bindLabel: 'text',
              defaultValue: 1
            }
          }
        },
        {
          id: '5150d104-cc8d-47cf-9566-6a96dba5fc50',
          text: 'Tenants are responsible for making insurance claims for any stolen/damaged property as a result of a break-in/attempted break-in'
        }
      ]
    },
    [ActionSectionPolicies.LostOrStolenKeys]: {
      subTitle: 'Your policy regarding lost or  stolen keys',
      options: [
        {
          id: '40e26fb2-7aa9-4c6b-9e62-79139655d30f',
          text: 'Tenant must get new keys cut at their own expense, using Agency set to copy'
        },
        {
          id: 'a64acbbd-2a21-4140-9660-24c7d99949cf',
          text: 'If change of locks required tenant must provide one set to Agency at time of change and two sets at vacate'
        }
      ]
    }
  },
  LeasePropertyChanges: {
    [ActionSectionPolicies.PetRequests]: {
      subTitle: 'Agency pet request procedure',
      options: [
        {
          id: 'f5751d1b-cdea-4c8b-915e-bbf14e33b374',
          text: 'Agency will respond within the legislated timeframes'
        },
        {
          id: '253d752b-563d-436c-802e-a598afcba539',
          text: 'Agency will promptly begin pet request process and update the tenant/s throughout'
        },
        {
          id: '8398ce8c-f27e-4228-84f0-9a48f18b4ac2',
          text: 'Agency will communicate a decision once advised'
        }
      ]
    },
    [ActionSectionPolicies.ChangesToApprovedOccupants]: {
      subTitle: ' Changes to listed tenants/approved occupants',
      options: [
        {
          id: '153dfb1b-b09b-4a5c-81eb-6b6d9a759d4f',
          text: 'Any persons residing at the premises must be listed as Tenants on the Tenancy Agreement'
        },
        {
          id: 'ea62cc35-4ef8-47ce-bbbe-ae8f0e3fa170',
          text: 'Any persons residing at the premises must be listed as tenants OR approved occupants on the Tenancy Agreement'
        },
        {
          id: 'fa0aafdf-7b4d-47e0-a588-6a6d28994065',
          text: 'Changes to listed tenants must be requested in writing'
        },
        {
          id: '65dcc854-f86d-4cde-80b9-e2e507b299fc',
          text: 'The Tenancy Agreement will be amended to reflect any changes to tenants/approved occupants'
        },
        {
          id: '062b9d49-11c7-4f40-a5a0-8d6bd6a2952c',
          text: 'Tenants will be charged an administration fee of ${administrationFee} for any changes to tenants/approved occupants',
          config: {
            administrationFee: {
              type: 'input-number',
              css: { width: '160px', display: 'inline-block' },
              defaultValue: 99
            }
          }
        }
      ]
    },
    [ActionSectionPolicies.ChangesToPropertyHooksNails]: {
      subTitle: 'Standard Agency policy on installing hooks/nails',
      options: [
        {
          id: '0e706da3-0f7a-47b3-88ca-4c52e17ce4cc',
          text: 'Tenant must seek permission for any hooks/nails to be installed at property'
        },
        {
          id: 'd8ec03de-f176-490d-b468-3e82ac6e6286',
          text: 'Tenant may install hooks/nails but must make good on any installation when vacating property (remove/patch/repaint wall)'
        },
        {
          id: '00e9880d-99ef-4ce1-9a1b-695b27d3a90f',
          text: 'Tenant must not at any time install hooks/nails at property'
        }
      ]
    },
    [ActionSectionPolicies.ChangesToPropertyApplianceFixture]: {
      subTitle:
        'Your policy on replacing locks, appliances and other property fixtures during a tenancy',
      options: [
        {
          id: 'bbc3481c-fe5c-404e-affc-08b350e72848',
          text: 'Tenant must seek written permission to make changes to the property'
        },
        {
          id: '6590689f-339b-46c7-b197-9cd6a9236e92',
          text: 'Tenant may make changes to the property but must make good on any changes or installation when vacating'
        },
        {
          id: '9cdc2b08-38e8-4a70-8523-708cc8a33185',
          text: 'Tenant must not at any time make changes to the property'
        }
      ]
    }
  },
  Inspections: {
    [ActionSectionPolicies.RoutineInspectionPolicy]: {
      options: [
        {
          id: '142adda2-d7ff-4269-9897-9e6346d0038f',
          text: 'Routine Inspections are conducted regularly as per the Tenants lease agreement'
        },
        {
          id: '830cb9a9-0356-4143-bb27-812798595447',
          text: 'Routine inspections conducted approximately every ${inspections} ${period}',
          config: {
            inspections: {
              type: 'input-selected',
              css: { width: '120px', display: 'inline-block' },
              defaultValue: 6,
              items: [
                { id: 1, text: 1 },
                { id: 2, text: 2 },
                { id: 3, text: 3 },
                { id: 4, text: 4 },
                { id: 5, text: 5 },
                { id: 6, text: 6 },
                { id: 7, text: 7 },
                { id: 8, text: 8 },
                { id: 9, text: 9 },
                { id: 10, text: 10 },
                { id: 11, text: 11 },
                { id: 12, text: 12 },
                { id: 13, text: 13 },
                { id: 14, text: 14 },
                { id: 15, text: 15 },
                { id: 16, text: 16 },
                { id: 17, text: 17 },
                { id: 18, text: 18 },
                { id: 19, text: 19 },
                { id: 20, text: 20 },
                { id: 21, text: 21 },
                { id: 22, text: 22 },
                { id: 23, text: 23 },
                { id: 24, text: 24 }
              ],
              bindLabel: 'text',
              bindValue: 'id'
            },
            period: {
              type: 'input-selected',
              css: {
                width: '120px',
                display: 'inline-block',
                'margin-left': 0
              },
              items: [
                { id: 1, text: 'Weeks' },
                { id: 2, text: 'Months' }
              ],
              bindLabel: 'text',
              bindValue: 'id',
              defaultValue: 2
            }
          }
        }
      ]
    }
  },
  ResponseTime: {
    [ActionSectionPolicies.NonUrgentEnquiries]: {
      subTitle:
        'How quickly can a tenant expect a response to a non-urgent enquiry?',
      sections: [
        {
          subTitleChild: 'Typically we respond within:',
          isRadioButton: true,
          formRadioControl: 'db57ed3d-aa10-4b69-abdb-f048a50e902f',
          options: [
            {
              id: 'c8d662ab-e848-44fe-85fd-ca9770f5ef75',
              text: 'a few hours'
            },
            {
              id: '365f8e96-1cce-4a16-8f69-e137f179299b',
              text: '24 hours'
            },
            {
              id: '2248c43e-0add-4e13-b9c5-ab4c51ae60b9',
              text: '1 business day'
            },
            {
              id: '268acb7b-f2a5-42e3-b933-84bd3de92485',
              text: '3 business days'
            },
            {
              id: 'c980d440-8ae3-4c61-9656-76fff676354e',
              text: '5-7 days'
            }
          ]
        }
      ]
    },
    [ActionSectionPolicies.UrgentEnquiries]: {
      subTitle:
        'How quickly can a tenant expect a response to an urgent issue, including emergency maintenance?',
      sections: [
        {
          subTitleChild:
            'If the issue is raised during office hours typically we respond within:',
          isRadioButton: true,
          formRadioControl: '351a2647-701d-4422-a1a3-082868185475',
          options: [
            {
              id: 'bb8df06f-5e01-44c3-9c9a-cdf301ce4236',
              text: 'a few hours'
            },
            {
              id: 'c57f62f7-c64b-46f1-9683-ab2fbd567767',
              text: 'the same business day'
            }
          ]
        },
        {
          subTitleChild:
            'If the issue is raised outside of office hours, typically we respond:',
          isRadioButton: true,
          formRadioControl: '9606bb99-e69c-4e4e-96cf-eca4d7c9ec19',
          options: [
            {
              id: 'afceb7f4-7644-4a3c-b056-537c1c5769ec',
              text: 'within 6 hours'
            },
            {
              id: '73f249ed-7c50-4be4-a503-069d21faaaf2',
              text: 'within 12 hours'
            },
            {
              id: 'a567ebe2-128c-463d-8046-751dd1230447',
              text: 'when the office re-opens'
            }
          ]
        }
      ]
    }
  }
};

export const FILE_TEMPLATE_SECTIONS = {
  Leasing: {
    [ActionSectionPolicies.ApplicationForm]: {
      id: '4a89c80a-9e14-4b13-88c9-ece1cde16396',
      title: 'Application form (optional)',
      subTitle: 'Your agency’s application for tenant applications',
      msgNotEdit: 'No documents',
      isActiveFile: true
    },
    [ActionSectionPolicies.ArrearsPolicyDocument]: {
      id: '5f95cb6a-b2c5-41f7-a65d-7ff77125939f',
      title: 'Arrears Policy Document (optional)',
      subTitle: 'Your agency’s arrears policy as a PDF to provide to tenants',
      msgNotEdit: 'No documents',
      isActiveFile: true
    },
    [ActionSectionPolicies.VacateChecklist]: {
      id: '88e13d5e-bbc7-4657-8fbe-b80966435621',
      title: 'Vacate Checklist (optional)',
      subTitle: 'A handy PDF to provide vacating tenants',
      msgNotEdit: 'No documents',
      isActiveFile: true
    }
  },
  NewBusiness: {
    [ActionSectionPolicies.NewBussinessEnquiry]: {
      id: '90f63faf-fe93-4f9f-97ff-2f607c09a78a',
      title: 'New business enquiry (optional)',
      subTitle: 'Upload your management prospectus',
      msgNotEdit: 'No documents'
    },
    [ActionSectionPolicies.AgencyManagementAgreement]: {
      id: '0a7b6928-772f-4643-8ff6-282e8bcd8d5c',
      title: 'Agency management agreement (optional)',
      subTitle: 'Please upload your Standard Managing Agency Agreement.',
      msgNotEdit: 'No documents'
    }
  }
};

export const SUPPLIERS_SELECT_SECTION = {
  Insurance: {
    [ActionSectionPolicies.LandlordInsuranceProviders]: {
      id: 'c4bc4056-672c-4bd6-b99b-68bc4f92b0dd',
      title: 'Owner insurance providers',
      subTitle: 'Who are your recommended owner insurance providers?'
    }
  }
};

export const mockSelectedPropertyList = [
  {
    id: 'a7db69ad-cc06-45f5-ac0f-4fe543ef5eea',
    agencyId: 'd066fce3-5864-4d3c-8f06-694862dea32a',
    propertyId: '6a87f125-8b35-4acc-901d-562596171e84',
    streetline: 'Suite 1 /10 Hudson Street, ST LEONARDS, NSW 2065',
    users: [
      {
        propertyEmergencyId: 'a7db69ad-cc06-45f5-ac0f-4fe543ef5eea',
        firstName: null,
        lastName: "Bronnie's Cleaning Services",
        userType: 'SUPPLIER',
        id: '307a7ca1-8d1a-4b6e-97c1-a98ef10ef4c0',
        phoneNumber: '+61412546785',
        email: 'bronnie@bronniehilton.com.au',
        status: 'PENDING'
      },
      {
        propertyEmergencyId: 'a7db69ad-cc06-45f5-ac0f-4fe543ef5ee8',
        firstName: 'Ernst @ Young',
        lastName: 'Accountants',
        userType: 'LANDLORD',
        id: '9d744904-c1fd-4bd9-9277-61628e788dc4',
        phoneNumber: null,
        email: 'va.1926uno@gmail.com',
        status: 'PENDING'
      }
    ]
  },
  {
    id: 'a7db69ad-cc06-45f5-ac0f-4fe543ef5ee2',
    agencyId: 'd066fce3-5864-4d3c-8f06-694862dea32a',
    propertyId: 'b4207154-587d-492b-999e-f6672808b158',
    streetline: '42 Crown Street, SURRY HILLS, NSW 2010',
    users: [
      {
        propertyEmergencyId: 'a7db69ad-cc06-45f5-ac0f-4fe543ef5ee2',
        firstName: null,
        lastName: 'Rock Council',
        userType: 'SUPPLIER',
        id: '1845ea68-d6da-4ae5-8133-9791ead17fce',
        phoneNumber: '123456',
        email: 'info@rockcouncil.com.au',
        status: 'PENDING'
      }
    ]
  }
];
