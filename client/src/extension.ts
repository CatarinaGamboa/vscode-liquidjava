'use strict';

import * as net from 'net';

import {Trace} from 'vscode-jsonrpc';
import { window, workspace, commands, ExtensionContext, Uri } from 'vscode';
import { LanguageClient, LanguageClientOptions, StreamInfo, Position as LSPosition, Location as LSLocation } from 'vscode-languageclient';
import * as vscode from 'vscode';

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: ExtensionContext) {
    // The server is a started as a separate app and listens on port 1278
    let connectionInfo = {
        port: 1278
    };
    let serverOptions = () => {
        // Connect to language server via socket
        let socket = net.connect(connectionInfo);
        let result: StreamInfo = {
            writer: socket,
            reader: socket
        };
        return Promise.resolve(result);
    };
    
    let clientOptions: LanguageClientOptions = {
        documentSelector: ['java'],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/*.java')
        }
    };
    
    // Create the language client and start the client.
    let lc = new LanguageClient('LiquidJava Server', serverOptions, clientOptions);

    // var disposable2 =commands.registerCommand("adl.a.proxy", async () => {
    //     let activeEditor = window.activeTextEditor;
    //     if (!activeEditor || !activeEditor.document || activeEditor.document.languageId !== 'plaintext') {
    //         return;
    //     }

    //     if (activeEditor.document.uri instanceof Uri) {
    //         commands.executeCommand("adl.a", activeEditor.document.uri.toString());
    //     }
    // })

   // context.subscriptions.push(disposable2);

    // enable tracing (.Off, .Messages, Verbose)
    lc.trace = Trace.Messages;
    let disposable = lc.start();
    
    // Push the disposable to the context's subscriptions so that the 
    // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);


	diagnosticCollection = vscode.languages.createDiagnosticCollection('go');
  	context.subscriptions.push(diagnosticCollection);
}


// function onChange() {
// 	diagnosticCollection.clear();
// 	// let uri = document.uri;
// 	// check(uri.fsPath, goConfig).then(errors => {
// 	//   diagnosticCollection.clear();
// 	//   let diagnosticMap: Map<string, vscode.Diagnostic[]> = new Map();
// 	//   errors.forEach(error => {
// 	// 	let canonicalFile = vscode.Uri.file(error.file).toString();
// 	// 	let range = new vscode.Range(error.line-1, error.startColumn, error.line-1, error.endColumn);
// 	// 	let diagnostics = diagnosticMap.get(canonicalFile);
// 	// 	if (!diagnostics) { diagnostics = []; }
// 	// 	diagnostics.push(new vscode.Diagnostic(range, error.msg, error.severity));
// 	// 	diagnosticMap.set(canonicalFile, diagnostics);
// 	//   });
// 	//   diagnosticMap.forEach((diags, file) => {
// 	// 	diagnosticCollection.set(vscode.Uri.parse(file), diags);
// 	//   });
// 	// })
//   }