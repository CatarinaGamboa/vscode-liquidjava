import type { LJStateMachine } from "../../../types/fsm";
import {
    FOUND_STATE_ICON, REJECTED_CALL_ICON, REQUIRED_STATE_ICON, UNKNOWN_FOUND_STATE_TEXT, getRejectedCallText, getStateErrorFocus, type StateErrorFocus,
} from "../../diagram-focus";
import { renderHighlightedInlineExpression } from "../../highlighting";
import { renderCodiconButton } from "../../icons";
import { escapeHtml } from "../../utils";
import { renderMainHeader } from "../sections";

export function renderStateMachineView(root: HTMLElement, sm: LJStateMachine | undefined, diagram: string, orientation: "LR" | "TB", showConditions: boolean, focusOnError = false) {
    const previousDiagramContainer = root.querySelector('.diagram-container') as HTMLElement | null;
    const diagramHeight = previousDiagramContainer?.offsetHeight;
    root.innerHTML = renderStateMachineViewHtml(sm, diagram, orientation, showConditions, focusOnError, diagramHeight);
}

function renderStateMachineViewHtml(sm: LJStateMachine | undefined, diagram: string, orientation: "LR" | "TB", showConditions: boolean, focusOnError: boolean, diagramHeight?: number): string {
    const errorFocus = getStateErrorFocus(sm);
    const hasConditionExpansions = sm
        ? sm.initialTransitions.some(transition => !!transition.toCondition)
            || sm.transitions.some(transition => !!transition.fromCondition || !!transition.toCondition)
        : false;
    const conditionToggleLabel = !hasConditionExpansions
        ? 'No additional conditions to expand'
        : showConditions ? 'Collapse Conditions' : 'Expand Conditions';

    return /*html*/`
        <div>
            ${renderMainHeader("", 'fsm')}
            ${sm ? /*html*/`
                <div class="diagram-section">
                    <div class="diagram-container"${diagramHeight ? ` style="min-height: ${diagramHeight}px"` : ''}>
                        <div class="diagram-header">
                            <h2 class="diagram-title">${escapeHtml(sm.className)}</h2>
                            <div class="diagram-controls">
                                ${renderCodiconButton("zoom-in", { id: "zoom-in-btn", className: "diagram-control-btn", title: "Zoom In" })}
                                ${renderCodiconButton("zoom-out", { id: "zoom-out-btn", className: "diagram-control-btn", title: "Zoom Out" })}
                                ${renderCodiconButton("screen-normal", { id: "zoom-reset-btn", className: "diagram-control-btn", title: "Reset Zoom" })}
                                ${renderCodiconButton(orientation === "TB" ? "arrow-down" : "arrow-right", { id: "diagram-orientation-btn", className: "diagram-control-btn", title: "Toggle Orientation" })}
                                ${renderCodiconButton(showConditions ? "collapse-all" : "expand-all", { id: "diagram-conditions-btn", className: `diagram-control-btn${showConditions ? ' active' : ''}`, title: conditionToggleLabel, attributes: `aria-pressed="${showConditions ? 'true' : 'false'}"`, disabled: !hasConditionExpansions, errorBadge: hasConditionExpansions && !showConditions })}
                                ${renderCodiconButton("copy", { id: "copy-diagram-btn", className: "diagram-control-btn", title: "Copy Mermaid Source" })}
                            </div>
                        </div>
                        ${errorFocus ? renderStateErrorSummary(errorFocus, focusOnError) : ''}
                        ${showConditions && hasConditionExpansions ? /*html*/`
                            <div class="diagram-condition-legend">
                                <span class="diagram-condition-legend-pre">Precondition</span>
                                <span class="diagram-condition-legend-post">Postcondition</span>
                            </div>
                        ` : ''}
                        <div id="diagram-wrapper" class="diagram-wrapper">
                            <pre class="mermaid">${diagram}</pre>
                        </div>
                    </div>
                </div>`
            : 'No state machine available for the current file'}
        </div>
    `;
}

function renderStateErrorSummary(focus: StateErrorFocus, focusOnError: boolean): string {
    const call = getRejectedCallText(focus);
    const found = focus.foundCondition ?? focus.foundState;
    const foundNote = focus.foundState ? '' : ` (${UNKNOWN_FOUND_STATE_TEXT})`;
    const required = focus.expectedCondition ?? (focus.requiredStates.length > 0 ? focus.requiredStates.join(' || ') : null);
    return /*html*/`
        <div class="diagram-error-summary">
            <ul class="diagram-error-items">
                <li class="diagram-error-call">
                    <span class="diagram-error-icon" aria-hidden="true">${REJECTED_CALL_ICON}</span>
                    <span>Call rejected${call ? /*html*/`: <code>${escapeHtml(call)}</code>` : ''}</span>
                </li>
                <li class="diagram-error-found">
                    <span class="diagram-error-icon" aria-hidden="true">${FOUND_STATE_ICON}</span>
                    <span>Found${found ? /*html*/`: <code>${renderHighlightedInlineExpression(found)}</code>` : ''}${foundNote}</span>
                </li>
                <li class="diagram-error-required">
                    <span class="diagram-error-icon" aria-hidden="true">${REQUIRED_STATE_ICON}</span>
                    <span>Required${required ? /*html*/`: <code>${renderHighlightedInlineExpression(required)}</code>` : ''}</span>
                </li>
            </ul>
            <button id="diagram-focus-btn" class="diagram-focus-btn" type="button">
                ${focusOnError ? 'Show full diagram' : 'Focus on error'}
            </button>
        </div>
    `;
}
