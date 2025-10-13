export function getStyles(): string {
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