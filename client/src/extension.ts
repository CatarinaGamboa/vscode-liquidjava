import * as vscode from "vscode";
import * as path from "path";
import * as net from "net";
import * as child_process from "child_process";
import { LanguageClient, LanguageClientOptions, StreamInfo, ServerOptions, State } from "vscode-languageclient";
import { LiquidJavaLogger, createLogger } from "./logging";
import { applyItalicOverlay } from "./decorators";
import { connectToPort, findJavaExecutable, getAvailablePort, isJarPresent, killProcess } from "./utils";
import { SERVER_JAR_FILENAME, DEBUG_MODE, DEBUG_PORT } from "./constants";

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
    await applyItalicOverlay();

    // only activate if liquidjava api jar is present
    const jarIsPresent = await isJarPresent();
    if (!jarIsPresent) {
        vscode.window.showWarningMessage("LiquidJava API Jar Not Found in Workspace");
        logger.client.error("LiquidJava API jar not found in workspace - Not activating extension");
        updateStatusBar("stopped");
        return;
    }
    logger.client.info("Found LiquidJava API in the workspace - Loading extension...");

    // find java executable path
    const javaExecutablePath = findJavaExecutable("java");
    if (!javaExecutablePath) {
        vscode.window.showErrorMessage("LiquidJava - Java Runtime Not Found in JAVA_HOME or PATH");
        logger.client.error("Java Runtime not found in JAVA_HOME or PATH - Not activating extension");
        updateStatusBar("stopped");
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
    logger?.client.info("Deactivating LiquidJava extension...");
    await stopExtension("Extension was deactivated");
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
    context.subscriptions.push(vscode.commands.registerCommand("liquidjava.showLogs", () => outputChannel.show(true)));
}

/**
 * Initializes the status bar for the extension
 * @param context The extension context
 */
function initStatusBar(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.tooltip = "Show Logs";
    statusBarItem.command = "liquidjava.showLogs";
    updateStatusBar("loading")
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}

/**
 * Updates the status bar with the current state
 * @param state The state of the status bar: "loading", "stopped", "passed" or "failed"
 */
function updateStatusBar(state: "loading" | "stopped" | "passed" | "failed") {
    const icons = {
        loading: "$(sync~spin)",
        stopped: "$(circle-slash)",
        passed: "$(check)",
        failed: "$(x)",
    };
    const color = state === "stopped" ? "errorForeground" : "statusBar.foreground";
    statusBarItem.color = new vscode.ThemeColor(color);
    statusBarItem.text = icons[state] + " LiquidJava";
}

/**
 * Runs the LiquidJava language server
 * @param context The extension context
 * @param javaExecutablePath The path to the Java executable
 * @returns A promise to the port number the server is running on
 */
async function runLanguageServer(context: vscode.ExtensionContext, javaExecutablePath: string): Promise<number> {
    const port = DEBUG_MODE ? DEBUG_PORT : await getAvailablePort();
    if (DEBUG_MODE) {
        logger.client.info("DEBUG MODE: Using fixed port " + port);
        return port;
    }
    logger.client.info("Running language server on port " + port);

    const jarPath = path.resolve(context.extensionPath, "server", SERVER_JAR_FILENAME);
    const args = ["-jar", jarPath, port.toString()];
    const options = {
        cwd: vscode.workspace.workspaceFolders[0].uri.fsPath, // root path
    };
    logger.client.info("Creating language server process...");
    serverProcess = child_process.spawn(javaExecutablePath, args, options);

    // listen to process events
    serverProcess.stdout.on("data", (data) => {
        const message = data.toString().trim();
        logger.server.info(message);
        if (message.includes("error found")) {
            updateStatusBar("failed");
        } else if (message.includes("error not found")) {
            updateStatusBar("passed");
        }
    });
    serverProcess.stderr.on("data", (data) => {
        logger.server.error(data.toString().trim())
    });
    serverProcess.on("error", (err) => {
        logger.server.error(`Failed to start: ${err}`)
    });
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
                await stopExtension("Failed to connect to server");
                reject(error);
            }
        });
    };
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ language: "java" }],
    };
    client = new LanguageClient("liquidJavaServer", "LiquidJava Server", serverOptions, clientOptions);
    client.onDidChangeState((e) => {
        if (e.newState === State.Stopped) {
            stopExtension("Extension stopped");
        }
    });
    const disposable = client.start();
    context.subscriptions.push(disposable); // client teardown
    context.subscriptions.push({
        dispose: () => stopExtension("Extension was disposed"), // server teardown
    });

    client
        .onReady()
        .then(() => {
            logger.client.info("Extension is ready");
        })
        .catch(async (e) => {
            vscode.window.showErrorMessage("LiquidJava failed to initialize: " + e.toString());
            logger.client.error("Failed to initialize: " + e.toString());
            await stopExtension("Failed to initialize");
        });

    // update status bar on file save
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(() => {
            if (client) {
                updateStatusBar("loading");
            }
        })
    );
}

/**
 * Stops the LiquidJava extension
 * @param reason The reason for stopping the extension
 */
async function stopExtension(reason: string) {
    if (!client && !serverProcess && !socket) {
        logger.client.info("Extension already stopped");
        return;
    }
    logger.client.info("Stopping LiquidJava extension: " + reason);
    updateStatusBar("stopped");

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
