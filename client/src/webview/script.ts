import { RefinementError } from "../types";

export function getScript(vscode: any, document: any, window: any) {
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
            return `<span class="node-var tooltip clickable" data-tooltip="${tooltipData}" ${fileAttr} ${lineAttr} ${charAttr}>${node.var}</span>`;
        }
        
        // val
        if ('val' in node) {
            const hasOrigin = node.origin !== undefined;
            const isExpanded = expandedPaths.has(path);
            const valClass = typeof node.val === 'number' ? 'node-number' : 'node-value';
            
            // if expanded and has origin, render the origin instead
            if (isExpanded && hasOrigin) {
                return renderJsonTree(node.origin, path, expandedPaths);
            }
            // otherwise render the value (clickable if it has origin)
            const clickableClass = hasOrigin ? 'derivable-node clickable' : '';
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

        // fallback
        return `<span class="node-value">${JSON.stringify(node)}</span>`;
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
                        <pre><span class="node-value">${error.expected}</span></pre>
                    </div>
                    <div class="section">
                        <strong>Found:</strong>
                        <div class="node-container" id="derivation-container">
                            ${renderJsonTree(error.found.origin || error.found, '', new Set())}
                            <span class="node-expand-indicator">&nbsp;(click to expand)</span>
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
        if (target.classList.contains('node-var')) {
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
        if (target.classList.contains('derivable-node')) {
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