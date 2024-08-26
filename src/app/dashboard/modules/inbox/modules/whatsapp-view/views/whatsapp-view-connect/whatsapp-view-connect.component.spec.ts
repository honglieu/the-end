import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsappViewConnectComponent } from './whatsapp-view-connect.component';

describe('WhatsappViewConnectComponent', () => {
  let component: WhatsappViewConnectComponent;
  let fixture: ComponentFixture<WhatsappViewConnectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsappViewConnectComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(WhatsappViewConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
