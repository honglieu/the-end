import {
  BehaviorSubject,
  combineLatest,
  debounce,
  distinctUntilChanged,
  map,
  Observable,
  pairwise,
  timer
} from 'rxjs';
import { Injectable } from '@angular/core';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import {
  ETypeElement,
  ESelectStepType
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { cloneDeep, isEqual } from 'lodash-es';
import {
  ETreeNodeState,
  TreeNodeOptions
} from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';
import {
  TaskTemplateHelper,
  TemplateError
} from '@/app/dashboard/modules/task-editor/modules/task-template-details/helper/task-template.helper';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import {
  CanAddOncePTComponent,
  CanAddOnceRMComponent
} from '@/app/dashboard/modules/task-editor/constants/property-tree.constant';
import {
  EButtonAction,
  ERentManagerAction
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import uuid4 from 'uuid4';

type QueryOptions<T> = Partial<
  Record<
    keyof T,
    | Partial<T[keyof T]>
    | { $ne?: Partial<T[keyof T]>; $before?: Partial<T[keyof T]> }
  >
>;

@Injectable({
  providedIn: 'root'
})
export class TemplateTreeService {
  //TREE DATA ---------------------------------------------------
  private originTemplateTree: BehaviorSubject<TreeNodeOptions[]> =
    new BehaviorSubject([]);
  public originTemplateTree$ = this.originTemplateTree.asObservable();
  private currentTemplateTree: BehaviorSubject<TreeNodeOptions[]> =
    new BehaviorSubject([]);
  public currentTemplateTree$ = this.currentTemplateTree.asObservable();
  public hasCurrentTemplateTreeValueChanged$ = this.currentTemplateTree
    .asObservable()
    .pipe(
      pairwise(),
      map(([prev, curr]) => {
        return prev !== curr;
      })
    );

  private currentErrorNode: BehaviorSubject<
    {
      key: string;
      message: string;
    }[]
  > = new BehaviorSubject(null);
  public currentErrorNode$ = this.currentErrorNode.asObservable();
  //SAVE CHANGE DATA ---------------------------------------------------
  private isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public isLoading$ = this.isLoading.asObservable();
  private saveChangeError: BehaviorSubject<{ isError: boolean }> =
    new BehaviorSubject({
      isError: false
    });
  public saveChangeError$ = this.saveChangeError.asObservable();
  private saveChangeDataTree: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public saveChangeDataTree$ = this.saveChangeDataTree.asObservable();
  //DECISION DATA ---------------------------------------------------
  private isEditingSubject: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public isEditing$ = this.isEditingSubject.asObservable();

  constructor() {}

  public setEdit(value: boolean) {
    this.isEditingSubject.next(value);
  }

  public addNode(type: ETypeElement, data: TreeNodeOptions, bottom = false) {
    if (type === ETypeElement.DECISION) {
      const decisions = this.currentTemplateTree.value.filter(
        (res) => res.type == ETypeElement.DECISION
      );
      if (decisions.length == 0) {
        data.index = 0;
      } else {
        data.index = Math.max(...decisions.map((item) => item.index)) + 1;
      }
    }
    const option = { needCheckCrmConflict: true, crmSystemId: null };
    if (bottom) {
      this.setCurrentTemplateTree(
        [...this.currentTemplateTree.value, data],
        option
      );
    } else {
      this.setCurrentTemplateTree(
        [data, ...this.currentTemplateTree.value],
        option
      );
    }
  }

  public updateNode(data: TreeNodeOptions) {
    let crmSystemId = null;
    let needCheckCrmConflict = false;
    const mapNode = (node: TreeNodeOptions) => {
      if (
        !needCheckCrmConflict &&
        node?.type === ETypeElement.STEP &&
        node?.crmConflictErrors &&
        node?.crmConflictErrors?.length > 0
      ) {
        crmSystemId = node.crmConflictErrors[0].crmSystemId;
        needCheckCrmConflict = true;
      }
      if (node.key === data.key) {
        Object.assign(node, data);
        return node;
      }
      if (node.children) node.children = node.children.map(mapNode);
      return node;
    };
    const newNodes = cloneDeep(this.currentTemplateTree.value).map(mapNode);
    this.setCurrentTemplateTree(newNodes, {
      needCheckCrmConflict,
      crmSystemId
    });
  }

  public duplicateNode(node: TreeNodeOptions) {
    const newNode = TaskTemplateHelper.getCopyNodeWithNewKey(cloneDeep(node));
    const newTemplateTree = TaskTemplateHelper.addNewNodeBaseOnKey(
      [...this.getCurrentTemplateTree()],
      node.key,
      newNode
    );

    this.setCurrentTemplateTree(newTemplateTree);
    return newNode;
  }

  public deleteStep(data: TreeNodeOptions) {
    let needCheckCrmConflict = false;
    let crmSystemId = null;
    const filterNode = (node) => {
      if (
        !needCheckCrmConflict &&
        node?.type === ETypeElement.STEP &&
        node?.crmConflictErrors &&
        node?.crmConflictErrors?.length > 0
      ) {
        crmSystemId = node.crmConflictErrors[0].crmSystemId;
        needCheckCrmConflict = true;
      }
      if (node.key === data.key) {
        return false;
      }

      if (node.children) node.children = node.children.filter(filterNode);
      return true;
    };
    let newNodes = cloneDeep(this.currentTemplateTree.value).filter(filterNode);
    this.setCurrentTemplateTree(newNodes, {
      needCheckCrmConflict,
      crmSystemId
    });
  }

  public deleteNode(data: NzTreeNodeOptions[]) {
    this.setCurrentTemplateTree(data);
  }

  public dragNode(data: NzTreeNodeOptions[]) {
    this.setCurrentTemplateTree(data);
  }

  public isTreeChanged(): Observable<boolean> {
    return combineLatest([
      this.currentTemplateTree$,
      this.originTemplateTree$
    ]).pipe(
      debounce(() => timer(500)),
      map(([current, origin]) => {
        const filterNode = (node) => {
          if (node.state === ETreeNodeState.DRAFT) {
            return false;
          }
          if (node.children) node.children = node.children.filter(filterNode);
          return true;
        };
        const currentTemplate = current.filter(filterNode);
        return !Boolean(isEqual(currentTemplate, origin));
      })
    );
  }

  public handleDisabledSaveChangeBtn(): Observable<boolean> {
    return this.currentTemplateTree$.pipe(
      map((rs) => {
        return (
          TaskTemplateHelper.crmConflict ||
          TaskTemplateHelper.listStepHasInvalidParam.some(
            (item) => item === true
          )
        );
      }),
      distinctUntilChanged()
    );
  }

  setOriginTemplateTree(
    value,
    option = { needCheckCrmConflict: false, crmSystemId: null }
  ) {
    let formatValue = TaskTemplateHelper.formatTemplateData_v2(value, option);
    this.originTemplateTree.next(formatValue);
  }

  setCurrentTemplateTree(
    value,
    option = { needCheckCrmConflict: false, crmSystemId: null }
  ) {
    let formatValue = TaskTemplateHelper.formatTemplateData_v2(value, option);
    this.currentTemplateTree.next(formatValue);
  }

  queryNode<T>(options: QueryOptions<T>): NzTreeNodeOptions {
    const compareObject = (object, options) => {
      return Object.keys(object).every((key) => {
        if (options[key] === undefined) return true;

        if (typeof options[key] !== 'object') {
          return object[key] === options[key];
        } else {
          if (options[key].$ne) {
            return object[key] !== options[key].$ne;
          } else {
            return compareObject(object[key], options[key]);
          }
        }
      });
    };

    const findNode = (nodes: NzTreeNodeOptions[], options: QueryOptions<T>) => {
      for (const node of nodes) {
        const isMatch = compareObject(node, options);

        if (isMatch) return node;

        if (node.children) {
          const foundNode = findNode(node.children, options);
          if (foundNode) return foundNode;
        }
      }

      return null;
    };

    const resultNode = findNode(this.currentTemplateTree.value, options);

    return resultNode;
  }

  resetNode(node: TreeNodeOptions, title: string) {
    const originNode = this.getNodeByKey(
      node.key,
      this.currentTemplateTree.value
    );
    const parentNode = this.getNodeByKey(
      node.parentKey,
      this.currentTemplateTree.value
    );
    if (originNode && title) {
      originNode.title = title;
      this.updateNode(originNode);
    } else {
      this.deleteStep(node);
    }
  }

  public getNodeByKey(key: string, nodes: TreeNodeOptions[]) {
    const getNode = (prev, curr: TreeNodeOptions) => {
      if (curr.key === key) return curr;
      if (curr.children && curr.children.length)
        return curr.children.reduce(getNode, prev);
      return prev;
    };
    return nodes.reduce(getNode, null);
  }

  setErrorNode(errors: TemplateError[]) {
    this.currentErrorNode.next(
      errors?.map((error) => ({
        key: error?.nodeIndex,
        message: error?.message
      }))
    );
  }

  getErrorNode() {
    return this.currentErrorNode.value;
  }

  getCurrentTemplateTree() {
    return this.currentTemplateTree.value;
  }

  setIsLoadingSaveData(value): void {
    this.isLoading.next(value);
  }

  setSaveChangeError(value: { isError: boolean }): void {
    this.saveChangeError.next(value);
  }

  saveData(): void {
    this.isLoading.next(true);
    this.saveChangeDataTree.next(true);
  }

  setSaveChangeDataTree(value: boolean) {
    this.saveChangeDataTree.next(value);
  }

  resetTemplateTree(isConsoleSettings) {
    this.setCurrentTemplateTree(
      this.originTemplateTree.value,
      isConsoleSettings
        ? { needCheckCrmConflict: true, crmSystemId: null }
        : { needCheckCrmConflict: true, crmSystemId: null }
    );
    this.setEdit(false);
  }

  performValidateTemplate(crm: ECRMSystem) {
    try {
      switch (crm) {
        case ECRMSystem.PROPERTY_TREE:
          TaskTemplateHelper.validateTemplate(
            cloneDeep(this.getCurrentTemplateTree()),
            ESelectStepType.PROPERTY_TREE_ACTION,
            CanAddOncePTComponent,
            {
              CREATE: EButtonAction.PT_NEW_COMPONENT,
              UPDATE: EButtonAction.PT_UPDATE_COMPONENT
            }
          );
          break;
        case ECRMSystem.RENT_MANAGER:
          TaskTemplateHelper.validateTemplate(
            cloneDeep(this.getCurrentTemplateTree()),
            ESelectStepType.RENT_MANAGER_ACTION,
            CanAddOnceRMComponent,
            {
              CREATE: ERentManagerAction.RM_NEW_COMPONENT,
              UPDATE: ERentManagerAction.RM_UPDATE_COMPONENT
            }
          );
          break;
      }
      this.setErrorNode(null);
    } catch (e) {
      this.setErrorNode(e);
    }
  }

  getAllTreeKeys(tree) {
    const keys = [];
    function processNode(node) {
      if (node.key !== undefined) {
        keys.push(node.key);
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(processNode);
      }
    }
    tree.forEach(processNode);
    return keys;
  }
}
