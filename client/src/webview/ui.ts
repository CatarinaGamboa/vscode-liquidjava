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
                let rootDerivationNode = null;
                let expandedPaths = new Set(); // track which node paths are expanded

                // html template functions
                const getErrorHtml = ${getErrorHtml.toString()};
                const getOkHtml = ${getOkHtml.toString()};
                const renderJsonTree = ${renderJsonTree.toString()};

                function updateDerivationView() {
                    const container = document.getElementById('derivation-container');
                    if (container && rootDerivationNode) { // re-render derivation tree
                        const nodeToRender = rootDerivationNode.origin || rootDerivationNode;
                        container.innerHTML = renderJsonTree(nodeToRender, '', expandedPaths);
                    }
                    // update reset button state
                    document.getElementById('derivation-reset-btn').disabled = expandedPaths.size === 0;
                }

                // attach click event listener to root so when replacing innerHTML we don't lose the listeners
                root.addEventListener('click', e => {
                    const target = e.target;
                    
                    // derivation node click
                    if (target.classList.contains('derivation-clickable')) {
                        e.stopPropagation();
                        const nodePath = target.getAttribute('data-node-path');
                        if (nodePath) {
                            expandedPaths.add(nodePath);
                            updateDerivationView();
                        }
                    }
                    
                    // reset button click
                    if (target.id === 'derivation-reset-btn') {
                        expandedPaths.clear();
                        updateDerivationView();
                    }

                    // location link click
                    if (target.id === 'location-link') {
                        e.preventDefault();
                        vscode.postMessage({
                            type: 'openFile',
                            filePath: target.getAttribute('data-filepath'),
                            line: parseInt(target.getAttribute('data-line')),
                            character: parseInt(target.getAttribute('data-character'))
                        });
                    }
                });

                root.innerHTML = getOkHtml();
                vscode.postMessage({ type: 'ready' });    
                window.addEventListener('message', event => {
                    const msg = event.data;
                    if (msg.type === 'refinement-error') {
                        const errorId = JSON.stringify(msg.error);
                        if (currentErrorId === errorId) return; // duplicate error
                        currentErrorId = errorId;

                        // store new root derivation node and reset expanded paths
                        if (msg.error) {
                            rootDerivationNode = msg.error.found;
                            expandedPaths.clear();
                        }

                        // update ui
                        root.innerHTML = msg.error !== null ? getErrorHtml(msg.error) : getOkHtml();
                    }
                });
            </script>
        </body>
        </html>
    `;
}

function getErrorHtml(error: RefinementError): string {
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
                    <div class="json-container" id="derivation-container">
                        ${renderJsonTree(error.found.origin || error.found, '', new Set())}
                        <span class="json-expand-indicator">&nbsp;(click to expand)</span>
                    </div>
                    <button id="derivation-reset-btn" class="reset-btn" disabled="true">Reset</button>
                </div>
                <div class="section">
                    <strong>Location:</strong> 
                        <a
                        href="#" 
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

function renderJsonTree(node: DerivationNode, path: string = '', expandedPaths: Set<string> = new Set()): string { 
    // var
    if ('var' in node) {
        return `<span class="json-var">${node.var}</span>`;
    }
    
    // val
    if ('val' in node) {
        const hasOrigin = node.origin !== undefined;
        const isExpanded = expandedPaths.has(path);
        const valClass = typeof node.val === 'number' ? 'json-number' : 'json-value';
        
        // if expanded and has origin, render the origin instead
        if (isExpanded && hasOrigin) {
            return renderJsonTree(node.origin, path, expandedPaths);
        }
        // otherwise render the value (clickable if it has origin)
        const clickableClass = hasOrigin ? 'derivation-clickable' : '';
        const pathAttr = hasOrigin ? `data-node-path='${path}'` : '';
        return `<span class="${valClass} ${clickableClass}" ${pathAttr}>${node.val}</span>`;
    }
    
    // binary
    if ('left' in node && 'right' in node) {
        const leftHtml = renderJsonTree(node.left, path + '.left', expandedPaths);
        const rightHtml = renderJsonTree(node.right, path + '.right', expandedPaths);
        return `${leftHtml} ${node.op} ${rightHtml}`;
    }
    
    // unary
    if ('operand' in node) {
        const operandHtml = renderJsonTree(node.operand, path + '.operand', expandedPaths);
        return node.op === '-' ? `(${node.op}${operandHtml})` : `${node.op}${operandHtml}`;
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
            padding: 1rem;
            line-height: 1.6;
        }
        .reset-btn {
            margin: 0.5rem 0;
            padding: 0.4rem 0.8rem;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }
        .reset-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .reset-btn:disabled {
            opacity: 0.5;
        }
        .json-var {
            color: #9CDCFE;
            font-weight: 500;
        }
        .json-value {
            color: #CE9178;
        }
        .json-number {
            color: #B5CEA8;
        }
        .derivation-clickable {
            cursor: pointer;
            text-decoration: underline;
            text-decoration-style: dotted;
            text-underline-offset: 2px;
        }
        .derivation-clickable:hover {
            opacity: 0.8;
            background-color: var(--vscode-editor-selectionBackground);
            border-radius: 2px;
        }
        .json-expand-indicator {
            opacity: 0.5;
            font-style: italic;
        }
    `;
}