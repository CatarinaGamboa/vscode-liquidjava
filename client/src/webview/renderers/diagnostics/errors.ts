import { getExpansions, renderJsonTree, hashError } from "./derivation-nodes";
import { renderHeader, renderLocation, renderSection } from "./utils";
import {
    InvalidRefinementError,
    LJError,
    NotFoundError,
    RefinementError,
    StateConflictError,
    StateRefinementError
} from "../../../types";

export function getErrorsView(errors: LJError[]): string {
    return /*html*/`
        <div>
            <h2>Failed Verification</h2>
            <p>${errors.length} error${errors.length > 1 ? 's were' : ' was'} found by the LiquidJava verifier.</p>
            <div class="content">
                <ul>
                    ${errors.map((error) => /*html*/`
                        <li class="diagnostic-item error-item">
                            ${renderError(error)}
                        </li>
                    `).join("")}
                </ul>
            </div>
        </div>
    `;
}

export function renderError(error: LJError): string {
    const header = renderHeader(error);
    const location = renderLocation(error);
    
    switch (error.type) {
        case 'illegal-constructor-transition-error':
            return `${header}${location}`;
        case 'invalid-refinement-error': {
            const e = error as InvalidRefinementError;
            return `${header}${renderSection('Refinement', `<pre>"${e.refinement}"</pre>`)}${location}`;
        }
        case 'not-found-error': {
            const e = error as NotFoundError;
            const content = `<p>${e.kind} <b>${e.name}</b> not found</p>`;
            return `<h3>${error.title}</h3><div class="diagnostic-header">${content}</div>${location}`;
        }
        case 'refinement-error':
            return renderRefinementError(error as RefinementError, header, location);
        case 'state-conflict-error': {
            const e = error as StateConflictError;
            return `${header}${renderSection('State', `<pre>${e.state}</pre>`)}${location}`;
        }
        case 'state-refinement-error': {
            const e = error as StateRefinementError;
            return `${header}${renderSection('Expected', `<pre>${e.expected}</pre>`)}${renderSection('Found', `<pre>${e.found}</pre>`)}${location}`;
        }
        default:
            return `${header}${location}`;
    }
}

function renderRefinementError(error: RefinementError, base: string, location: string): string {
    const errorId = hashError(error);
    const expandedPaths = getExpansions(errorId);
    const derivationRoot = error.found.origin || error.found;
    const derivationHtml = renderJsonTree(error, derivationRoot, errorId, "root", expandedPaths);
    const resetDisabled = expandedPaths.size === 0 ? "disabled" : "";
    const resetBtn = /*html*/ `
        <button class="reset-btn derivation-reset-btn" data-error-id="${errorId}" ${resetDisabled}>
            Reset
        </button>
    `;
    const derivationContent = /*html*/ `
        <div class="container derivation-container" data-error-id="${errorId}">
            ${derivationHtml}
            <span class="node-expand-indicator">&nbsp;(click to expand)</span>
        </div>
        ${resetBtn}
    `;
    return /*html*/ `
        ${base}
        ${renderSection('Expected', `<pre>${error.expected}</pre>`)}
        ${renderSection('Found', derivationContent)}
        ${location}
    `;
}