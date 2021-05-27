import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from 'path';
import {Trace} from 'vscode-jsonrpc';
import * as net from 'net';
import * as child_process from "child_process";

import { workspace, Disposable, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, SettingMonitor, StreamInfo, TransportKind  } from 'vscode-languageclient';


import { LiquidJavaProvider } from './liquidJavaProvider';
import { Executable } from 'vscode-languageclient/lib/client';

export function activate(context: vscode.ExtensionContext) {
    const activeTextEditor = vscode.window.activeTextEditor;
    let glob = '**/liquidjava-api*.jar';//or +'/{*.png,*.jpeg}';
    vscode.workspace.findFiles(glob, null, 100).then((uris: vscode.Uri[] ) => { 
        if(uris.length == 0){
            console.log("No references to liquidJava api in workspace");
            vscode.window.showInformationMessage("Not using LiquidJava - Api not in the workspace");
            return; 
        }else{
            vscode.window.showInformationMessage("Found LiquidJava Api in the workspace - Loading Extension");
        }
        uris.forEach((uri: vscode.Uri) => {              
              console.log("Found uri:"+uri);
        });


        let connectionInfo = {
            port: 50000
        };

        let javaExecutablePath = findJavaExecutable('java');
        let args = [
            '-jar',
            path.resolve(context.extensionPath, 'server', 'language-server-liquidjava.jar'),
            "network"
        ]
        let options = { 
            cwd: workspace.rootPath
            // timeout:setTimeout(null, 3000)
        };
        let process = child_process.spawn(javaExecutablePath, args, options);
        console.log("CONNECTED? "+process.connected);

        process.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
          
        process.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
          
        // process.on('close', (code) => {
        //     console.log(`child process exited with code ${code}`);
        //  });

        // process.on('error', (err) => {
        //     console.error('Failed to start subprocess.');
        // }); 

        // process.on('connection', (socket) => {
        //     console.error('On connection');
        //   });


        
        let serverOptions = () => {
            
            // Connect to language server via socket
            let socket = net.connect(connectionInfo);
            let result: StreamInfo = {
                writer: socket,
                reader: socket
            };
            return Promise.resolve(result);
        };

        // Options to control the language client
        let clientOptions: LanguageClientOptions = {
            documentSelector: ['java']
        };
        setTimeout(function () {
            let disposable = new LanguageClient('liquidJavaServer','LiquidJava Server', serverOptions, clientOptions).start();
            console.log("created server");
            // Disposables to remove on deactivation.
            context.subscriptions.push(disposable);
        }, 4000);

    }).then(undefined, console.error);

	//side bar extension - info and vcs
	// const ljProvider = new LiquidJavaProvider(vscode.workspace.rootPath, context);
	// vscode.window.registerTreeDataProvider('liquidJava', ljProvider);
	// vscode.commands.registerCommand('liquidJava.start', () => ljProvider.start());
	
}


// this method is called when your extension is deactivated
export function deactivate() { 
	console.log('Your extension "liquidjava" is now deactivated!');
}


// MIT Licensed code from: https://github.com/georgewfraser/vscode-javac
function findJavaExecutable(binname: string) {
	binname = correctBinname(binname);

	// First search each JAVA_HOME bin folder
	if (process.env['JAVA_HOME']) {
		let workspaces = process.env['JAVA_HOME'].split(path.delimiter);
		for (let i = 0; i < workspaces.length; i++) {
			let binpath = path.join(workspaces[i], 'bin', binname);
			if (fs.existsSync(binpath)) {
				return binpath;
			}
		}
	}

	// Then search PATH parts
	if (process.env['PATH']) {
		let pathparts = process.env['PATH'].split(path.delimiter);
		for (let i = 0; i < pathparts.length; i++) {
			let binpath = path.join(pathparts[i], binname);
			if (fs.existsSync(binpath)) {
				return binpath;
			}
		}
	}

	// Else return the binary name directly (this will likely always fail downstream) 
	return null;
}

function correctBinname(binname: string) {
	if (process.platform === 'win32')
		return binname + '.exe';
	else
		return binname;
}
