import type { LJStateMachine } from "../../../types/fsm";
import { getRejectedCallText, getStateErrorFocus, type StateErrorFocus } from "../../diagram-focus";
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
    const receiver = focus.receiver ? `<code>${escapeHtml(focus.receiver)}</code>` : 'the receiver';
    const parts = [
        `${call ? `<code>${escapeHtml(call)}</code>` : 'The call'} is rejected`
            + (focus.invalidStates.length > 0 ? ` when ${receiver} is ${renderStates(focus.invalidStates)}` : ''),
        focus.validStates.length > 0 ? `allowed when ${renderStates(focus.validStates)}` : '',
    ];
    return /*html*/`
        <div class="diagram-error-summary">
            <p class="diagram-error-text">${parts.filter(Boolean).join(' \u00B7 ')}</p>
            <button id="diagram-focus-btn" class="diagram-focus-btn" type="button">
                ${focusOnError ? 'Show all' : 'Focus on error'}
            </button>
        </div>
    `;
}

function renderStates(states: string[]): string {
    return states.map(state => `<code>${escapeHtml(state)}</code>`).join(' or ');
}
