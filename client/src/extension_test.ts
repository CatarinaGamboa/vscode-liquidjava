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
    const glob = '**/liquidjava-api*.jar';//or +'/{*.png,*.jpeg}';
    vscode.workspace.findFiles(glob, null, 100).then((uris: vscode.Uri[] ) => { 
        if(uris.length == 0){
            console.log("No references to liquidJava api in workspace");
            vscode.window.showInformationMessage("Not using LiquidJava - Api not in the workspace");
            return; 
        }else{
            vscode.window.showInformationMessage("Found LiquidJava Api in the workspace - Loading Extension...");
        }
        uris.forEach((uri: vscode.Uri) => {              
              console.log("Found uri:"+uri);
        });


        
        // var port;
        // var server = net.createServer( function (sock) {
        // });
        // server.listen(0,function() { //'listening' listener 
        //     var port = this.address().port;
        //     console.log('server bound:'+port);
        // });

        const ports = ["50000", "50101", "50202", "50303", "50404"];
        const random = Math.floor(Math.random() * ports.length);

        const chosenPort = ports[random];
        console.log("Port:" + chosenPort);

        const connectionInfo = {
            port: parseInt(chosenPort)
        };

        const  javaExecutablePath = findJavaExecutable('java');
        const args = [
            '-jar',
            path.resolve(context.extensionPath, 'server', 'vscode-liquid-java-server-0.0.2-SNAPSHOT-jar-with-dependencies.jar'),
            chosenPort
        ];
        const options = { 
            cwd: workspace.rootPath
            // timeout:setTimeout(null, 3000)
        };
        const process = child_process.spawn(javaExecutablePath, args, options);
        
        let first = true;
        let firstVerification = true;
        process.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            let st = data.toString();
            st = st.substring(0, 5);

            if(st == "Ready" && first){
                console.log("Server is ON! Starting Client!");

                const serverOptions = () => {
                    // Connect to language server via socket
                    const socket = net.connect(connectionInfo);
                    const result: StreamInfo = {
                        writer: socket,
                        reader: socket
                    };
                    return Promise.resolve(result);
                };
        
                // Options to control the language client
                const clientOptions: LanguageClientOptions = {
                    documentSelector: ['java']
                };
                const disposable = new LanguageClient('liquidJavaServer','LiquidJava Server', serverOptions, clientOptions).start();
                console.log("Created LanguageClient");
                // Disposables to remove on deactivation.
                context.subscriptions.push(disposable);
                
                first = !first;
            }

            let onVerification = data.toString();
            onVerification = onVerification.substring(0,14);
            if(onVerification == "OnVerification" && firstVerification){
                vscode.window.showInformationMessage("LiquidJava Extension is ON! Enjoy!");
                firstVerification = !firstVerification;
            }

        });
          
        process.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

          
        process.on('close', (code) => {
            console.log(`Child process exited with code ${code}`);
         });

        process.on('error', (err) => {
            console.error('Failed to start subprocess.');
        }); 

        process.on('connection', (socket) => {
            console.error('On connection');
          });


        
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
		const workspaces = process.env['JAVA_HOME'].split(path.delimiter);
		for (let i = 0; i < workspaces.length; i++) {
			const binpath = path.join(workspaces[i], 'bin', binname);
			if (fs.existsSync(binpath)) {
				return binpath;
			}
		}
	}

	// Then search PATH parts
	if (process.env['PATH']) {
		const pathparts = process.env['PATH'].split(path.delimiter);
		for (let i = 0; i < pathparts.length; i++) {
			const binpath = path.join(pathparts[i], binname);
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
