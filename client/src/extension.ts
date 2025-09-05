import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as net from "net";
import * as child_process from "child_process";
import { Trace } from "vscode-jsonrpc";
import { LanguageClient, LanguageClientOptions, StreamInfo, ServerOptions, State } from "vscode-languageclient";

const SERVER_JAR_FILENAME = "language-server-liquidjava.jar";
const API_JAR_GLOB = "**/liquidjava-api*.jar";

let serverProcess: child_process.ChildProcess;
let client: LanguageClient;
let socket: net.Socket;

/**
 * Activates the LiquidJava extension
 * @param context The extension context
 */
export async function activate(context: vscode.ExtensionContext) {
    // only activate if liquidjava api jar is present
    const jarIsPresent = await isJarPresent();
    if (!jarIsPresent) {
        vscode.window.showWarningMessage("LiquidJava API Jar Not Found in Workspace");
        return;
    }
    console.log("Found LiquidJava API in the Workspace - Loading Extension...");

    // find java executable path
    const javaExecutablePath = findJavaExecutable("java");
    if (!javaExecutablePath) {
        vscode.window.showErrorMessage("LiquidJava - Java Runtime Not Found in JAVA_HOME or PATH");
        return;
    }

    // start server
    const port = await runLanguageServer(context, javaExecutablePath);

    // start client
    await runClient(context, port);
}

/**
 * Deactivates the LiquidJava extension
 */
export async function deactivate() {
    await stopServer("extension deactivated");
}

/**
 * Checks if the extension can be activated by looking for the LiquidJava API jar in the workspace
 * @returns true if the extension can be activated, false otherwise
 */
async function isJarPresent(): Promise<boolean> {
    const uris = await vscode.workspace.findFiles(API_JAR_GLOB, null, 100);
    return uris.length > 0;
}

/**
 * Runs the LiquidJava language server
 * @param context The extension context
 * @param javaExecutablePath The path to the Java executable
 * @returns A promise to the port number the server is running on
 */
async function runLanguageServer(context: vscode.ExtensionContext, javaExecutablePath: string): Promise<number> {
    const port = await getAvailablePort();
    console.log("Running language server on port " + port);

    const jarPath = path.resolve(context.extensionPath, "server", SERVER_JAR_FILENAME);
    const args = ["-jar", jarPath, port.toString()];
    const options = {
        cwd: vscode.workspace.workspaceFolders[0].uri.fsPath, // root path
    };
    console.log("Starting language server...");
    serverProcess = child_process.spawn(javaExecutablePath, args, options);

    // listen to process events
    serverProcess.stdout.on("data", (data) => console.log("LiquidJava stdout: " + data));
    serverProcess.stderr.on("data", (data) => console.error("LiquidJava stderr: " + data));
    serverProcess.on("error", (err) => console.log("LiquidJava failed to start subprocess: " + err));
    serverProcess.on("close", (code) => {
        console.log("LiquidJava child process exited with code " + code);
        client?.stop();
    });
    return port;
}

/**
 * Starts the client and connects it to the language server
 * @param context The extension context
 * @param port The port the server is running on
 */
async function runClient(context: vscode.ExtensionContext, port: number) {
    const serverOptions: ServerOptions = () => {
        return new Promise<StreamInfo>(async (resolve, reject) => {
            try {
                socket = await connectToPort(port);
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
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ language: "java" }],
    };
    client = new LanguageClient("liquidJavaServer", "LiquidJava Server", serverOptions, clientOptions);
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

    client
        .onReady()
        .then(() => {
            vscode.window.showInformationMessage("LiquidJava Extension is ON! Enjoy!");
        })
        .catch(async (e) => {
            vscode.window.showErrorMessage("LiquidJava failed to initialize: " + e.toString());
            await stopServer("client failed to initialize");
        });
}

/**
 * Finds the Java executable in the system, either in JAVA_HOME or in PATH
 * MIT Licensed code from: https://github.com/georgewfraser/vscode-javac
 */
function findJavaExecutable(binname: string): string | null {
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

/**
 * Gets an available port in the OS
 * @returns A promise to the available port number
 */
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

/**
 * Connects to the process on the given port, retrying until timeout
 * @param port The port to connect to
 * @param timeout The timeout duration in milliseconds
 * @param attemptInterval The interval between connection attempts in milliseconds
 * @param connectionTimeout The timeout for each individual connection attempt in milliseconds
 * @returns A promise to the connected socket
 */
async function connectToPort(port: number, timeout = 10000, attemptInterval = 500, connectionTimeout = 500): Promise<net.Socket> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        try {
            return await new Promise((resolve, reject) => {
                const s = net.connect({ port });

                // connection timeout
                const t = setTimeout(() => {
                    s.destroy(new Error("connection timeout"));
                    reject(new Error("connection timeout"));
                }, connectionTimeout);

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

/**
 * Stops the LiquidJava server
 * @param reason The reason for stopping the server
 */
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

/**
 * Kills the given process if it is running
 * @param proc The process to kill
 * @returns A promise that resolves when the process has been killed
 */
async function killProcess(proc?: child_process.ChildProcess) {
    return new Promise<void>((resolve, reject) => {
        if (!proc || proc.killed) {
            // already killed
            resolve();
            return;
        }
        if (process.platform === "win32") {
            // Windows
            child_process.exec(`taskkill /pid ${proc.pid} /T /F`, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        } else {
            // Unix
            try {
                process.kill(proc.pid, "SIGKILL");
                resolve();
            } catch (err) {
                reject(err);
            }
        }
    });
}
