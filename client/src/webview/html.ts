import * as vscode from "vscode";
import { getStyles } from "./styles";

export function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const nonce = Date.now().toString();
    const cspSource = webview.cspSource;
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "webview.js"));
    return /*html*/ `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta
                http-equiv="Content-Security-Policy"
                content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';"
            >
            <style>${getStyles()}</style>
        </head>
        <body>
            <div id="root"></div>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>
    `;
}
