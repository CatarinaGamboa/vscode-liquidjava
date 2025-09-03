import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as net from "net";
import * as child_process from "child_process";
import { Trace } from "vscode-jsonrpc";
import { workspace } from "vscode";
import { LanguageClient, LanguageClientOptions, StreamInfo, ServerOptions, State } from "vscode-languageclient";
import { Socket } from "net";

const SERVER_JAR_FILENAME = "language-server-liquidjava.jar";
const API_JAR_GLOB = "**/liquidjava-api*.jar";

let serverProcess: child_process.ChildProcess;
let client: LanguageClient;
let socket: Socket;

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
    serverProcess = child_process.spawn(javaExecutablePath, args, options);

    // listen to process events
    serverProcess.stdout.on("data", (data) => console.log("LiquidJava stdout: " + data));
    serverProcess.stderr.on("data", (data) => console.error("LiquidJava stderr: " + data));
    serverProcess.on("error", (err) => console.log("LiquidJava failed to start subprocess: " + err));
    serverProcess.on("close", (code) => {
        console.log("LiquidJava child process exited with code " + code);
        if (client) client.stop();
    });

    // connect to language server
    const serverOptions: ServerOptions = () => {
        return new Promise<StreamInfo>(async (resolve, reject) => {
            try {
                socket = await connectToServer(port);
                resolve({
                    writer: socket,
                    reader: socket,
                });
            } catch (error) {
                await stopServer("connection failed");
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
    client.onDidChangeState((e) => {
        if (e.newState === State.Stopped) {
            stopServer("client stopped");
        }
    });
    const disposable = client.start();
    context.subscriptions.push(disposable); // client teardown
    context.subscriptions.push({
        dispose: () => stopServer("extension disposed"), // server teardown
    });

    // use LSP lifecycle to confirm startup
    client
        .onReady()
        .then(() => {
            vscode.window.showInformationMessage("LiquidJava Extension is ON! Enjoy!");
        })
        .catch(async (e) => {
            vscode.window.showErrorMessage("LiquidJava failed to initialize: " + e.toString());
            await stopServer("client failed to initialize");
        });

    // side bar extension - info and vcs
    // const ljProvider = new LiquidJavaProvider(vscode.workspace.rootPath, context);
    // vscode.window.registerTreeDataProvider('liquidJava', ljProvider);
    // vscode.commands.registerCommand('liquidJava.start', () => ljProvider.start());
}

export async function deactivate() {
    console.log("LiquidJava Extension is OFF!");
    await stopServer("extension deactivated");
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
async function connectToServer(port: number, timeout = 10000, attemptInterval = 200): Promise<Socket> {
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

async function stopServer(reason: string) {
    console.log("Stopping LiquidJava server: " + reason);

    // stop client
    try {
        await client?.stop();
    } catch (e) {
        console.error("Error stopping client: " + e);
    } finally {
        client = undefined;
    }

    // close socket
    try {
        socket?.end();
        socket?.destroy();
    } catch (e) {
        console.error("Error closing socket: " + e);
    } finally {
        socket = undefined;
    }

    // kill server process
    await killProcess(serverProcess);
    serverProcess = undefined;
}

async function killProcess(proc?: child_process.ChildProcess) {
    return new Promise<void>((resolve) => {
        if (!proc || proc.killed) {
            // already killed
            resolve();
            return;
        }
        if (process.platform === "win32") {
            // Windows
            child_process.exec(`taskkill /pid ${proc.pid} /T /F`, () => resolve());
        } else {
            // Unix
            process.kill(proc.pid, "SIGKILL");
            resolve();
        }
    });
}
