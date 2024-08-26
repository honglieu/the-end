import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ETypeContactItem,
  IAgentUserProperties,
  IContactItemFormatted,
  ISourceProperty,
  IUserProperties,
  IUserPropertyGroup
} from '@/app/user/list-property-contact-view/model/main';
import { ContactPropertyRowComponent } from './contact-property-row.component';
import { PropertyUnitItemComponent } from '@/app/user/list-property-contact-view/components/property-unit-item/property-unit-item.component';
import { TenantOwnerItemComponent } from '@/app/user/list-property-contact-view/components/tenancy-ownership-item/tenancy-ownership-item.component';
import { MockComponent } from 'ng-mocks';
import { TrudiIconComponent } from '@trudi-ui';
import { CompanyService } from '@services/company.service';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';

describe('ContactPropertyComponent', () => {
  let fixture: ComponentFixture<ContactPropertyRowComponent>;
  let component: ContactPropertyRowComponent;
  let httpClient: HttpClient;

  const dataItem: IContactItemFormatted<
    | IAgentUserProperties
    | ISourceProperty
    | IUserPropertyGroup
    | IUserProperties
  > = {
    isChecked: false,
    data: {
      userPropertyId: '7bfba81c-b996-4d6d-af6a-7b6cc8b72c6e',
      userId: 'cec1490a-325e-48db-9b01-aa011f3e3bdf',
      type: 'LANDLORD',
      status: 'ACTIVE',
      propertyId: '64abc598-d8a6-43d2-992e-2027ab91521c',
      email: 'jena6.trulet@gmail.com',
      lastActivity: '',
      firstName: 'Minh',
      lastName: 'Anh (E)',
      phoneNumbers: [],
      unconfirmedChangeEmail: null,
      inviteStatus: 'INVITED',
      iviteSent: '2024-03-27T07:19:22.968Z',
      isPrimary: false,
      fullName: 'Minh Anh (E)',
      secondaryEmails: [
        {
          id: 'f9f2cf8a-5817-4ab6-96c8-bcffb803e0cc',
          userId: 'cec1490a-325e-48db-9b01-aa011f3e3bdf',
          email: 'chatgpt.2t@gmail.com',
          propertyId: '64abc598-d8a6-43d2-992e-2027ab91521c',
          createdAt: '2024-03-29T09:59:17.748Z'
        },
        {
          id: 'c6a0164c-7b80-424e-a08d-1a7171d39402',
          userId: 'cec1490a-325e-48db-9b01-aa011f3e3bdf',
          email: 'monnotoro@gmail.com',
          propertyId: '64abc598-d8a6-43d2-992e-2027ab91521c',
          createdAt: '2024-05-07T02:58:09.522Z'
        }
      ],
      secondaryPhones: [],
      streetline: '01 Nguyen Tat Thanh, NSW'
    },
    dataType: ETypeContactItem.PROPERTY
  };
  beforeEach(() => {
    const mockResizeObserver = jest.fn();
    describe;
    mockResizeObserver.prototype.observe = jest.fn();
    mockResizeObserver.prototype.disconnect = jest.fn();
    window.ResizeObserver = mockResizeObserver;
  });
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([]), HttpClientTestingModule],
      declarations: [
        ContactPropertyRowComponent,
        PropertyUnitItemComponent,
        TenantOwnerItemComponent,
        MockComponent(TrudiIconComponent),
        ToastrModule.forRoot()
      ],
      providers: [CompanyService, PhoneNumberFormatPipe]
    });
    httpClient = TestBed.inject(HttpClient);
    await TestBed.compileComponents();
  });
  beforeEach(() => {
    fixture = TestBed.createComponent(ContactPropertyRowComponent);
    component = fixture.componentInstance;
    component.item = dataItem;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    delete window.ResizeObserver;
  });
});
