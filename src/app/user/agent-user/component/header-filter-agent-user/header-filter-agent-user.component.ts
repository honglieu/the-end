import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { AuthService } from '@services/auth.service';
import { EFilterType } from '@shared/enum/user.enum';
import {
  FILTER_TYPE_TENANT_OWNER,
  LIST_DATE_FILTER,
  crmStatus,
  inviteFilterList,
  propertyStatus,
  roleFilterList
} from '@/app/user/utils/user.type';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import { combineNames } from '@shared/feature/function.feature';

@Component({
  selector: 'header-filter-agent-user',
  templateUrl: './header-filter-agent-user.component.html',
  styleUrls: ['./header-filter-agent-user.component.scss']
})
export class HeaderFilterAgentUserComponent implements OnInit {
  @Output() selectedEventFilter = new EventEmitter<void>();

  private unsubscribe = new Subject<void>();
  public crmStatus = crmStatus.filter((status) => status.text !== 'Deleted');
  public propertyStatus = propertyStatus;
  public inviteStatus = [];
  public filterType = EFilterType;
  public listDateFilter = LIST_DATE_FILTER;
  public listInviteFilter = inviteFilterList;
  public listRoleFilter = roleFilterList;
  public prevListCrm: string[] = [];
  public prevListPortfolio: string[] = [];
  public prevListRoles: string[] = [];
  public prevListTime: string[] = [];
  public prevListPropertyStatus: string[] = [];
  public prevListListInviteStatus: string[] = [];
  public prevListLastTime: string[] = [];
  public selectedAgency: string;
  public TYPE_GET_PORTFOLIO: string = 'ALL-PORTFOLIO';
  public portfolioList: { id: string; text: string }[];
  public newDataFilter = {};
  constructor(
    private authService: AuthService,
    private agentUserService: AgentUserService
  ) {}

  ngOnInit(): void {
    this.getPortfolios();
    this.handleGetValueFilter();
  }

  handleGetValueFilter() {
    const listKeyFilters = this.agentUserService.getDataFilter('TENANTS_OWNER');
    const { CRM, PROPERTY_STATUS, PORTFOLIO, ROLES, STATUS, LAST_IMPORT } =
      listKeyFilters || {};
    this.prevListCrm = CRM || ['Current'];
    this.prevListPropertyStatus = PROPERTY_STATUS || ['Active'];
    this.prevListLastTime = LAST_IMPORT || [];
    this.prevListPortfolio = PORTFOLIO || [];
    this.prevListRoles = ROLES || [];
    this.prevListListInviteStatus = STATUS || [];
  }

  getPortfolios() {
    this.inviteStatus = [...this.inviteStatus];
    this.crmStatus = crmStatus.filter((status) => status.text !== 'Deleted');
    this.propertyStatus = [...propertyStatus];
    this.listDateFilter = [...LIST_DATE_FILTER];
    this.listInviteFilter = [...inviteFilterList];
    this.listRoleFilter = [...roleFilterList];
    this.authService
      .getPortfoliosByType(this.TYPE_GET_PORTFOLIO)
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(),

        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        if (res) {
          this.portfolioList = res.map((portfolio) => ({
            id: portfolio.id,
            text: combineNames(portfolio.firstName, portfolio.lastName)
          }));
        }
      });
  }

  handleItemsSelected(event) {
    this.agentUserService.handleDataFilter(
      event,
      this.newDataFilter,
      'TENANTS_OWNER',
      FILTER_TYPE_TENANT_OWNER
    );
    this.selectedEventFilter.emit(event);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
