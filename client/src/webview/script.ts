import { LJDiagnostic, LJError } from "../types";

export function getScript(vscode: any, document: any, window: any) {
    const root = document.getElementById('root')
    
    function getErrorHtml(errors: LJError[]): string {
        return /*html*/`
            <div>
                <h2>Failed Verification</h2>
                <p>${errors.length} error${errors.length > 1 ? 's' : ''} were found by the LiquidJava verifier.</p>
                <div class="content">
                    <ul>
                        ${errors.map(error => /*html*/`
                            <li class="error-item">
                                <h3>${error.title}</h3>
                                <p>${error.message}</p>
                                <pre>${error.details}</pre>
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
    window.addEventListener('message', event => {
        const msg = event.data;
        if (msg.type === 'diagnostics') {
            // TODO: also handle warnings
            const errors = (msg.diagnostics as LJDiagnostic[]).filter((diag: LJDiagnostic) => diag.category === 'error') as LJError[];
            console.log('Received diagnostics', msg.diagnostics);
            console.log('Received errors:', errors);

            // update ui
            root.innerHTML = errors.length > 0 ? getErrorHtml(errors) : getOkHtml();
        }
    });
}