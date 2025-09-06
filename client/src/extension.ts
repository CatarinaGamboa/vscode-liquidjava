import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as net from "net";
import * as child_process from "child_process";
import { Trace } from "vscode-jsonrpc";
import { LanguageClient, LanguageClientOptions, StreamInfo, ServerOptions, State } from "vscode-languageclient";
import { LiquidJavaLogger, createLogger } from "./logging";

const SERVER_JAR_FILENAME = "language-server-liquidjava.jar";
const API_JAR_GLOB = "**/liquidjava-api*.jar";

let serverProcess: child_process.ChildProcess;
let client: LanguageClient;
let socket: net.Socket;
let outputChannel: vscode.OutputChannel;
let logger: LiquidJavaLogger;
let statusBarItem: vscode.StatusBarItem;

/**
 * Activates the LiquidJava extension
 * @param context The extension context
 */
export async function activate(context: vscode.ExtensionContext) {
    initLogging(context);
    initStatusBar(context);

    logger.client.info("Activating LiquidJava extension...");

    // only activate if liquidjava api jar is present
    const jarIsPresent = await isJarPresent();
    if (!jarIsPresent) {
        vscode.window.showWarningMessage("LiquidJava API Jar Not Found in Workspace");
        logger.client.error("LiquidJava API jar not found in workspace - Not activating extension");
        return;
    }
    logger.client.info("Found LiquidJava API in the workspace - Loading extension...");

    // find java executable path
    const javaExecutablePath = findJavaExecutable("java");
    if (!javaExecutablePath) {
        vscode.window.showErrorMessage("LiquidJava - Java Runtime Not Found in JAVA_HOME or PATH");
        logger.client.error("Java Runtime not found in JAVA_HOME or PATH - Not activating extension");
        return;
    }
    logger.client.info("Using Java at: " + javaExecutablePath);

    // start server
    logger.client.info("Starting LiquidJava language server...");
    const port = await runLanguageServer(context, javaExecutablePath);

    // start client
    logger.client.info("Starting LiquidJava client...");
    await runClient(context, port);
}

/**
 * Deactivates the LiquidJava extension
 */
export async function deactivate() {
    logger.client.info("Deactivating LiquidJava extension...");
    await stopServer("Extension was deactivated");
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
 * Initializes logging for the extension with an output channel
 * @param context The extension context
 */
function initLogging(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel("LiquidJava");
    logger = createLogger(outputChannel);
    context.subscriptions.push(outputChannel);
    context.subscriptions.push(logger);
    context.subscriptions.push(
        vscode.commands.registerCommand("liquidjava.showLogs", () => outputChannel.show(true))
    );
}

/**
 * Initializes the status bar for the extension
 * @param context The extension context
 */
function initStatusBar(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = "$(sync~spin) LiquidJava";
    statusBarItem.tooltip = "LiquidJava — Show logs";
    statusBarItem.command = "liquidjava.showLogs";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}

/**
 * Runs the LiquidJava language server
 * @param context The extension context
 * @param javaExecutablePath The path to the Java executable
 * @returns A promise to the port number the server is running on
 */
async function runLanguageServer(context: vscode.ExtensionContext, javaExecutablePath: string): Promise<number> {
    const port = await getAvailablePort();
    logger.client.info("Running language server on port " + port);

    const jarPath = path.resolve(context.extensionPath, "server", SERVER_JAR_FILENAME);
    const args = ["-jar", jarPath, port.toString()];
    const options = {
        cwd: vscode.workspace.workspaceFolders[0].uri.fsPath, // root path
    };
    logger.client.info("Creating language server process...");
    serverProcess = child_process.spawn(javaExecutablePath, args, options);

    // listen to process events
    serverProcess.stdout.on("data", (data) => logger.server.info(data.toString().trim()));
    serverProcess.stderr.on("data", (data) => logger.server.error(data.toString().trim()));
    serverProcess.on("error", (err) => logger.server.error(`Failed to start: ${err}`));
    serverProcess.on("close", (code) => {
        logger.server.info(`Process exited with code ${code}`);
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
                await stopServer("Failed to connect to server");
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
            stopServer("Extension stopped");
        }
    });
    const disposable = client.start();
    context.subscriptions.push(disposable); // client teardown
    context.subscriptions.push({
        dispose: () => stopServer("Extension was disposed"), // server teardown
    });

    client
        .onReady()
        .then(() => {
            logger.client.info("Extension is ready");
            statusBarItem.text = "$(check) LiquidJava";
        })
        .catch(async (e) => {
            vscode.window.showErrorMessage("LiquidJava failed to initialize: " + e.toString());
            logger.client.error("Failed to initialize: " + e.toString());
            await stopServer("Failed to initialize");
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
async function connectToPort(
    port: number,
    timeout = 10000,
    attemptInterval = 500,
    connectionTimeout = 500
): Promise<net.Socket> {
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
    if (!client && !serverProcess && !socket) {
        logger.client.info("Server already stopped");
        return;
    }
    logger.client.info("Stopping LiquidJava server: " + reason);

    // update status bar
    statusBarItem.text = "$(circle-slash) LiquidJava";
    statusBarItem.tooltip = reason;
    statusBarItem.color = new vscode.ThemeColor('errorForeground');

    // stop client
    try {
        await client?.stop();
    } catch (e) {
        logger.client.error("Error stopping client: " + e);
    } finally {
        client = undefined;
    }

    // close socket
    try {
        socket?.end();
        socket?.destroy();
    } catch (e) {
        logger.client.error("Error closing socket: " + e);
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
