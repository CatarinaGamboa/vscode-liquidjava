import { DerivationNode, RefinementError } from '../types';

export function getWebviewHtml(webviewCspSource: string): string {
    const nonce = Date.now().toString();
    return /*html*/ `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta
                http-equiv="Content-Security-Policy"
                content="default-src 'none'; style-src ${webviewCspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';"
            >
            <style>${getStyles()}</style>
        </head>
        <body>
            <div id="root"></div>
            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                const root = document.getElementById('root')
                let currentErrorId = null;

                // html template functions
                const getErrorHtml = ${getErrorHtml.toString()};
                const getOkHtml = ${getOkHtml.toString()};
                const renderJsonTree = ${renderJsonTree.toString()};

                root.innerHTML = getOkHtml();
                vscode.postMessage({ type: 'ready' });    
                window.addEventListener('message', event => {
                    const msg = event.data;
                    if (msg.type === 'refinement-error') {
                        const errorId = JSON.stringify(msg.error);
                        if (currentErrorId === errorId) return; // duplicate error
                        currentErrorId = errorId;

                        // update ui
                        root.innerHTML = msg.error !== null ? getErrorHtml(msg.error) : getOkHtml();

                        // event listener for clicking the location link
                        const link = document.getElementById('location-link')
                        link?.addEventListener('click', e => {
                            e.preventDefault();
                            vscode.postMessage({
                                type: 'openFile',
                                filePath: link.getAttribute('data-filepath'),
                                line: parseInt(link.getAttribute('data-line')),
                                character: parseInt(link.getAttribute('data-character'))
                            });
                        });
                        
                        // event listeners for toggling json nodes
                        document.querySelectorAll('.json-toggle').forEach(toggle => {
                            toggle.addEventListener('click', e => {
                                const container = e.target.parentElement.nextElementSibling;
                                if (container && container.classList.contains('json-node')) {
                                    const isCollapsed = container.classList.contains('json-collapsed');
                                    container.classList.toggle('json-collapsed');
                                    e.target.textContent = isCollapsed ? '▼' : '▶';
                                }
                            });
                        });
                    }
                });
            </script>
        </body>
        </html>
    `;
}

function getErrorHtml(error: RefinementError): string {
    const foundHtml = typeof error.found === 'string' 
        ? `<pre>${error.found}</pre>`
        : `<div class="json-container">${renderJsonTree(error.found)}</div>`;
    
    return /*html*/`
        <div>
            <h2>Refinement Type Error</h2>
            <p>A refinement error was found by the LiquidJava verifier.</p>
            <div class="content">
                <div class="section">      
                    <strong>Expected:</strong>
                    <pre><span class="json-value">${error.expected}</span></pre>
                </div>
                <div class="section">
                    <strong>Found:</strong>
                    ${foundHtml}
                </div>
                <div class="section">
                    <strong>Location:</strong> 
                   
                        <a href="#" 
                        id="location-link"
                        class="link"
                        data-filepath="${error.file}"
                        data-line="${error.range[0].line}"
                        data-character="${error.range[0].character}">
                            ${error.file}:${error.range[0].line + 1}
                        </a>
                   
                </div>
            </div>
           
        </div>
    `;
}

function renderJsonTree(node: DerivationNode, indent: number = 0): string { 
    // var
    if ('var' in node) {
        return `<div class="json-line"><span class="json-var">${node.var}</span></div>`;
    }
    
    // val
    if ('val' in node) {
        return `<div>
            <div class="json-line">
                <span class="json-toggle" style="${node.origin ? '' : 'visibility: hidden;'}">▶</span>
                <span
                    class="${typeof node.val === 'number' ? 'json-number' : 'json-value'}"
                >${node.val}</span><span class="json-node-type">${node.type ? `&nbsp;(${node.type})` : ''}</span>
            </div>
            ${node.origin ? `<div class="json-node json-collapsed">
                <div class="json-line"></div>${renderJsonTree(node.origin, indent + 1)}
            </div>` : ''}
        </div>`;
    }
    
    // binary
    if ('left' in node && 'right' in node) {
        return `<div>
            <div class="json-line">
                <span class="json-toggle">▶</span>
                ${node.op}
            </div>
            <div class="json-node json-collapsed">
                ${renderJsonTree(node.left, indent + 1)}
                ${renderJsonTree(node.right, indent + 1)}
            </div>
        </div>`;
    }
    
    // unary
    if ('operand' in node) {
        return `<div>
            <div class="json-line">
                <span class="json-toggle">▶</span>
                ${node.op}
            </div>
            <div class="json-node json-collapsed">
                ${renderJsonTree(node.operand, indent + 1)}
            </div>
        </div>`;
    }
    
    return `<span class="json-value">${JSON.stringify(node)}</span>`;
}


function getOkHtml(): string {
    return /*html*/`
        <div>
            <h2>Passed Verification</h2>
            <p>No refinement errors were found by the LiquidJava verifier.</p>
        </div>
    `;
}

function getStyles(): string {
    return /*css*/`
        body {
            padding: 1rem;
            font-family: var(--vscode-font-family);
        }
        h2 {
            font-weight: bold;
            margin: 0 0 1rem 0;
        }
        strong {
            display: block;
            margin-bottom: 0.5rem;
        }
        pre, .json-container, #location-link {
            margin: 0;
            padding: 0.5rem;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
            overflow-x: auto;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
        }
        .content {
            background-color: var(--vscode-textBlockQuote-background);
            padding: 1rem;
            border-left: 4px solid var(--vscode-errorForeground);
            margin-bottom: 1rem;
            border-radius: 4px;
        }
        .section {
            margin-bottom: 1rem;
        }
        .section:last-child {
            margin-bottom: 0;
        }
        .link {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
            cursor: pointer;
            word-break: break-word;
            display: inline-block;
            max-width: 100%;
        }
        .json-container {
            max-width: 100%;
        }
        .json-node {
            padding-left: 2ch;
        }
        .json-var {
            color: #9CDCFE;
        }
        .json-value {
            color: #CE9178;
        }
        .json-number {
            color: #B5CEA8;
        }
        .json-toggle {
            cursor: pointer;
            user-select: none;
            display: inline-block;
            min-width: 1rem;
            width: 1rem;
            color: var(--vscode-foreground);
            flex-shrink: 0;
        }
        .json-toggle:hover {
            opacity: 0.7;
        }
        .json-line {
            display: flex;
            align-items: baseline;
        }
        .json-collapsed {
            display: none;
        }
        .json-node-type {
            opacity: 0.6;
        }
    `;
}