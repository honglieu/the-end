import { Injectable } from '@angular/core';
import { env } from 'src/environments/environment';

export interface RealTimeDbEventTypes {
  create: 'create';
  update: 'update';
  delete: 'delete';
}

export interface RealTimeDbEvent {
  data: any;
  action: RealTimeDbEventTypes;
}

@Injectable()
export class RealTimeDbService {
  // public onMessage = new Subject<RealTimeDbEvent>();
  // public onConversation = new Subject<RealTimeDbEvent>();
  // public onProperty = new Subject<RealTimeDbEvent>();
  // public onEddrStatusChange = new Subject<RealTimeDbEvent>();
  // public onAgencyUnreadCountChange = new Subject<RealTimeDbEvent>();
  // public onFile = new Subject<RealTimeDbEvent>();
  // public onuserPropertyStepper = new Subject<RealTimeDbEvent>();
  private initState = {
    conversation: false,
    property: false,
    message: false,
    eddrStatusChange: false,
    agencyUnreadCountChange: false,
    file: false,
    userPropertyStepper: false
  };
  private realTimeDbEntities = {
    conversation: `${env}/conversation`,
    property: `${env}/property`,
    message: `${env}/message`,
    eddrStatusChange: `${env}/eddrStatusChange`,
    agencyUnreadCountChange: `${env}/consoleAgencyUnreadCount`,
    file: `${env}/file`,
    userPropertyStepper: `${env}/userPropertyStepper`
  };

  constructor() {
    this.init();
  }

  init() {
    // this.angularFireDatabase.database.ref(this.realTimeDbEntities.conversation).on('value', (snapshot) => {
    //   this.initState.conversation ?
    //     this.onConversation.next(snapshot.val() as RealTimeDbEvent) :
    //     this.initState.conversation = true;
    // });
    // this.angularFireDatabase.database.ref(this.realTimeDbEntities.property).on('value', (snapshot) => {
    //   this.initState.property ?
    //     this.onProperty.next(snapshot.val() as RealTimeDbEvent) :
    //     this.initState.property = true;
    // });
    // this.angularFireDatabase.database.ref(this.realTimeDbEntities.message).on('value', (snapshot) => {
    //   this.initState.message ?
    //     this.onMessage.next(snapshot.val() as RealTimeDbEvent) :
    //     this.initState.message = true;
    // });
    // this.angularFireDatabase.database.ref(this.realTimeDbEntities.eddrStatusChange).on('value', (snapshot) => {
    //   this.initState.eddrStatusChange ?
    //     this.onEddrStatusChange.next(snapshot.val() as RealTimeDbEvent) :
    //     this.initState.eddrStatusChange = true;
    // });
    // this.angularFireDatabase.database.ref(this.realTimeDbEntities.agencyUnreadCountChange).on('value', (snapshot) => {
    //   this.initState.agencyUnreadCountChange ?
    //     this.onAgencyUnreadCountChange.next(snapshot.val() as RealTimeDbEvent) :
    //     this.initState.agencyUnreadCountChange = true;
    // });
    // this.angularFireDatabase.database.ref(this.realTimeDbEntities.file).on('value', (snapshot) => {
    //   this.initState.file ?
    //     this.onFile.next(snapshot.val() as RealTimeDbEvent) :
    //     this.initState.file = true;
    // });
    // this.angularFireDatabase.database.ref(this.realTimeDbEntities.userPropertyStepper).on('value', (snapshot) => {
    //   this.initState.userPropertyStepper ?
    //     this.onuserPropertyStepper.next(snapshot.val() as RealTimeDbEvent) :
    //     this.initState.userPropertyStepper = true;
    // });
  }
}
