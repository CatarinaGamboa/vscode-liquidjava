import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as net from "net";
import * as child_process from "child_process";
import { Trace } from "vscode-jsonrpc";

import { workspace, Disposable, ExtensionContext } from "vscode";
import { LanguageClient, LanguageClientOptions, StreamInfo, ServerOptions } from "vscode-languageclient";

import { LiquidJavaProvider } from "./liquidJavaProvider";
import { Socket } from "net";

const SERVER_JAR_FILENAME = "vscode-liquid-java-server-0.0.2-SNAPSHOT-jar-with-dependencies.jar";
const API_JAR_GLOB = "**/liquidjava-api*.jar";

export async function activate(context: vscode.ExtensionContext) {
    // only activate if liquidjava api jar is present
    const uris = await vscode.workspace.findFiles(API_JAR_GLOB, null, 100);
    if (uris.length === 0) {
        console.log("No references to LiquidJava API in workspace");
        vscode.window.showInformationMessage("Not using LiquidJava - API not in the workspace");
        return;
    } else {
        vscode.window.showInformationMessage("Found LiquidJava API in the workspace - Loading Extension...");
    }
    uris.forEach((uri: vscode.Uri) => {
        console.log("Found uri: " + uri);
    });

    // run language server
    const port = await getAvailablePort();
    console.log("Running language server on port " + port);
    const javaExecutablePath = findJavaExecutable("java");
    if (!javaExecutablePath) {
        vscode.window.showErrorMessage("Java runtime not found in JAVA_HOME or PATH");
        return;
    }
    const jarPath = path.resolve(context.extensionPath, "server", SERVER_JAR_FILENAME);
    const args = ["-jar", jarPath, port.toString(), process.platform];
    const options = {
        cwd: workspace.workspaceFolders[0].uri.fsPath, // root path
    };
    console.log("Starting language server...");
    const proc = child_process.spawn(javaExecutablePath, args, options);

    // listen to process events
    proc.stdout.on("data", (data) => console.log("LiquidJava stdout: " + data));
    proc.stderr.on("data", (data) => console.error("LiquidJava stderr: " + data));
    proc.on("close", (code) => console.log("LiquidJava child process exited with code " + code));
    proc.on("error", (err) => console.log("LiquidJava failed to start subprocess: " + err));

    // connect to language server
    const serverOptions: ServerOptions = () => {
        return new Promise<StreamInfo>(async (resolve, reject) => {
            try {
                const socket = await connectWithRetry(port);
                resolve({
                    writer: socket,
                    reader: socket,
                });
            } catch (error) {
                reject(error);
            }
        });
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ language: "java" }],
    };
    const client = new LanguageClient("liquidJavaServer", "LiquidJava Server", serverOptions, clientOptions);
    client.trace = Trace.Verbose; // for debugging
    const disposable = client.start();

    console.log("Created LanguageClient");
    context.subscriptions.push(disposable); // removed on deactivation

    // use LSP lifecycle to confirm startup
    client
        .onReady()
        .then(() => {
            vscode.window.showInformationMessage("LiquidJava Extension is ON! Enjoy!");
        })
        .catch((e) => {
            vscode.window.showErrorMessage("LiquidJava failed to initialize: " + e.toString());
        });

    // side bar extension - info and vcs
    // const ljProvider = new LiquidJavaProvider(vscode.workspace.rootPath, context);
    // vscode.window.registerTreeDataProvider('liquidJava', ljProvider);
    // vscode.commands.registerCommand('liquidJava.start', () => ljProvider.start());
}

export function deactivate() {
    console.log("LiquidJava Extension is OFF!");
}

// MIT Licensed code from: https://github.com/georgewfraser/vscode-javac
function findJavaExecutable(binname: string) {
    binname = process.platform === "win32" ? `${binname}.exe` : binname;
    // First search each JAVA_HOME bin folder
    if (process.env["JAVA_HOME"]) {
        for (const workspace of process.env["JAVA_HOME"].split(path.delimiter)) {
            const binpath = path.join(workspace, "bin", binname);
            if (fs.existsSync(binpath)) return binpath;
        }
    }
    // Then search PATH parts
    if (process.env["PATH"]) {
        for (const part of process.env["PATH"].split(path.delimiter)) {
            const binpath = path.join(part, binname);
            if (fs.existsSync(binpath)) return binpath;
        }
    }
    // Else return null
    return null;
}

// returns an available port in the OS
async function getAvailablePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, "localhost", () => {
            const port = (server.address() as net.AddressInfo).port;
            server.close();
            resolve(port);
        });
        server.on("error", reject);
    });
}

// tries to connect to the given port until timeout
async function connectWithRetry(port: number, timeout = 10000, attemptInterval = 200): Promise<Socket> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        try {
            return await new Promise((resolve, reject) => {
                const s = net.connect({ port });

                // connection timeout
                const t = setTimeout(() => {
                    s.destroy(new Error("connection timeout"));
                    reject(new Error("connection timeout"));
                }, 250);

                // success
                s.once("connect", () => {
                    clearTimeout(t);
                    resolve(s);
                });

                // failure
                s.once("error", (e) => {
                    clearTimeout(t);
                    reject(e);
                });
            });
        } catch {
            // wait and retry
            await new Promise((r) => setTimeout(r, attemptInterval));
        }
    }
    throw new Error(`Server not reachable on port ${port} within ${timeout}ms`);
}
