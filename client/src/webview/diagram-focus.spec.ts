import { describe, expect, it } from 'vitest';
import type { LJStateMachine, LJStateMachineErrorContext } from '../types/fsm';
import { createMermaidDiagram } from './diagram';
import { getDisplayedStateMachine, getFocusedStates, getRejectedCallText, getStateErrorFocus } from './diagram-focus';

// DefaultMutableTreeNode from the state error focus issue (#117):
// root.add(...); root.removeAllChildren(); root.getFirstChild(); // state error
function treeNode(errorContext: Partial<LJStateMachineErrorContext> | null = {}): LJStateMachine {
    return {
        className: 'DefaultMutableTreeNode',
        states: ['childrenAllowed', 'maybeHasChildren'],
        initialTransitions: [{ to: 'childrenAllowed', constructorSignature: 'DefaultMutableTreeNode(Object)' }],
        transitions: [
            { from: 'childrenAllowed', to: 'maybeHasChildren', label: 'add' },
            { from: 'maybeHasChildren', to: 'childrenAllowed', label: 'removeAllChildren' },
            { from: 'maybeHasChildren', to: 'maybeHasChildren', label: 'getFirstChild' },
        ],
        errorContext: errorContext && {
            calledMethod: 'getFirstChild',
            actualStates: ['childrenAllowed'],
            receiver: 'root',
            expectedStates: ['maybeHasChildren'],
            expectedCondition: 'maybeHasChildren(root)',
            foundCondition: 'childrenAllowed(root)',
            definiteFoundState: 'childrenAllowed',
            ...errorContext,
        },
    };
}

// java.net.Socket-like machine with many states, self loops, and close() from every open state
function socket(): LJStateMachine {
    const states = ['unconnected', 'bound', 'connected', 'inputShutdown', 'outputShutdown', 'bothShutdown', 'closed'];
    const transitions: LJStateMachine['transitions'] = [
        { from: 'unconnected', to: 'bound', label: 'bind' },
        { from: 'unconnected', to: 'connected', label: 'connect' },
        { from: 'bound', to: 'connected', label: 'connect' },
        { from: 'connected', to: 'connected', label: 'sendUrgentData' },
        { from: 'inputShutdown', to: 'inputShutdown', label: 'sendUrgentData' },
        { from: 'connected', to: 'inputShutdown', label: 'shutdownInput' },
        { from: 'connected', to: 'outputShutdown', label: 'shutdownOutput' },
        { from: 'inputShutdown', to: 'bothShutdown', label: 'shutdownOutput' },
        { from: 'outputShutdown', to: 'bothShutdown', label: 'shutdownInput' },
        ...states.filter(state => state !== 'closed').map(state => ({ from: state, to: 'closed', label: 'close' })),
        ...states.map(state => ({ from: state, to: state, label: 'isClosed' })),
    ];
    return {
        className: 'Socket',
        states,
        initialTransitions: [{ to: 'unconnected', constructorSignature: 'Socket()' }],
        transitions,
        errorContext: {
            calledMethod: 'sendUrgentData',
            actualStates: ['bound'],
            receiver: 'socket',
            expectedStates: ['connected', 'inputShutdown'],
            expectedCondition: 'connected(socket) || inputShutdown(socket)',
            foundCondition: 'bound(socket)',
            definiteFoundState: 'bound',
        },
    };
}

function lines(diagram: string): string[] {
    return diagram.split('\n').map(line => line.trim());
}

describe('state error focus', () => {
    it('reads the found state, required states, and rejected call from the error context', () => {
        const focus = getStateErrorFocus(treeNode());

        expect(focus).toEqual({
            calledMethod: 'getFirstChild',
            receiver: 'root',
            foundState: 'childrenAllowed',
            possibleStates: [],
            requiredStates: ['maybeHasChildren'],
            foundCondition: 'childrenAllowed(root)',
            expectedCondition: 'maybeHasChildren(root)',
        });
        expect(getRejectedCallText(focus!)).toBe('root.getFirstChild()');
        expect(getFocusedStates(treeNode(), focus!)).toEqual(['childrenAllowed', 'maybeHasChildren']);
    });

    it('focuses the tree node example on the found state, the rejected call, and the required state', () => {
        const diagram = lines(createMermaidDiagram(treeNode(), 'TB', false, true));

        expect(diagram).toEqual(expect.arrayContaining([
            'childrenAllowed : childrenAllowed',
            'childrenAllowed : ◉ Found for this<br/>receiver at the call',
            'maybeHasChildren : maybeHasChildren',
            'maybeHasChildren : ✓ Required for this call',
            'note right of childrenAllowed : ⊘ root.getFirstChild()<br/>Call rejected from this state',
            'class childrenAllowed ljStateErrorFound',
            'class maybeHasChildren ljStateErrorRequired',
            'childrenAllowed --> maybeHasChildren : add',
            'maybeHasChildren --> childrenAllowed : removeAllChildren',
        ]));
        // the call only appears where it is allowed, without the highlight of a taken transition
        expect(diagram.filter(line => line.includes('-->') && line.includes('getFirstChild')))
            .toEqual(['maybeHasChildren --> maybeHasChildren : getFirstChild']);
        expect(diagram.some(line => line.startsWith('[*]'))).toBe(false);
        expect(diagram.join('\n')).not.toContain('lj-state-error-method');
    });

    it('marks the error on the full diagram and highlights where the call is allowed', () => {
        const diagram = lines(createMermaidDiagram(treeNode(), 'TB', false, false));

        expect(diagram).toEqual(expect.arrayContaining([
            '[*] --> childrenAllowed : DefaultMutableTreeNode(Object)',
            'maybeHasChildren --> maybeHasChildren : <span class="lj-state-error-method">getFirstChild</span>',
            'note right of childrenAllowed : ⊘ root.getFirstChild()<br/>Call rejected from this state',
            'class childrenAllowed ljStateErrorFound',
            'class maybeHasChildren ljStateErrorRequired',
        ]));
        expect(diagram.join('\n')).not.toContain('ljStateErrorActual');
    });

    it('focuses a large machine on the error and the shortest path to a required state', () => {
        const sm = socket();
        const focus = getStateErrorFocus(sm)!;
        expect(getFocusedStates(sm, focus)).toEqual(['bound', 'connected', 'inputShutdown']);

        const focused = createMermaidDiagram(sm, 'TB', false, true);
        expect(lines(focused)).toEqual(expect.arrayContaining([
            'bound : ◉ Found for this<br/>receiver at the call',
            'connected : ✓ Required for this call',
            'inputShutdown : ✓ Required for this call',
            'note right of bound : ⊘ socket.sendUrgentData()<br/>Call rejected from this state',
            'bound --> connected : connect',
            'connected --> inputShutdown : shutdownInput',
            // self loops of the called method show where it is allowed, other self loops are left out
            'connected --> connected : sendUrgentData',
            'inputShutdown --> inputShutdown : sendUrgentData',
        ]));
        for (const unrelated of ['unconnected', 'outputShutdown', 'bothShutdown', 'closed', '[*]', 'isClosed']) {
            expect(focused).not.toContain(unrelated);
        }

        const full = createMermaidDiagram(sm, 'TB', false, false);
        for (const state of sm.states) expect(full).toContain(state);
        expect(full).toContain('[*] --> unconnected : Socket()');
    });

    it('shows the found condition without a single found state when it is not definite', () => {
        const sm: LJStateMachine = {
            className: 'Door',
            states: ['open', 'closed', 'locked'],
            initialTransitions: [{ to: 'open' }, { to: 'closed' }],
            transitions: [
                { from: 'open', to: 'closed', label: 'close' },
                { from: 'closed', to: 'locked', label: 'lock' },
                { from: 'locked', to: 'closed', label: 'unlock' },
            ],
            errorContext: {
                calledMethod: 'unlock',
                actualStates: ['open', 'closed'],
                receiver: 'door',
                expectedStates: ['locked'],
                expectedCondition: 'locked(door)',
                foundCondition: 'flag ? open(door) : closed(door)',
                definiteFoundState: null,
            },
        };

        const diagram = lines(createMermaidDiagram(sm, 'TB', false, true));
        expect(diagram).toEqual(expect.arrayContaining([
            'state "◉ Found: flag ? open(door) : closed(door)" as lj_found_condition',
            'open : ? Possible for this<br/>receiver at the call',
            'closed : ? Possible for this<br/>receiver at the call',
            'locked : ✓ Required for this call',
            'note right of lj_found_condition : ⊘ door.unlock()<br/>Call rejected from the found state',
            'class lj_found_condition ljStateErrorFoundCondition',
            'class open,closed ljStateErrorPossible',
            'closed --> locked : lock',
        ]));
        expect(diagram.join('\n')).not.toContain('ljStateErrorFound ');
        expect(diagram.some(line => line.startsWith('class') && line.endsWith('ljStateErrorFound'))).toBe(false);
    });

    it('does not treat a trivially true found condition as the found state', () => {
        const sm = treeNode({ actualStates: [], foundCondition: 'true', definiteFoundState: null });

        expect(getStateErrorFocus(sm)?.foundCondition).toBeNull();
        expect(createMermaidDiagram(sm, 'TB', false, true)).toContain('state "◉ Found: no single state" as lj_found_condition');
    });

    it('escapes quotes in a found condition shown as a state name', () => {
        const sm = treeNode({ foundCondition: 'name == "x"', definiteFoundState: null });

        expect(createMermaidDiagram(sm, 'TB', false, true)).toContain('state "◉ Found: name == #quot;x#quot;" as lj_found_condition');
    });

    it('shows the rejected call even when the method is absent from the general diagram', () => {
        const sm = treeNode();
        sm.transitions = sm.transitions.filter(transition => transition.label !== 'getFirstChild');

        for (const focusOnError of [true, false]) {
            expect(createMermaidDiagram(sm, 'TB', false, focusOnError))
                .toContain('note right of childrenAllowed : ⊘ root.getFirstChild()<br/>Call rejected from this state');
        }
    });

    it('shows the rejected call separately from a merged transition label', () => {
        const sm = treeNode();
        sm.transitions.push({ from: 'childrenAllowed', to: 'maybeHasChildren', label: 'getFirstChild' });

        const diagram = createMermaidDiagram(sm, 'TB', false, false);
        expect(diagram).toContain('childrenAllowed --> maybeHasChildren : add<br/><span class="lj-state-error-method">getFirstChild</span>');
        expect(diagram).toContain('note right of childrenAllowed : ⊘ root.getFirstChild()');
    });

    it('combines the labels of a state that may be found and is also required', () => {
        const sm: LJStateMachine = {
            className: 'Connection',
            states: ['Open', 'Closed'],
            initialTransitions: [{ to: 'Closed' }],
            transitions: [
                { from: 'Closed', to: 'Open', label: 'open' },
                { from: 'Open', to: 'Open', label: 'read' },
            ],
            errorContext: {
                calledMethod: 'read', actualStates: ['Open', 'Closed'], receiver: 'connection', expectedStates: ['Open'],
                expectedCondition: 'Open(connection)', foundCondition: 'Open(connection) || Closed(connection)',
                definiteFoundState: null,
            },
        };

        for (const focusOnError of [true, false]) {
            const diagram = lines(createMermaidDiagram(sm, 'TB', false, focusOnError));
            expect(diagram.filter(line => line.startsWith('Open :'))).toEqual([
                'Open : Open',
                'Open : ? Possible · ✓ Required<br/>for this call',
            ]);
            expect(diagram.filter(line => line.startsWith('class'))).toEqual([
                'class lj_found_condition ljStateErrorFoundCondition',
                'class Closed ljStateErrorPossible',
                'class Open ljStateErrorPossibleRequired',
            ]);
        }
        // the call is only allowed as a self loop on the required state
        expect(lines(createMermaidDiagram(sm, 'TB', false, true))).toContain('Open --> Open : read');
    });

    it('only offers condition expansions of the displayed transitions', () => {
        const sm = socket();
        sm.transitions.push({ from: 'closed', to: 'closed', label: 'isBound', fromCondition: 'size > 0' });

        expect(getDisplayedStateMachine(sm, false).transitions.some(transition => transition.fromCondition)).toBe(true);
        const focused = getDisplayedStateMachine(sm, true);
        expect(focused.initialTransitions).toEqual([]);
        expect(focused.transitions.some(transition => transition.fromCondition)).toBe(false);
    });

    it('keeps the previous highlighting for an error context without the error states', () => {
        const sm = treeNode();
        sm.errorContext = { calledMethod: 'getFirstChild', actualStates: ['childrenAllowed'] };

        expect(getStateErrorFocus(sm)).toBeNull();
        const diagram = createMermaidDiagram(sm, 'TB', false, true);
        expect(diagram).toBe(createMermaidDiagram(sm, 'TB', false, false));
        expect(diagram).toContain('maybeHasChildren --> maybeHasChildren : <span class="lj-state-error-method">getFirstChild</span>');
        expect(diagram).toContain('class childrenAllowed ljStateErrorActual');
        expect(diagram).not.toContain('note');
    });

    it('leaves the general diagram unchanged without an error', () => {
        const sm = treeNode(null);

        expect(getStateErrorFocus(sm)).toBeNull();
        expect(createMermaidDiagram(sm, 'TB', false, true)).toBe([
            'stateDiagram-v2',
            '    direction TB',
            '    [*] --> childrenAllowed : DefaultMutableTreeNode(Object)',
            '    childrenAllowed --> maybeHasChildren : add',
            '    maybeHasChildren --> childrenAllowed : removeAllChildren',
            '    maybeHasChildren --> maybeHasChildren : getFirstChild',
        ].join('\n'));
    });
});
