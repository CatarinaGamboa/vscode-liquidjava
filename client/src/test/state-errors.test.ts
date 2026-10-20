import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import * as vscode from 'vscode';
import type { LJDiagnostic, StateRefinementError } from '../types/diagnostics';
import type { LJStateMachine } from '../types/fsm';
import type { LiquidJavaTestApi } from '../types/test-api';

suite('Bundled LiquidJava state machine errors', () => {
    test('sends state errors from the caller file with the machine of the refinements file', async () => {
        const installed = vscode.extensions.getExtension<LiquidJavaTestApi>('AlcidesFonseca.liquid-java');
        assert.ok(installed);
        const api = await installed.activate();
        await api.ready;

        const workspace = vscode.workspace.workspaceFolders?.[0];
        assert.ok(workspace);
        const refinementsUri = vscode.Uri.joinPath(workspace.uri, 'src/main/java/TreeNodeRefinements.java');
        const callerUri = vscode.Uri.joinPath(workspace.uri, 'src/main/java/FailingTreeNodeState.java');
        const sameFile = (file: string, uri: vscode.Uri) => vscode.Uri.file(path.resolve(file)).fsPath === uri.fsPath;
        const subscriptions: vscode.Disposable[] = [];
        const isStateError = (diagnostic: LJDiagnostic): diagnostic is StateRefinementError =>
            diagnostic.type === 'state-refinement-error' && sameFile(diagnostic.file, callerUri);

        try {
            const ready = new Promise<void>(resolve => subscriptions.push(api.onWebviewMessage(event => {
                if (event.direction === 'fromWebview' && event.message.type === 'ready') resolve();
            })));
            await vscode.commands.executeCommand('liquidjava.showView');
            await Promise.race([ready, new Promise(resolve => setTimeout(resolve, 5000))]);

            const machine = new Promise<LJStateMachine>(resolve => subscriptions.push(api.onWebviewMessage(event => {
                if (event.direction === 'toWebview' && event.message.type === 'fsm' && event.message.sm) resolve(event.message.sm);
            })));
            const diagnostics = new Promise<LJDiagnostic[]>((resolve, reject) => {
                subscriptions.push(api.onDiagnostics(value => {
                    if (value.some(isStateError)) resolve(value);
                }));
                subscriptions.push(api.onFailure(() => reject(new Error('LiquidJava verifier crashed while checking state errors'))));
            });
            const document = await vscode.workspace.openTextDocument(refinementsUri);
            await vscode.window.showTextDocument(document);
            await vscode.commands.executeCommand('liquidjava.verify');

            const [sm, result] = await Promise.all([machine, diagnostics]);
            const error = result.find(isStateError);
            assert.ok(error, JSON.stringify(result));
            assert.equal(sm.className, 'javax.swing.tree.DefaultMutableTreeNode');
            assert.ok(error.stateMachine, 'the state error must carry its state machine');
            assert.equal(error.stateMachine.className, sm.className, 'errors are matched to the machine by class');
            assert.ok(error.stateMachine.errorContext, 'the state error must carry its error context');
            assert.ok(error.position && sameFile(error.position.file ?? error.file, callerUri));
            assert.ok(error.declarationPosition?.file && sameFile(error.declarationPosition.file, refinementsUri));
        } finally {
            subscriptions.forEach(subscription => subscription.dispose());
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        }
    });
});
