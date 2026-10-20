import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { LJContext, LJVariable } from '../types/context';
import type { LJDiagnostic, SourcePosition, StateRefinementError } from '../types/diagnostics';
import type { LJStateMachine } from '../types/fsm';

const currentFile = '/workspace/src/Main.java';
const otherFile = '/workspace/src/Other.java';
const position: SourcePosition = {
    file: currentFile,
    lineStart: 4,
    colStart: 8,
    lineEnd: 4,
    colEnd: 13,
};

function diagnostic(file: string, title: string, category: 'error' | 'warning' = 'error'): LJDiagnostic {
    const details = {
        title,
        message: `${title} message`,
        hint: null,
        file,
        position: { ...position, file },
    };
    return category === 'error'
        ? { ...details, category, type: 'custom-error' }
        : { ...details, category, type: 'custom-warning' };
}

function context(file = currentFile): LJContext {
    const variable: LJVariable = {
        name: 'count',
        internalName: 'count_1',
        type: 'int',
        refinement: 'count > 0',
        mainRefinement: 'count > 0',
        position: { ...position, file },
        annotationPosition: null,
    };
    return {
        localVars: [variable],
        globalVars: [],
        ghosts: [],
        aliases: [],
        methods: [],
        visibleVars: [variable],
        allVars: [variable],
        fileScopes: {},
    };
}

const stateMachine: LJStateMachine = {
    className: 'Counter',
    initialTransitions: [{ to: 'Open' }],
    states: ['Open', 'Closed'],
    transitions: [{ from: 'Open', to: 'Closed', label: 'close()' }],
    errorContext: null,
};

const refinementsFile = '/workspace/src/DefaultMutableTreeNodeRefinements.java';
const treeMachine: LJStateMachine = {
    className: 'javax.swing.tree.DefaultMutableTreeNode',
    initialTransitions: [{ to: 'childrenAllowed' }],
    states: ['childrenAllowed', 'maybeHasChildren'],
    transitions: [
        { from: 'childrenAllowed', to: 'maybeHasChildren', label: 'add' },
        { from: 'maybeHasChildren', to: 'childrenAllowed', label: 'removeAllChildren' },
        { from: 'maybeHasChildren', to: 'maybeHasChildren', label: 'getFirstChild' },
    ],
    errorContext: null,
};

// state errors are reported in the caller file, while the machine comes from the refinements file
function stateError(line: number, calledMethod: string, receiver: string): StateRefinementError {
    return {
        category: 'error', type: 'state-refinement-error', title: 'State Refinement Error',
        message: `found childrenAllowed(${receiver}) but expected maybeHasChildren(${receiver})`, hint: null,
        file: otherFile, position: { file: otherFile, lineStart: line, colStart: 8, lineEnd: line, colEnd: 30 },
        translationTable: {}, expected: `maybeHasChildren(${receiver})`,
        found: { implication: { name: receiver, type: 'DefaultMutableTreeNode', predicate: `childrenAllowed(${receiver})`, next: null }, origin: null, simplification: null },
        customMessage: '',
        declarationPosition: { file: refinementsFile, lineStart: calledMethod === 'getFirstChild' ? 21 : 18, colStart: 4, lineEnd: 21, colEnd: 40 },
        stateMachine: { ...treeMachine, errorContext: {
            calledMethod, actualStates: ['childrenAllowed'], receiver,
            expectedStates: ['maybeHasChildren'], definiteFoundState: 'childrenAllowed',
        } },
    };
}

describe('webview script', () => {
    let dom: JSDOM;
    let root: HTMLElement;
    let postMessage: Mock<(message: unknown) => void>;
    let runMermaid: Mock<(options: { nodes: NodeListOf<Element> }) => Promise<void>>;

    beforeEach(async () => {
        // fresh modules and DOM isolate diagram state and event listeners
        vi.resetModules();
        dom = new JSDOM('<div id="root"></div>');
        vi.stubGlobal('window', dom.window);
        vi.stubGlobal('document', dom.window.document);
        vi.stubGlobal('Element', dom.window.Element);
        vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
        Object.defineProperty(dom.window.HTMLElement.prototype, 'scrollIntoView', { value: vi.fn() });
        runMermaid = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(dom.window, 'mermaid', { value: { run: runMermaid } });
        postMessage = vi.fn();
        root = dom.window.document.getElementById('root')!;
        const { getScript } = await import('./script');
        getScript({ postMessage }, dom.window.document, dom.window as unknown as Window);
    });

    afterEach(() => {
        dom.window.close();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    function receive(data: unknown) {
        dom.window.dispatchEvent(new dom.window.MessageEvent('message', { data }));
    }

    function click(selector: string): HTMLElement {
        const element = root.querySelector<HTMLElement>(selector);
        expect(element, `missing clickable element: ${selector}`).not.toBeNull();
        element!.click();
        return element!;
    }

    function showDiagnostics(diagnostics: LJDiagnostic[]) {
        receive({ type: 'file', file: currentFile });
        receive({ type: 'diagnostics', diagnostics });
        receive({ type: 'status', status: diagnostics.some(d => d.category === 'error') ? 'failed' : 'passed' });
    }

    it('posts ready and renders the initial loading view', () => {
        expect(postMessage.mock.calls).toEqual([[{ type: 'ready' }]]);
        expect(root.querySelector('h2')?.textContent).toBe('Verification Pending');
        expect(root.querySelector('.info')?.textContent).toContain('Running the LiquidJava verification');
    });

    it('switches between diagnostics, context, and state machine tabs', async () => {
        showDiagnostics([diagnostic(currentFile, 'Current error')]);
        receive({ type: 'context', context: context() });
        receive({ type: 'fsm', sm: stateMachine });
        postMessage.mockClear();

        click('[data-tab="context"]');
        expect(root.querySelector('.nav-tab.selected')?.getAttribute('data-tab')).toBe('context');
        expect(root.querySelector('#context-vars')?.textContent).toContain('count');
        expect(root.querySelector('.diagnostic-item')).toBeNull();

        click('[data-tab="fsm"]');
        expect(root.querySelector('.nav-tab.selected')?.getAttribute('data-tab')).toBe('fsm');
        expect(root.querySelector('.diagram-title')?.textContent).toBe('Counter');
        expect(root.querySelector('.mermaid')?.textContent).toContain('Open --> Closed : close()');
        expect(runMermaid).toHaveBeenCalledOnce();
        expect(runMermaid.mock.calls[0][0].nodes[0]).toBe(root.querySelector('.mermaid'));
        await vi.waitFor(() => {
            expect(root.querySelector<HTMLElement>('#diagram-wrapper')?.style.transform).toBe('matrix(1, 0, 0, 1, 0, 0)');
        });

        click('[data-tab="diagnostics"]');
        expect(root.querySelector('.nav-tab.selected')?.getAttribute('data-tab')).toBe('diagnostics');
        expect(root.querySelector('.diagnostic-item h3')?.textContent).toBe('Current error');
        expect(root.querySelector('.diagram-container')).toBeNull();
        expect(postMessage.mock.calls).toEqual([
            [{ type: 'highlight', range: null }],
            [{ type: 'highlight', range: null }],
            [{ type: 'highlight', range: null }],
        ]);
    });

    it('toggles between file and workspace errors by clicking scope buttons', () => {
        showDiagnostics([
            diagnostic(currentFile, 'Current error'),
            diagnostic(otherFile, 'Other error'),
        ]);
        expect(root.querySelectorAll('.diagnostic-item')).toHaveLength(1);
        expect(root.querySelector('.diagnostics-scope-button.selected')?.getAttribute('data-diagnostics-scope')).toBe('file');

        // clicking a child still activates the scope button
        click('[data-diagnostics-scope="workspace"] .diagnostics-scope-count');
        expect(root.querySelectorAll('.diagnostic-item')).toHaveLength(2);
        expect(root.textContent).toContain('Other error');
        expect(root.querySelector('.diagnostics-scope-button.selected')?.getAttribute('data-diagnostics-scope')).toBe('workspace');

        click('[data-diagnostics-scope="file"]');
        expect(root.querySelectorAll('.diagnostic-item')).toHaveLength(1);
        expect(root.textContent).not.toContain('Other error');
    });

    it('toggles show-all diagnostics when only warnings are present', () => {
        showDiagnostics([
            diagnostic(currentFile, 'Current warning', 'warning'),
            diagnostic(otherFile, 'Other warning', 'warning'),
        ]);
        expect(root.querySelectorAll('.diagnostic-item')).toHaveLength(1);
        expect(root.querySelector('#show-all-button')?.textContent?.trim()).toBe('Show all diagnostics');

        click('#show-all-button');
        expect(root.querySelectorAll('.diagnostic-item')).toHaveLength(2);
        expect(root.textContent).toContain('Other warning');
        expect(root.querySelector('#show-all-button')?.textContent?.trim()).toBe('Show file diagnostics');

        click('#show-all-button');
        expect(root.querySelectorAll('.diagnostic-item')).toHaveLength(1);
        expect(root.textContent).not.toContain('Other warning');
    });

    it('posts the file and zero-based position when a diagnostic location is clicked', () => {
        showDiagnostics([diagnostic(currentFile, 'Current error')]);
        postMessage.mockClear();

        click('.location-link');
        expect(postMessage.mock.calls).toEqual([[{
            type: 'openFile',
            filePath: currentFile,
            line: position.lineStart,
            character: position.colStart,
        }]]);
    });

    it('highlights a current-file variable and clears the highlight on a second click', () => {
        showDiagnostics([]);
        receive({ type: 'context', context: context() });
        click('[data-tab="context"]');
        postMessage.mockClear();
        const { file: _file, ...range } = position;

        const button = click('.highlight-var-btn code');
        expect(button.closest('.highlight-var-btn')?.classList.contains('selected')).toBe(true);
        expect(postMessage.mock.calls).toEqual([[{ type: 'highlight', range }]]);

        click('.highlight-var-btn');
        expect(root.querySelector('.highlight-var-btn.selected')).toBeNull();
        expect(postMessage.mock.calls).toEqual([
            [{ type: 'highlight', range }],
            [{ type: 'highlight', range: null }],
        ]);
    });

    it('opens another file with the variable range when its highlight button is clicked', () => {
        showDiagnostics([]);
        receive({ type: 'context', context: context(otherFile) });
        click('[data-tab="context"]');
        postMessage.mockClear();
        const { file: _file, ...range } = position;

        click('.highlight-var-btn');
        expect(postMessage.mock.calls).toEqual([[{
            type: 'openFile',
            filePath: otherFile,
            line: position.lineStart,
            character: position.colStart,
            highlightRange: range,
        }]]);
    });

    describe('state errors beside the diagram', () => {
        const firstChildError = stateError(10, 'getFirstChild', 'root');
        const removeError = stateError(15, 'removeAllChildren', 'menu');

        function showStateMachine(diagnostics: LJDiagnostic[]) {
            receive({ type: 'file', file: refinementsFile });
            receive({ type: 'diagnostics', diagnostics });
            receive({ type: 'status', status: 'failed' });
            receive({ type: 'fsm', sm: treeMachine });
            click('[data-tab="fsm"]');
        }

        const items = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.state-error-select'));
        const pressed = () => items().map(item => item.getAttribute('aria-pressed'));
        const calls = () => Array.from(root.querySelectorAll('.state-error-call'), node => node.textContent);
        const mermaidSource = () => root.querySelector('.mermaid')?.innerHTML ?? '';

        it('lists errors from other files for the machine of the current file', () => {
            showStateMachine([firstChildError, removeError, diagnostic(currentFile, 'Unrelated error')]);

            expect(root.querySelector('.diagram-title')?.textContent).toBe('javax.swing.tree.DefaultMutableTreeNode');
            expect(calls()).toEqual(['root.getFirstChild()', 'menu.removeAllChildren()']);
            expect(pressed()).toEqual(['false', 'false']);
            expect(mermaidSource()).not.toContain('ljStateErrorActual');
        });

        it('selects an error to highlight it and clears the selection to show the general diagram', () => {
            showStateMachine([firstChildError, removeError]);

            items()[0].click();
            expect(pressed()).toEqual(['true', 'false']);
            expect(mermaidSource()).toContain('class childrenAllowed ljStateErrorActual');
            expect(mermaidSource()).toContain('lj-state-error-method">getFirstChild');
            expect(dom.window.document.activeElement).toBe(items()[0]);

            items()[1].click();
            expect(pressed()).toEqual(['false', 'true']);
            expect(mermaidSource()).toContain('lj-state-error-method">removeAllChildren');
            expect(mermaidSource()).not.toContain('lj-state-error-method">getFirstChild');

            // selecting the selected error again clears the selection
            items()[1].click();
            expect(pressed()).toEqual(['false', 'false']);
            expect(mermaidSource()).not.toContain('ljStateErrorActual');

            items()[0].click();
            click('#state-error-clear-btn');
            expect(pressed()).toEqual(['false', 'false']);
            expect(mermaidSource()).not.toContain('lj-state-error-method');
            expect(root.querySelector<HTMLButtonElement>('#state-error-clear-btn')?.disabled).toBe(true);
            expect(calls()).toEqual(['root.getFirstChild()', 'menu.removeAllChildren()']);
        });

        it('keeps the selection when its error remains after verification and drops fixed errors', () => {
            showStateMachine([firstChildError, removeError]);
            items()[1].click();

            receive({ type: 'diagnostics', diagnostics: [stateError(10, 'getFirstChild', 'root'), stateError(15, 'removeAllChildren', 'menu')] });
            expect(pressed()).toEqual(['false', 'true']);
            expect(mermaidSource()).toContain('lj-state-error-method">removeAllChildren');

            receive({ type: 'diagnostics', diagnostics: [stateError(15, 'removeAllChildren', 'menu')] });
            expect(calls()).toEqual(['menu.removeAllChildren()']);
            expect(pressed()).toEqual(['true']);

            receive({ type: 'diagnostics', diagnostics: [firstChildError] });
            expect(calls()).toEqual(['root.getFirstChild()']);
            expect(pressed()).toEqual(['false']);
            expect(mermaidSource()).not.toContain('ljStateErrorActual');
        });

        it('keeps the diagram and drops the list once every state error is fixed', () => {
            showStateMachine([firstChildError]);
            items()[0].click();

            receive({ type: 'diagnostics', diagnostics: [] });
            expect(root.querySelector('.diagram-title')?.textContent).toBe('javax.swing.tree.DefaultMutableTreeNode');
            expect(root.querySelector('.state-errors')).toBeNull();
            expect(root.querySelector('.fsm-layout')).toBeNull();
            expect(mermaidSource()).not.toContain('ljStateErrorActual');
        });

        it('preselects the error opened with View error on state machine', () => {
            receive({ type: 'file', file: otherFile });
            receive({ type: 'diagnostics', diagnostics: [firstChildError, removeError] });
            receive({ type: 'status', status: 'failed' });
            receive({ type: 'fsm', sm: null });

            root.querySelectorAll<HTMLElement>('.diagnostic-state-machine-btn')[1].click();
            expect(root.querySelector('.nav-tab.selected')?.getAttribute('data-tab')).toBe('fsm');
            expect(calls()).toEqual(['root.getFirstChild()', 'menu.removeAllChildren()']);
            expect(pressed()).toEqual(['false', 'true']);
            expect(mermaidSource()).toContain('lj-state-error-method">removeAllChildren');

            // the caller file has no machine of its own, so clearing keeps the error machine without its context
            click('#state-error-clear-btn');
            expect(root.querySelector('.diagram-title')?.textContent).toBe('javax.swing.tree.DefaultMutableTreeNode');
            expect(pressed()).toEqual(['false', 'false']);
            expect(mermaidSource()).not.toContain('lj-state-error-method');
        });

        it('leaves the view unchanged when the machine has no state errors', () => {
            showStateMachine([diagnostic(currentFile, 'Unrelated error')]);

            expect(root.querySelector('.diagram-title')?.textContent).toBe('javax.swing.tree.DefaultMutableTreeNode');
            expect(root.querySelector('.state-errors')).toBeNull();
            expect(root.querySelector('.fsm-layout')).toBeNull();
        });
    });
});
