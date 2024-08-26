// import { UserService as UserDashboardService } from '@/app/dashboard/services/user.service';
// import { ChatGptService } from '@services/chatGpt.service';
// import { CompanyService } from '@services/company.service';
// import { LocalStorageService } from '@services/local.storage';
// import { UserService } from '@services/user.service';
// import { Injectable } from '@angular/core';
// import { lastValueFrom } from 'rxjs';
// import { DashboardApiService } from '../../services/dashboard-api.service';

// @Injectable()
// export class DashboardPrimaryDataService {
//   constructor(
//     private readonly dashboardApiService: DashboardApiService,
//     private readonly userService: UserService,
//     private readonly userDashboardService: UserDashboardService,
//     private readonly chatGptService: ChatGptService,
//     private readonly companyService: CompanyService,
//     private readonly localStorageService: LocalStorageService
//   ) {}

//   public async loadPrimaryData() {
//     try {
//       const user = await lastValueFrom(
//         this.dashboardApiService.getUserDetail()
//       );
//       if (!user) {
//         return false;
//       }
//       this.userDashboardService.setUserDetail(user);
//       this.userService.selectedUser.next(user);
//       this.userDashboardService.setSelectedUser(user);
//       const companies = await lastValueFrom(
//         this.dashboardApiService.getUserAgencies(user.id)
//       );
//       if (!companies?.length || !companies[0]?.id) {
//         return false;
//       }
//       const lastCompanyId =
//         this.localStorageService.getValue<string>('companyId');
//       // sure for the id is valid
//       const company = companies?.find(
//         (companyAgent) => companyAgent.companyId === lastCompanyId
//       );
//       const currentCompanyId =
//         company?.companyId ?? user.companyAgents[0]?.companyId;
//       this.companyService.setCurrentCompanyId(currentCompanyId);
//       this.localStorageService.setValue<string>('companyId', currentCompanyId);

//       this.companyService.setCompanies(companies);
//       this.chatGptService.setSetting(companies);
//       return true;
//     } catch (error) {
//       console.error(error);
//       return false;
//     }
//   }
// }
