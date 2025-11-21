import { getScript } from "./script";

// Entry point for the webview

declare function acquireVsCodeApi(): any;
declare const document: any;
declare const window: any;

const vscode = acquireVsCodeApi();
getScript(vscode, document, window);
