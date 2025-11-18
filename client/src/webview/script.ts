import type {
    CustomError,
    GhostInvocationError,
    IllegalConstructorTransitionError,
    InvalidRefinementError,
    NotFoundError,
    RefinementError,
    StateConflictError,
    StateRefinementError,
    SyntaxError,
    LJError,
    LJDiagnostic
} from "../types";

export function getScript(vscode: any, document: any, window: any) {
    const root = document.getElementById('root')
    
    function renderError(error: LJError): string {
        const base = `<h3>${error.title}</h3><p>${error.message}</p>`;
        const details = error.details ? `<p>${error.details}</p>` : '';
        const location = `<b>Location:</b><pre><a href="#" class="link location-link" data-file="${error.file}" data-line="${error.position.lineStart}" data-column="${error.position.colStart}">${error.file}:${error.position.lineStart}:${error.position.colStart}</a></pre>`;
        
        switch (error.type) {
            case 'ghost-invocation-error': {
                const e = error as GhostInvocationError;
                return `${base}<p><b>Expected:</b></p><pre>${e.expected}</pre>${details}${location}`;
            }
            case 'illegal-constructor-transition-error': {
                return `${base}${details}${location}`;
            }
            case 'invalid-refinement-error': {
                const e = error as InvalidRefinementError;
                return `${base}<p><b>Refinement:</b> ${e.refinement}</p>${details}${location}`;
            }
            case 'not-found-error': {
                return `${base}${details}${location}`;
            }
            case 'refinement-error': {
                const e = error as RefinementError;
                return `${base}<p><b>Expected:</b></p><pre>${e.expected}</pre>${details}${location}`;
            }
            case 'state-conflict-error': {
                const e = error as StateConflictError;
                return `${base}<p><b>State:</b></p><pre>${e.state}</pre><p><b>Class:</b></p><pre>${e.className}</pre>${details}${location}`;
            }
            case 'state-refinement-error': {
                const e = error as StateRefinementError;
                return `${base}<p><b>Method:</b> <pre>${e.method}</pre><b>Expected:</b></p><pre>${e.expected}</pre><b>Found:</b></p><pre>${e.found}</pre>${location}`;
            }
            default: {
                return `${base}${details}${location}`;
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