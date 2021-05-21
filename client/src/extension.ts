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

        //Start server only if api is inside the project

        //#1
        const { JAVA_HOME } = process.env;
        const main: string = 'Main';
        console.log(`Using java from JAVA_HOME: ${JAVA_HOME}`);
        if (JAVA_HOME) {
            // Java execution path.
            let executable: string = path.join(JAVA_HOME,'java');

            // C:\Program Files\Java\jdk1.8.0_231\bin\bin\java
    
            // path to the launcher.jar
            let classPath = path.join(__dirname, '..', 'server', 'language-server-liquidjava.jar');
            const args: string[] = ['-cp', classPath];
    
            // Set the server options 
            // -- java execution path
            // -- argument to be pass when executing the java command
            let serverOptions: ServerOptions = {
                command: executable,
                args: [...args, main],
                options: {}
            };
    
            // Options to control the language client
            let clientOptions: LanguageClientOptions = {
                documentSelector: ['java'],
                synchronize: {
                    fileEvents: workspace.createFileSystemWatcher('**/*.java')
                }
            };
    
            // Create the language client and start the client.
            let disposable = new LanguageClient('LiquidJava Server', serverOptions, clientOptions).start();
    
            // Disposables to remove on deactivation.
            context.subscriptions.push(disposable);
        }


        //#2
        // let javaExecutablePath = findJavaExecutable('java');
        // //// let serverCommand = javaExecutablePath + " -jar ";
        // let extensionDir =  __dirname;//context.extensionPath;
        // let classPath = path.join(extensionDir, '..', 'server', 'language-server-liquidjava.jar');
        // const args: string[] = ['-cp', classPath];
        // const main: string = 'Main';

        // let debugOptions = { execArgv: ["--nolazy", "--debug=6009"] };

        // let serverOptions:ServerOptions = {
        //     command: javaExecutablePath, 
        //     args: [...args, main],
        //     transport: TransportKind.ipc
        // };
        // console.log(serverOptions);

      

        // let clientOptions: LanguageClientOptions = {
        //     documentSelector: ['java'],
        //     synchronize: {
        //         fileEvents: workspace.createFileSystemWatcher('**/*.java')
        //     }
        // };

        //  // Create the language client and start the client.
        // let lc = new LanguageClient('LiquidJava Server', serverOptions, clientOptions);

        // lc.trace = Trace.Verbose;
        
        // let disposable = lc.start();
        
        // // Push the disposable to the context's subscriptions so that the 
        // // client can be deactivated on extension deactivation
        // context.subscriptions.push(disposable);
        

    });

	//side bar extension - info and vcs
	// const ljProvider = new LiquidJavaProvider(vscode.workspace.rootPath, context);
	// vscode.window.registerTreeDataProvider('liquidJava', ljProvider);
	// vscode.commands.registerCommand('liquidJava.start', () => ljProvider.start());
	
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


