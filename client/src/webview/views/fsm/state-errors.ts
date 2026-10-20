import type { LJDiagnostic, StateRefinementError } from "../../../types/diagnostics";
import type { LJStateMachine } from "../../../types/fsm";
import type { VCImplication } from "../../../types/vc-implications";
import { getDiagnosticRevealTarget, getDiagnosticRevealTargetKey } from "../../diagnostic-reveal";
import { renderHighlightedInlineExpression } from "../../highlighting";
import { renderCodicon } from "../../icons";
import { escapeHtml } from "../../utils";
import { renderLocationLink } from "../sections";

export type StateErrorSummary = {
    call: string | null;
    receiver: string | null;
    found: string;
    required: string;
};

/**
 * Returns the state refinement errors that belong to the given state machine
 * @param diagnostics All diagnostics in the workspace
 * @param sm The displayed state machine
 */
export function getStateMachineErrors(diagnostics: LJDiagnostic[] | undefined, sm: LJStateMachine | undefined): StateRefinementError[] {
    if (!diagnostics || !sm) return [];
    return diagnostics.filter((diagnostic): diagnostic is StateRefinementError =>
        diagnostic.type === 'state-refinement-error' && belongsToStateMachine(diagnostic, sm)
    );
}

// errors are usually reported in the caller file, so they are matched by class instead of file
function belongsToStateMachine(error: StateRefinementError, sm: LJStateMachine): boolean {
    return !!error.stateMachine && error.stateMachine.className === sm.className;
}

export function getStateErrorKey(error: StateRefinementError): string {
    const target = getDiagnosticRevealTarget(error);
    // errors without a position never match the position pattern of reveal keys
    return target ? getDiagnosticRevealTargetKey(target) : `${error.file}#${error.title}#${error.message}`;
}

/**
 * Finds the selected error again after a new verification
 * Since edits can move the error position, falls back to the same file and called method when that call was
 * the only one before and after the verification, so a fixed error never passes its selection to a sibling
 * @param errors The errors of the displayed state machine
 * @param selected The previously selected error
 * @param previousErrors The errors of the displayed state machine before the verification
 */
export function findStateError(errors: StateRefinementError[], selected: StateRefinementError | undefined,
    previousErrors: StateRefinementError[] = []): StateRefinementError | undefined {
    if (!selected) return undefined;
    const key = getStateErrorKey(selected);
    const exact = errors.find(error => getStateErrorKey(error) === key);
    const declarationKey = getDeclarationKey(selected);
    if (exact || !declarationKey) return exact;

    const isSameCall = (error: StateRefinementError) =>
        error.file.toLowerCase() === selected.file.toLowerCase() && getDeclarationKey(error) === declarationKey;
    const candidates = errors.filter(isSameCall);
    const previousCandidates = previousErrors.filter(isSameCall);
    return candidates.length === 1 && previousCandidates.length === 1 ? candidates[0] : undefined;
}

function getDeclarationKey(error: StateRefinementError): string | undefined {
    const position = error.declarationPosition;
    if (!position?.file) return undefined;
    return getDiagnosticRevealTargetKey({ file: position.file, position });
}

/**
 * Summarizes an error with the state machine error context, falling back to the diagnostic text
 * @param error The state refinement error
 */
export function getStateErrorSummary(error: StateRefinementError): StateErrorSummary {
    const context = error.stateMachine?.errorContext;
    const receiver = context?.receiver || null;
    const calledMethod = context?.calledMethod || null;
    const call = calledMethod ? `${receiver ? `${receiver}.` : ''}${calledMethod}()` : null;
    const found = context?.definiteFoundState || context?.foundCondition || formatFound(error.found?.implication);
    const required = context?.expectedStates?.length
        ? context.expectedStates.join(' || ')
        : context?.expectedCondition || error.expected || '';
    return { call, receiver, found, required };
}

function formatFound(implication: VCImplication | null | undefined): string {
    const predicates: string[] = [];
    for (let node = implication; node; node = node.next) {
        if (node.predicate) predicates.push(node.predicate);
    }
    return predicates.join(' && ');
}

/**
 * Renders the list of state errors shown beside the diagram
 * @param errors The errors of the displayed state machine
 * @param selected The selected error, if any
 * @returns The list HTML, or an empty string when there are no errors
 */
export function renderStateErrorList(errors: StateRefinementError[], selected: StateRefinementError | undefined): string {
    if (errors.length === 0) return '';
    const selectedKey = selected ? getStateErrorKey(selected) : undefined;
    const hasSelection = errors.some(error => getStateErrorKey(error) === selectedKey);

    return /*html*/`
        <section class="state-errors" aria-labelledby="state-errors-title">
            <div class="state-errors-header">
                <h3 id="state-errors-title">State Errors <span class="state-errors-count">(${errors.length})</span></h3>
                <button id="state-error-clear-btn" class="underline-button" type="button"${hasSelection ? '' : ' disabled'}>Show general diagram</button>
            </div>
            <ul class="state-error-list">
                ${errors.map(error => renderStateErrorItem(error, getStateErrorKey(error) === selectedKey)).join('')}
            </ul>
        </section>
    `;
}

function renderStateErrorItem(error: StateRefinementError, selected: boolean): string {
    const summary = getStateErrorSummary(error);
    const key = getStateErrorKey(error);
    const position = error.position ? { ...error.position, file: error.position.file || error.file } : undefined;

    return /*html*/`
        <li class="state-error-item error-item${selected ? ' selected' : ''}">
            <button
                class="state-error-select"
                type="button"
                aria-pressed="${selected ? 'true' : 'false'}"
                title="${selected ? 'Show general diagram' : 'Show error on diagram'}"
                data-state-error-key="${escapeHtml(key)}"
            >
                ${renderCodicon(selected ? 'pass-filled' : 'circle-large-outline', 'state-error-marker')}
                <span class="state-error-details">
                    <code class="state-error-call">${escapeHtml(summary.call ?? error.title)}</code>
                    ${summary.receiver ? renderDetail('Receiver', `<code>${escapeHtml(summary.receiver)}</code>`) : ''}
                    ${renderDetail('Found', renderExpression(summary.found))}
                    ${renderDetail('Required', renderExpression(summary.required))}
                </span>
            </button>
            ${position ? `<div class="state-error-location">${renderLocationLink(position)}</div>` : ''}
        </li>
    `;
}

function renderDetail(label: string, value: string): string {
    return /*html*/`<span class="state-error-detail"><span class="state-error-label">${label}:</span> ${value}</span>`;
}

function renderExpression(expression: string): string {
    return `<code class="lj-expression-code">${renderHighlightedInlineExpression(expression)}</code>`;
}

/**
 * Restores keyboard focus on an error after the view is rendered again
 * @param root The webview root element
 * @param key The key of the error to focus
 */
export function focusStateError(root: HTMLElement, key: string) {
    const button = Array.from(root.querySelectorAll<HTMLElement>('.state-error-select'))
        .find(element => element.getAttribute('data-state-error-key') === key);
    button?.focus();
}
