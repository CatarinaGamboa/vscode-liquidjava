import {
    InvalidRefinementError,
    LJError,
    NotFoundError,
    RefinementError,
    StateConflictError,
    StateRefinementError
} from "../../types";
import { getExpansions, renderJsonTree, hashError } from "./derivation-nodes";

const renderSection = (title: string, body: string): string =>
    `<div class="section"><strong>${title}:</strong><div>${body}</div></div>`;

const renderHeader = (error: LJError): string => {
    const details = error.details ? `<p>${error.details}</p>` : "";
    return `<h3>${error.title}</h3><div class="error-header"><p>${error.message}</p>${details}</div>`;
};

const renderLocation = (error: LJError): string => {
    const line = error.position?.lineStart ?? 0;
    const column = error.position?.colStart ?? 0;
    const simpleFile = error.file.split('/').pop() || error.file;
    const link = `<a href="#" class="link location-link" data-file="${error.file}" data-line="${line}" data-column="${column}">${simpleFile}:${line}</a>`;
    return renderSection("Location", `<pre>${link}</pre>`);
};

export function getErrorsView(errors: LJError[]): string {
    return /*html*/`
        <div>
            <h2>Failed Verification</h2>
            <p>${errors.length} error${errors.length > 1 ? 's' : ''} were found by the LiquidJava verifier.</p>
            <div class="content">
                <ul>
                    ${errors.map((error) => /*html*/`
                        <li class="error-item">
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
            return `<h3>${error.title}</h3><div class="error-header">${content}</div>${location}`;
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

function renderRefinementError(
    error: RefinementError,
    base: string,
    location: string
): string {
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