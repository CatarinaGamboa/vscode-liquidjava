import { afterEach, describe, expect, it } from 'vitest';
import type { LJDiagnostic, StateRefinementError } from '../../../types/diagnostics';
import type { LJStateMachine, LJStateMachineErrorContext } from '../../../types/fsm';
import { findStateError, getStateErrorKey, getStateErrorSummary, getStateMachineErrors, renderStateErrorList } from './state-errors';
import { renderStateMachineView } from './fsm';

const refinementsFile = '/workspace/src/DefaultMutableTreeNodeRefinements.java';
const callerFile = '/workspace/src/OutlineBuilder.java';

function machine(errorContext: LJStateMachineErrorContext | null = null, className = 'javax.swing.tree.DefaultMutableTreeNode'): LJStateMachine {
    return {
        className, states: ['childrenAllowed', 'maybeHasChildren'],
        initialTransitions: [{ to: 'childrenAllowed' }],
        transitions: [{ from: 'childrenAllowed', to: 'maybeHasChildren', label: 'add' }],
        errorContext,
    };
}

function stateError(line: number, overrides: Partial<StateRefinementError> = {}): StateRefinementError {
    return {
        category: 'error', type: 'state-refinement-error', title: 'State Refinement Error',
        message: 'found childrenAllowed(root¹⁸) but expected maybeHasChildren(root¹⁸)', hint: null,
        file: callerFile, position: { file: callerFile, lineStart: line, colStart: 15, lineEnd: line, colEnd: 35 },
        translationTable: {}, expected: 'maybeHasChildren(root¹⁸)',
        found: { implication: { name: 'root¹⁸', type: 'DefaultMutableTreeNode', predicate: 'childrenAllowed(root¹⁸)', next: null }, origin: null, simplification: null },
        customMessage: '',
        declarationPosition: { file: refinementsFile, lineStart: 21, colStart: 29, lineEnd: 21, colEnd: 51 },
        stateMachine: machine({ calledMethod: null, actualStates: ['childrenAllowed'] }),
        ...overrides,
    };
}

const fullContext: LJStateMachineErrorContext = {
    calledMethod: 'getFirstChild', actualStates: ['childrenAllowed'], receiver: 'root',
    expectedStates: ['maybeHasChildren'], expectedCondition: 'maybeHasChildren(root)',
    foundCondition: 'childrenAllowed(root)', definiteFoundState: 'childrenAllowed',
};

afterEach(() => {
    document.body.innerHTML = '';
});

describe('state machine errors', () => {
    it('matches errors to the machine by class, not by file', () => {
        const matching = stateError(10);
        const otherClass = stateError(12, { stateMachine: machine(null, 'java.util.ArrayList') });
        const withoutMachine = stateError(14, { stateMachine: null });
        const refinementError = { ...stateError(16), type: 'custom-error' } as unknown as LJDiagnostic;

        expect(getStateMachineErrors([matching, otherClass, withoutMachine, refinementError], machine())).toEqual([matching]);
        expect(getStateMachineErrors([matching], undefined)).toEqual([]);
        expect(getStateMachineErrors(undefined, machine())).toEqual([]);
    });

    it('summarizes errors with the state machine error context', () => {
        expect(getStateErrorSummary(stateError(10, { stateMachine: machine(fullContext) }))).toEqual({
            call: 'root.getFirstChild()', receiver: 'root', found: 'childrenAllowed', required: 'maybeHasChildren',
        });
        expect(getStateErrorSummary(stateError(10, { stateMachine: machine({
            calledMethod: 'getFirstChild', actualStates: [], expectedStates: [],
            expectedCondition: 'maybeHasChildren(root)', foundCondition: 'true', definiteFoundState: null,
        }) }))).toEqual({
            call: 'getFirstChild()', receiver: null, found: 'true', required: 'maybeHasChildren(root)',
        });
    });

    it('falls back to the diagnostic text without the extended error context', () => {
        expect(getStateErrorSummary(stateError(10))).toEqual({
            call: null, receiver: null, found: 'childrenAllowed(root¹⁸)', required: 'maybeHasChildren(root¹⁸)',
        });

        renderStateMachineView(document.body, machine(), 'diagram', 'TB', false, renderStateErrorList([stateError(10)], undefined));
        const item = document.querySelector('.state-error-item')!;
        expect(item.querySelector('.state-error-call')?.textContent).toBe('State Refinement Error');
        expect(item.textContent).not.toContain('Receiver:');
        expect(item.textContent).toContain('Found: childrenAllowed(root¹⁸)');
        expect(item.textContent).toContain('Required: maybeHasChildren(root¹⁸)');
    });

    it('renders each error with its call, receiver, states, and source link beside the diagram', () => {
        const errors = [stateError(10, { stateMachine: machine(fullContext) }), stateError(15)];
        renderStateMachineView(document.body, machine(), 'diagram', 'TB', false, renderStateErrorList(errors, undefined));

        const layout = document.querySelector('.fsm-layout')!;
        expect(Array.from(layout.children, child => child.className)).toEqual(['diagram-section', 'state-errors']);
        expect(document.querySelector('#state-errors-title')?.textContent).toBe('State Errors (2)');
        const [first, second] = Array.from(document.querySelectorAll('.state-error-item'));
        const details = Array.from(first.querySelectorAll('.state-error-details > *'), node => node.textContent?.replace(/\s+/g, ' ').trim());
        expect(details).toEqual(['root.getFirstChild()', 'Receiver: root', 'Found: childrenAllowed', 'Required: maybeHasChildren']);
        const link = first.querySelector('.state-error-location .location-link')!;
        expect(link.textContent).toBe('OutlineBuilder.java:11');
        expect(link.getAttribute('data-file')).toBe(callerFile);
        expect(link.getAttribute('data-line')).toBe('10');
        expect(link.closest('button')).toBeNull();
        expect(second.querySelector('.location-link')?.textContent).toBe('OutlineBuilder.java:16');
        expect(document.querySelector<HTMLButtonElement>('#state-error-clear-btn')?.disabled).toBe(true);
    });

    it('marks the selected error with state, icon, and enabled clear button', () => {
        const errors = [stateError(10), stateError(15)];
        renderStateMachineView(document.body, machine(), 'diagram', 'TB', false, renderStateErrorList(errors, errors[1]));

        const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.state-error-select'));
        expect(buttons.map(button => button.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
        expect(buttons.map(button => button.tagName)).toEqual(['BUTTON', 'BUTTON']);
        expect(buttons[0].querySelector('.codicon-circle-large-outline')).not.toBeNull();
        expect(buttons[1].querySelector('.codicon-pass-filled')).not.toBeNull();
        expect(buttons[1].closest('.state-error-item')?.classList.contains('selected')).toBe(true);
        expect(buttons[1].getAttribute('data-state-error-key')).toBe(getStateErrorKey(errors[1]));
        expect(document.querySelector<HTMLButtonElement>('#state-error-clear-btn')?.disabled).toBe(false);
    });

    it('leaves the view unchanged when there are no state errors', () => {
        renderStateMachineView(document.body, machine(), 'diagram', 'TB', false);
        const withoutList = document.body.innerHTML;

        renderStateMachineView(document.body, machine(), 'diagram', 'TB', false, renderStateErrorList([], undefined));

        expect(renderStateErrorList([], undefined)).toBe('');
        expect(document.body.innerHTML).toBe(withoutList);
        expect(document.querySelector('.fsm-layout')).toBeNull();
        expect(document.querySelector('.state-errors')).toBeNull();
    });

    it('escapes error text', () => {
        const error = stateError(10, { stateMachine: machine({ ...fullContext, receiver: '<img src=x>', calledMethod: 'run' }) });
        renderStateMachineView(document.body, machine(), 'diagram', 'TB', false, renderStateErrorList([error], undefined));

        expect(document.querySelector('.state-error-call')?.textContent).toBe('<img src=x>.run()');
        expect(document.querySelector('.state-errors img')).toBeNull();
    });

    it('finds the selected error again after verification', () => {
        const selected = stateError(10);
        const moved = stateError(12);
        const otherCall = stateError(20, { declarationPosition: { file: refinementsFile, lineStart: 18, colStart: 29, lineEnd: 18, colEnd: 51 } });

        expect(findStateError([otherCall, stateError(10)], selected)).toEqual(selected);
        expect(findStateError([otherCall, moved], selected)).toBe(moved);
        expect(findStateError([otherCall], selected)).toBeUndefined();
        expect(findStateError([moved, stateError(14)], selected)).toBeUndefined();
        expect(findStateError([selected], undefined)).toBeUndefined();
    });
});
