import type { LJError, LJDiagnostic } from "../types";
import { handleDerivableNodeClick, handleDerivationResetClick } from "./renderers/derivation-nodes";
import { getCorrectView } from "./renderers/correct";
import { getErrorsView } from "./renderers/errors";
import { getLoadingView } from "./renderers/loading";

export function getScript(vscode: any, document: any, window: any) {
    const root = document.getElementById('root');
    let currentErrors: LJError[] = [];

    // initial state
    root.innerHTML = getLoadingView();
    vscode.postMessage({ type: 'ready' });    
    
    // on click
    root.addEventListener('click', (e: any) => {
        const target = e.target as any;
        if (!target) return;

        // location link or variable click
        if (target.classList.contains('location-link') || target.classList.contains('node-var')) {
            e.preventDefault();
            e.stopPropagation();

            const filePath = target.getAttribute('data-file');
            const lineAttr = target.getAttribute('data-line');
            const columnAttr = target.getAttribute('data-column');
            if (filePath && lineAttr !== null && columnAttr !== null) {
                vscode.postMessage({
                    type: 'openFile',
                    filePath,
                    line: parseInt(lineAttr, 10),
                    character: parseInt(columnAttr, 10)
                });
            }
            return;
        }

        // derivation expansion click
        if (target.classList.contains('derivable-node')) {
            e.stopPropagation();
            if (handleDerivableNodeClick(target)) {
                root.innerHTML = getErrorsView(currentErrors);
            }
            return;
        }

        // derivation reset button
        if (target.classList.contains('derivation-reset-btn')) {
            e.stopPropagation();
            if (handleDerivationResetClick(target)) {
                root.innerHTML = getErrorsView(currentErrors);
            }
        }
    });
    
    window.addEventListener('message', event => {
        const msg = event.data;
        if (msg.type === 'diagnostics') {
            // TODO: also handle warnings
            const errors = (msg.diagnostics as LJDiagnostic[]).filter((diag: LJDiagnostic) => diag.category === 'error') as LJError[];
            currentErrors = errors;

            // update view
            root.innerHTML = errors.length > 0 ? getErrorsView(errors) : getCorrectView();
        }
    });
}