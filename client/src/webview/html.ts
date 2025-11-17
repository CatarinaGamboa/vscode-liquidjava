// import { getScript } from "./script";
import { getStyles } from "./styles";

export function getHtml(webviewCspSource: string): string {
    const nonce = Date.now().toString();
    // TODO: uncomment
    return '';
    // return /*html*/ `
    //     <!DOCTYPE html>
    //     <html>
    //     <head>
    //         <meta charset="utf-8">
    //         <meta
    //             http-equiv="Content-Security-Policy"
    //             content="default-src 'none'; style-src ${webviewCspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';"
    //         >
    //         <style>${getStyles()}</style>
    //     </head>
    //     <body>
    //         <div id="root"></div>
    //         <script nonce="${nonce}">
    //             const vscode = acquireVsCodeApi();
    //             const webviewScript = ${getScript.toString()};
    //             webviewScript(vscode, document, window)
    //         </script>
    //     </body>
    //     </html>
    // `;
}