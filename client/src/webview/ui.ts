import { DerivationNode, RefinementError, TranslationEntry } from '../types';

export function getHtml(webviewCspSource: string): string {
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
                const webviewScript = ${getScript.toString()};
                webviewScript(vscode, document, window)
            </script>
        </body>
        </html>
    `;
}

function getScript(vscode: any, document: any, window: any) {
    const root = document.getElementById('root')
    let error: RefinementError | null = null;
    let expandedPaths = new Set<string>(); // track which node paths are expanded

    // html template functions
    function renderJsonTree(node: any, path: string = '', expandedPaths: Set<string> = new Set()): string { 
        // var
        if ('var' in node) {
            const { created, file, line, column } = error.translationTable[node.var] || {};
            const filename = file ? file.split('/').pop() : '';
            const tooltipData = `${created} at ${filename}:${line+1}:${column+1}`;
            const fileAttr = file ? `data-filepath="${file}"` : '';
            const lineAttr = line !== undefined ? `data-line="${line}"` : '';
            const charAttr = `data-character="${column}"`;
            return `<span class="json-var json-var-tooltip json-var-clickable" data-tooltip="${tooltipData}" ${fileAttr} ${lineAttr} ${charAttr}>${node.var}</span>`;
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

    function getErrorHtml(): string {
        return /*html*/`
            <div>
                <h2>Failed Verification</h2>
                <p>A refinement error was found by the LiquidJava verifier.</p>
                <div class="content">
                    <h3>${error.kind}</h3>
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

    function getOkHtml(): string {
        return /*html*/`
            <div>
                <h2>Passed Verification</h2>
                <p>No refinement errors were found by the LiquidJava verifier.</p>
            </div>
        `;
    }


    function updateDerivationView() {
        const container = document.getElementById('derivation-container');
        if (container && error.found) { // re-render derivation tree
            const nodeToRender = error.found.origin || error.found;
            container.innerHTML = renderJsonTree(nodeToRender, '', expandedPaths);
        }
        // update reset button state
        document.getElementById('derivation-reset-btn').disabled = expandedPaths.size === 0;
    }

    // attach click event listener to root so when replacing innerHTML we don't lose the listeners
    root.addEventListener('click', e => {
        const target = e.target;
        
        // var node click - open file location
        if (target.classList.contains('json-var')) {
            e.stopPropagation();
            const filePath = target.getAttribute('data-filepath');
            const line = target.getAttribute('data-line');
            const character = target.getAttribute('data-character');
            if (filePath && line !== null && character !== null) {
                vscode.postMessage({
                    type: 'openFile',
                    filePath: filePath,
                    line: parseInt(line),
                    character: parseInt(character)
                });
            }
            return;
        }
        
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
            if (JSON.stringify(error) === JSON.stringify(msg.error)) return; // duplicate error
           
            // store new root derivation node and reset expanded paths
            if (msg.error) {
                error = msg.error;
                expandedPaths.clear();
            }

            // update ui
            root.innerHTML = msg.error !== null ? getErrorHtml() : getOkHtml();
        }
    });
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
        .content h3 {
            margin-top: 0;
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
            overflow: visible;
            position: relative;
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
        .json-var-tooltip:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            padding: 0.5rem;
            background-color: var(--vscode-editorHoverWidget-background);
            border: 1px solid var(--vscode-editorHoverWidget-border);
            color: var(--vscode-editorHoverWidget-foreground);
            border-radius: 4px;
            white-space: nowrap;
            z-index: 1000;
            margin-bottom: 0.25rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            pointer-events: none;
        }
        .json-var-tooltip:hover::before {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-top-color: var(--vscode-editorHoverWidget-border);
            margin-bottom: -0.25rem;
            z-index: 1000;
            pointer-events: none;
        }
        .json-var {
            color: #9CDCFE;
            font-weight: 500;
            position: relative;
            z-index: 1;
        }
        .json-var-clickable {
            cursor: pointer;
        }
        .json-var-clickable:hover {
            text-decoration: underline;
            text-decoration-style: dotted;
            text-underline-offset: 2px;
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