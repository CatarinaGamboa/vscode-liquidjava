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
            vscode.window.showInformationMessage("Found LiquidJava Api in the workspace - Loading Extension");
        }
        uris.forEach((uri: vscode.Uri) => {              
              console.log("Found uri:"+uri);
        });

        //Start server only if api is inside the project

        //#1
        const { JAVA_HOME } = process.env;
        const main = 'App';
        console.log(`Using java from JAVA_HOME: ${JAVA_HOME}`);
        if (JAVA_HOME) {
            // Java execution path.
            const executable: string = path.join(JAVA_HOME,'bin', 'java');

            // C:\Program Files\Java\jdk1.8.0_231\bin\bin\java
    
            // path to the launcher.jar
            const classPath = path.join(__dirname, 'server', 'language-server-liquidjava.jar');
            const args: string[] = ['-cp', classPath];
    
            // Set the server options 
            // -- java execution path
            // -- argument to be pass when executing the java command
            const serverOptions: ServerOptions = {
                command: executable,
                args: [...args, main],
                options: {}
            };
    
            // Options to control the language client
            const clientOptions: LanguageClientOptions = {
                documentSelector: ['java']//,
                // synchronize: {
                //     fileEvents: workspace.createFileSystemWatcher('**/*.java')
                // }
            };
    
            // Create the language client and start the client.
            const disposable = new LanguageClient('LiquidJava Server','LiquidJava Server', serverOptions, clientOptions).start();
    
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
			if (fs.existsSync(binpath)) 
				return binpath;
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






















// import * as vscode from 'vscode';
// import * as fs from "fs";
// import * as path from 'path';
// import {Trace} from 'vscode-jsonrpc';
// import * as net from 'net';
// import * as child_process from "child_process";

// import { workspace, Disposable, ExtensionContext } from 'vscode';
// import { LanguageClient, LanguageClientOptions, SettingMonitor, StreamInfo } from 'vscode-languageclient';

// import { LiquidJavaProvider } from './liquidJavaProvider';

// export function activate(context: vscode.ExtensionContext) {

// 	// The server is a started as a separate app and listens on port 1278
// 	let serverOptions;
//     if(process.arch != 'x32' && process.arch != 'x64') {
//         throw 'unsupported CPU, this extension only runs on windows, macos or linux on x86 CPUs: ' + process.arch
//     }
// 	serverOptions = {
// 		run: {
// 			command: path.join(context.extensionPath, '..', 'server', 'build', 'libs', 'language-server-liquidjava.jar')
// 		},
// 		debug: {
// 			command: path.join(context.extensionPath , '..', 'server', 'build', 'libs', 'language-server-liquidjava.jar')
// 		}
// 	};

//     // else if(process.platform == 'darwin') {
//     //     serverOptions = {
//     //         run: {
//     //             command: path.join(context.extensionPath , 'lsp-images', 'archie-lsp-macos', 'bin', 'archie-lsp')
//     //         },
//     //         debug: {
//     //             command: path.join(context.extensionPath , 'lsp-images', 'archie-lsp-macos', 'bin', 'archie-lsp')
//     //         }
//     //     };
//     // } else if (process.platform == 'linux') {
//     //     serverOptions = {
//     //         run: {
//     //             command: path.join(context.extensionPath , 'lsp-images', 'archie-lsp-linux-x64', 'bin', 'archie-lsp')
//     //         },
//     //         debug: {
//     //             command: path.join(context.extensionPath , 'lsp-images', 'archie-lsp-linux-x64', 'bin', 'archie-lsp')
//     //         }
//     //     };
//     // } else {
//     //     throw 'unsupported platform, this extension only runs on windows, macos or linux on x86 CPUs: ' + process.platform
//     // }
    
//     let clientOptions: LanguageClientOptions = {
//         documentSelector: ['java'],
//         synchronize: {
//             fileEvents: workspace.createFileSystemWatcher('**/*.java')
//         }
//     };
    
//     // Create the language client and start the client.
//     let lc = new LanguageClient('LiquidJava Server', serverOptions, clientOptions);

// 	lc.trace = Trace.Verbose;
    
//     let disposable = lc.start();
    
//     // Push the disposable to the context's subscriptions so that the 
//     // client can be deactivated on extension deactivation
//     context.subscriptions.push(disposable);

// 	// let port:string = "50000"; 
// 	// //Code bellow from vscode-languageserver-java-example [https://github.com/adamvoss/vscode-languageserver-java-example]
// 	// /**
// 	//  * Connect to Server
// 	//  * @param context 
// 	//  * @returns 
// 	//  */
// 	// function createServer(): Promise<StreamInfo> {
// 	// 	return new Promise((resolve, reject) => {
// 	// 		var server = net.createServer((socket) => {
// 	// 			console.log("Creating server");

// 	// 			resolve({
// 	// 				reader: socket,
// 	// 				writer: socket
// 	// 			});

// 	// 			socket.on('end', () => console.log("Disconnected"));
// 	// 		}).on('error', (err) => {
// 	// 			// handle errors here
// 	// 			throw err;
// 	// 		});

// 	// 		let javaExecutablePath = findJavaExecutable('java');

// 	// 		// grab a random port.
// 	// 		server.listen(() => {
// 	// 			// Start the child java process
// 	// 			let options = { cwd: workspace.rootPath };
			
// 	// 			let args = [
// 	// 				'-jar',
// 	// 				path.resolve(context.extensionPath, '..', 'server', 'language-server-liquidjava.jar'),
// 	// 				port
// 	// 			]

// 	// 			console.log("ARGS");
// 	// 			console.log(args);

// 	// 			let process = child_process.spawn(javaExecutablePath, args, options);

// 	// 			// Send raw output to a file
// 	// 			if (!fs.existsSync(context.storagePath))
// 	// 				fs.mkdirSync(context.storagePath);

// 	// 			let logFile = context.storagePath + '/vscode-languageserver-liquidjava-example.log';
// 	// 			let logStream = fs.createWriteStream(logFile, { flags: 'w' });

// 	// 			process.stdout.pipe(logStream);
// 	// 			process.stderr.pipe(logStream);

// 	// 			console.log(`Storing log in '${logFile}'`);
// 	// 		});
// 	// 	});
// 	// };



// 	// // Options to control the language client
// 	// let clientOptions: LanguageClientOptions = {
// 	// 	// Register the server for plain text documents
// 	// 	documentSelector:[{language:'java', scheme:"file"}],// ["plaintext"],//
// 	// 	synchronize: {
// 	// 		// Synchronize the setting section 'languageServerExample' to the server
// 	// 		configurationSection: 'liquidJavaServer',
// 	// 		// Notify the server about file changes to '.clientrc files contain in the workspace
// 	// 		fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
// 	// 	}
// 	// }

// 	// // Create the language client and start the client.
// 	// let disposable = new LanguageClient('liquidJavaServer', 'Language Server Example', createServer, clientOptions).start();

// 	// // Push the disposable to the context's subscriptions so that the 
// 	// // client can be deactivated on extension deactivation
// 	// context.subscriptions.push(disposable);
	

// 	//side bar extension - info and vcs
// 	const ljProvider = new LiquidJavaProvider(vscode.workspace.rootPath, context);
// 	vscode.window.registerTreeDataProvider('liquidJava', ljProvider);
// 	vscode.commands.registerCommand('liquidJava.start', () => ljProvider.start());
	
// }










// // MIT Licensed code from: https://github.com/georgewfraser/vscode-javac
// function findJavaExecutable(binname: string) {
// 	binname = correctBinname(binname);

// 	// First search each JAVA_HOME bin folder
// 	if (process.env['JAVA_HOME']) {
// 		let workspaces = process.env['JAVA_HOME'].split(path.delimiter);
// 		for (let i = 0; i < workspaces.length; i++) {
// 			let binpath = path.join(workspaces[i], 'bin', binname);
// 			if (fs.existsSync(binpath)) {
// 				return binpath;
// 			}
// 		}
// 	}

// 	// Then search PATH parts
// 	if (process.env['PATH']) {
// 		let pathparts = process.env['PATH'].split(path.delimiter);
// 		for (let i = 0; i < pathparts.length; i++) {
// 			let binpath = path.join(pathparts[i], binname);
// 			if (fs.existsSync(binpath)) {
// 				return binpath;
// 			}
// 		}
// 	}

// 	// Else return the binary name directly (this will likely always fail downstream) 
// 	return null;
// }

// function correctBinname(binname: string) {
// 	if (process.platform === 'win32')
// 		return binname + '.exe';
// 	else
// 		return binname;
// }


