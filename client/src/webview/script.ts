import type {
    InvalidRefinementError,
    RefinementError,
    StateConflictError,
    StateRefinementError,
    NotFoundError,
    LJError,
    LJDiagnostic
} from "../types";

export function getScript(vscode: any, document: any, window: any) {
    const root = document.getElementById('root')
    
    function renderError(error: LJError): string {
        const base = `<h3>${error.title}</h3><div class="error-header"><p>${error.message}</p>${error.details ? `<p>${error.details}</p>` : ''}</div>`;
        const location = `<b>Location:</b><pre><a href="#" class="link location-link" data-file="${error.file}" data-line="${error.position.lineStart}" data-column="${error.position.colStart}">${error.file}:${error.position.lineStart}:${error.position.colStart}</a></pre>`;
        
        switch (error.type) {
            case 'illegal-constructor-transition-error': {
                return `${base}${location}`;
            }
            case 'invalid-refinement-error': {
                const e = error as InvalidRefinementError;
                return `${base}<p><b>Refinement:</b><pre>"${e.refinement}"</pre></p>${location}`;
            }
            case 'not-found-error': {
                const e = error as NotFoundError;
                return `<h3>${error.title}</h3><div class="error-header"><p>${e.kind} <b>${e.name}</b> not found</p></div>${location}`;
            }
            case 'refinement-error': {
                const e = error as RefinementError;
                return `${base}<p><b>Expected:</b></p><pre>${e.expected}</pre><p><b>Found:</b></p><pre>${e.found.value}</pre>${location}`;
            }
            case 'state-conflict-error': {
                const e = error as StateConflictError;
                return `${base}<p><b>State:</b></p><pre>${e.state}</pre>${location}`;
            }
            case 'state-refinement-error': {
                const e = error as StateRefinementError;
                return `${base}<p><b>Expected:</b></p><pre>${e.expected}</pre><b>Found:</b></p><pre>${e.found}</pre>${location}`;
            }
            default: {
                return `${base}${location}`;
            }
        }
    }
    
    function getErrorHtml(errors: LJError[]): string {
        return /*html*/`
            <div>
                <h2>Failed Verification</h2>
                <p>${errors.length} error${errors.length > 1 ? 's' : ''} were found by the LiquidJava verifier.</p>
                <div class="content">
                    <ul>
                        ${errors.map(error => /*html*/`
                            <li class="error-item">
                                ${renderError(error)}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    function getOkHtml(): string {
        return /*html*/`
            <div>
                <h2>Passed Verification</h2>
                <p>No errors were found by the LiquidJava verifier.</p>
            </div>
        `;
    }

    root.innerHTML = getOkHtml();
    vscode.postMessage({ type: 'ready' });    
    
    // location link click
    root.addEventListener('click', (e: any) => {
        if (e.target.classList.contains('location-link')) {
            e.preventDefault();
            const filePath = e.target.getAttribute('data-file');
            const line = parseInt(e.target.getAttribute('data-line'));
            const character = parseInt(e.target.getAttribute('data-column'));
            vscode.postMessage({ type: 'openFile', filePath, line, character });
        }
    });
    
    window.addEventListener('message', event => {
        const msg = event.data;
        if (msg.type === 'diagnostics') {
            // TODO: also handle warnings
            const errors = (msg.diagnostics as LJDiagnostic[]).filter((diag: LJDiagnostic) => diag.category === 'error') as LJError[];
            console.log('Received diagnostics!!!!');

            // update ui
            root.innerHTML = errors.length > 0 ? getErrorHtml(errors) : getOkHtml();
        }
    });
}