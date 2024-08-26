import { EPolicyDetailOpenFrom } from '@/app/dashboard/modules/agency-settings/components/policies/utils/enum';
import { IPolicyDetail } from '@/app/dashboard/modules/agency-settings/utils/enum';
import { PolicyDetailPanelComponent } from '@/app/share-pop-up/policy-detail/policy-detail-panel/policy-detail-panel.component';
import { SelectPolicyTypePopupComponent } from '@/app/share-pop-up/select-policy-type-pop-up/select-policy-type-pop-up.component';
import { getPolicyPopoverStyle } from '@shared/feature/function.feature';
import { OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import tinymce from 'tinymce';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  extractAllDynamicParameter,
  getAiDynamicParamsPayload
} from '@/app/dashboard/components/ai-interactive-bubble/utils/ai-params-helper';
import { AiInteractiveBuilderService } from '@/app/shared/components/tiny-editor/services';

export const enum EOverLayRef {
  ADD_POLICY = 'ADD_POLICY',
  POLICY_DETAIL = 'POLICY_DETAIL'
}

let pluginState = {
  manualHighlighText: '',
  existedTextSelection: false,
  propertyIds: [],
  currentPropertyId: '',
  createMessageFrom: '',
  currentOverlayComponent: null,
  isSelecting: false,
  showAddPolicyPopover: false,
  crmSystem: null
};
let overlay;
let overlayRef: OverlayRef;
let zoneService;
let router;
let aiService;
let companyServices;
let aiInteractiveBuilderService: AiInteractiveBuilderService;
export const injectServiceToSelectionPlugin = (
  overlayService,
  zonInjectService,
  routerService,
  aiPolicyService,
  companyService,
  aiInteractiveBuilder
) => {
  overlay = overlayService;
  zoneService = zonInjectService;
  router = routerService;
  aiService = aiPolicyService;
  companyServices = companyService;
  aiInteractiveBuilderService = aiInteractiveBuilder;
};

export const valueInputsChangeToBuildCustomSelection = (
  propertyIds: string[],
  createMessageFrom: string,
  showAddPolicyPopover: boolean
) => {
  pluginState.propertyIds = [...propertyIds];
  pluginState.createMessageFrom = createMessageFrom;
  pluginState.showAddPolicyPopover = showAddPolicyPopover;
};

const getAllDynamicParamByCRM = () => {
  const dynamicByCrm = getAiDynamicParamsPayload(pluginState.crmSystem);
  return extractAllDynamicParameter(dynamicByCrm);
};

const showPopupAddPolicy = (editor) => {
  const keysOfDynamicParameter = getAllDynamicParamByCRM();
  const content = editor.selection.getContent({ format: 'text' });
  // check if user only click dynamic parameter shouldn't show add policy
  if (keysOfDynamicParameter.includes(content?.trim())) return;
  pluginState.manualHighlighText = content;
  if (content.length > 0 && !editor.selection.isCollapsed()) {
    const range = editor.selection?.getRng();
    const rect = range.getBoundingClientRect();
    const element = editor?.iframeElement?.getBoundingClientRect();
    const sendMsgBody =
      pluginState.createMessageFrom !== ECreateMessageFrom.APP_MESSAGE
        ? editor?.iframeElement
            ?.closest('#sendMsgBody')
            ?.getBoundingClientRect()
        : null;
    const style = getPolicyPopoverStyle(rect, element, sendMsgBody);
    createSelectPolicyTypeComponent(content, style);
  } else {
    destroyOverlayRef(EOverLayRef.ADD_POLICY);
  }
};

export const destroyOverlayRef = (currentOverLay: EOverLayRef): void => {
  if (overlayRef && pluginState.currentOverlayComponent === currentOverLay) {
    overlayRef.detach();
  }
};

const createSelectPolicyTypeComponent = (selectedText: string, style) => {
  destroyOverlayRef(EOverLayRef.ADD_POLICY);
  overlayRef = overlay.create();
  pluginState.currentOverlayComponent = EOverLayRef.ADD_POLICY;
  const componentPortal = new ComponentPortal(SelectPolicyTypePopupComponent);
  const componentRef = overlayRef.attach(componentPortal);
  componentRef.instance.styles = style;
  componentRef.instance.visible = true;
  componentRef.instance.propertyIds = pluginState.propertyIds;
  componentRef.instance.createMessageFrom = pluginState.createMessageFrom;
  componentRef.instance.selectedText = selectedText
    .replace(/\n\n/g, '<br/>')
    .replace(/\n/g, '<br/>');
  componentRef.instance.triggerNextBtn.subscribe(
    (policyData: IPolicyDetail) => {
      createPolicyDetailPanel(selectedText, policyData || null);
    }
  );
  componentRef.instance.visibleChange.subscribe((visible) => {
    if (!visible) {
      destroyOverlayRef(EOverLayRef.ADD_POLICY);
    }
  });
  componentRef.instance.clickAdd.subscribe(() => {
    aiInteractiveBuilderService?.closeAIReplyPopover();
  });
};

export const createPolicyDetailPanel = (
  selectedText: string,
  policyData: IPolicyDetail,
  editMode: boolean = true
) => {
  destroyOverlayRef(EOverLayRef.ADD_POLICY);
  overlayRef = overlay.create();
  pluginState.currentOverlayComponent = EOverLayRef.POLICY_DETAIL;
  const componentPortal = new ComponentPortal(PolicyDetailPanelComponent);
  const componentRef = overlayRef.attach(componentPortal);
  componentRef.instance.visible = true;
  componentRef.instance.editMode = editMode;
  componentRef.instance.openFrom = EPolicyDetailOpenFrom.MESSAGE_MODAL;
  componentRef.instance.manualHighlighText = selectedText
    .replace(/\n\n/g, '<br/>')
    .replace(/\n/g, '<br/>');
  componentRef.instance.policyDefaultValue = policyData;
  componentRef.instance.ngOnChanges({
    policyDefaultValue: {
      currentValue: policyData,
      previousValue: undefined,
      firstChange: true,
      isFirstChange: () => true
    }
  });
  componentRef.instance.closeDrawer.subscribe(() => {
    destroyOverlayRef(EOverLayRef.POLICY_DETAIL);
  });
};

const hidePopoverWhenScroll = () => {
  zoneService.runOutsideAngular(() => {
    const sendMsgScroll = Array.from(
      document.getElementsByClassName('trudi-send-msg-body')
    );
    const sendBulkMsgScroll = Array.from(
      document.getElementsByClassName('text-attachments')
    );
    const taskEditorScroll = Array.from(
      document.getElementsByClassName('ant-drawer-body')
    ).filter(
      (element) => element.querySelector('.communication-form-wrapper') !== null
    );

    const scrollElements = [
      ...sendMsgScroll,
      ...sendBulkMsgScroll,
      ...taskEditorScroll
    ];
    if (!scrollElements?.length) return;
    scrollElements[0].addEventListener('scroll', () => {
      destroyOverlayRef(EOverLayRef.ADD_POLICY);
    });
  });
};

const getCurrentCompany = () => {
  const company = companyServices
    .getCompaniesValue()
    ?.find((company) => company?.id === localStorage.getItem('companyId'));
  pluginState.crmSystem = company?.crmSystem;
};

export default () => {
  tinymce.PluginManager.add('buildCustomSelection', (editor) => {
    getCurrentCompany();
    if (
      router.url.includes('console-settings') ||
      !aiService.hasPermissionToEdit ||
      !pluginState.showAddPolicyPopover
    )
      return null;
    hidePopoverWhenScroll();
    editor.on('mousedown', () => {
      pluginState.isSelecting = true;
      editor.selection.collapse();
    });

    editor.on('mouseup', () => {
      if (pluginState.isSelecting) {
        pluginState.isSelecting = false;
        showPopupAddPolicy(editor);
      }
    });
    editor.on('SelectionChange', () => {
      const selectedText = editor.selection?.getContent({
        format: 'text'
      });
      // check if user delete selection should hidden popover
      if (!selectedText) destroyOverlayRef(EOverLayRef.ADD_POLICY);
    });
    editor.on('keydown', (e) => {
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        showPopupAddPolicy(editor);
      }
    });
    editor.on('init', () => {
      editor.getWin().addEventListener('scroll', () => {
        destroyOverlayRef(EOverLayRef.ADD_POLICY);
      });
    });
    return {};
  });
};
