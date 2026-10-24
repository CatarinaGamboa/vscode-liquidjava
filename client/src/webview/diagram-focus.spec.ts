import { describe, expect, it } from 'vitest';
import type { LJStateMachine, LJStateMachineErrorContext } from '../types/fsm';
import { createMermaidDiagram } from './diagram';
import { getRelatedStates, getStateErrorFocus } from './diagram-focus';

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
            definiteFoundState: 'childrenAllowed',
            possibleStates: ['childrenAllowed'],
            ...errorContext,
        },
    };
}

// java.net.DatagramSocket from the UDP chat client study example (#158): socket.close() on one branch,
// then socket.receive(...), with an extra state unrelated to the error
function datagramSocket(errorContext: Partial<LJStateMachineErrorContext> = {}): LJStateMachine {
    const open = ['unbound', 'bound', 'connected'];
    return {
        className: 'java.net.DatagramSocket',
        states: ['unbound', 'bound', 'connected', 'closed', 'broken'],
        initialTransitions: [{ to: 'bound', constructorSignature: 'new DatagramSocket()' }, { to: 'broken' }],
        transitions: [
            { from: 'unbound', to: 'bound', label: 'bind' },
            { from: 'bound', to: 'connected', label: 'connect' },
            { from: 'connected', to: 'bound', label: 'disconnect' },
            ...open.map(state => ({ from: state, to: state, label: 'receive' })),
            ...open.map(state => ({ from: state, to: state, label: 'send' })),
            ...open.map(state => ({ from: state, to: 'closed', label: 'close' })),
            { from: 'broken', to: 'broken', label: 'repair' },
            { from: 'broken', to: 'closed', label: 'discard' },
        ],
        errorContext: {
            calledMethod: 'receive',
            actualStates: ['bound', 'closed'],
            receiver: 'socket',
            expectedStates: open,
            expectedCondition: 'unbound(socket) || bound(socket) || connected(socket)',
            foundCondition: 'flag ? closed(socket) : bound(socket)',
            definiteFoundState: null,
            possibleStates: ['bound', 'closed'],
            ...errorContext,
        },
    };
}

function lines(diagram: string): string[] {
    return diagram.split('\n').map(line => line.trim());
}

const dimmed = (label: string) => `<span class="lj-dimmed-transition">${label}</span>`;
const calledMethod = (label: string) => `<span class="lj-state-error-method">${label}</span>`;

describe('state error focus', () => {
    it('splits the possible states into valid and invalid ones', () => {
        expect(getStateErrorFocus(datagramSocket())).toEqual({
            calledMethod: 'receive',
            receiver: 'socket',
            validStates: ['bound'],
            invalidStates: ['closed'],
            acceptedStates: ['unbound', 'bound', 'connected'],
        });
        expect(getRelatedStates(getStateErrorFocus(datagramSocket())!)).toEqual(['bound', 'closed', 'unbound', 'connected']);
    });

    it.each([
        ['the definite found state', { possibleStates: undefined, definiteFoundState: 'closed' }, [], ['closed']],
        ['the found states', { possibleStates: undefined, definiteFoundState: null }, ['bound'], ['closed']],
    ])('falls back to %s without possible states', (_, errorContext, validStates, invalidStates) => {
        const focus = getStateErrorFocus(datagramSocket(errorContext));

        expect(focus?.validStates).toEqual(validStates);
        expect(focus?.invalidStates).toEqual(invalidStates);
    });

    it('marks valid and invalid states and colours every edge of the called method', () => {
        for (const focusOnError of [true, false]) {
            const diagram = lines(createMermaidDiagram(datagramSocket(), 'TB', false, focusOnError));

            expect(diagram).toEqual(expect.arrayContaining([
                'state "✓ bound" as bound',
                'state "✕ closed" as closed',
                'class bound ljStateValid',
                'class closed ljStateInvalid',
                `unbound --> unbound : ${calledMethod('receive')}<br/>send`,
                `bound --> bound : ${calledMethod('receive')}<br/>send`,
                `connected --> connected : ${calledMethod('receive')}<br/>send`,
            ]));
            // accepted states that are not possible get only a class, without a mark in their name
            expect(diagram.filter(line => /^(state|class) .*\b(unbound|connected)\b/.test(line)))
                .toEqual(['class unbound,connected ljStateAccepted']);
            expect(diagram.join('\n')).not.toContain('ljStateErrorActual');
        }
    });

    it('dims the states and transitions unrelated to the error when focused', () => {
        const focused = lines(createMermaidDiagram(datagramSocket(), 'TB', false, true));

        expect(focused).toEqual(expect.arrayContaining([
            'class broken ljStateDimmed',
            `[*] --> broken : ${dimmed('')}`,
            `broken --> broken : ${dimmed('repair')}`,
            `broken --> closed : ${dimmed('discard')}`,
            // transitions between related states, and initial transitions into them, stay
            '[*] --> bound : new DatagramSocket()',
            'unbound --> bound : bind',
            'bound --> closed : close',
        ]));
        expect(focused.filter(line => line.includes('lj-dimmed-transition'))).toHaveLength(3);

        const full = createMermaidDiagram(datagramSocket(), 'TB', false, false);
        expect(full).not.toContain('ljStateDimmed');
        expect(full).not.toContain('lj-dimmed-transition');
        expect(lines(full)).toContain('[*] --> broken');
    });

    it('keeps edges of the called method undimmed even between unrelated states', () => {
        const sm = datagramSocket();
        sm.transitions.push({ from: 'broken', to: 'broken', label: 'receive' });

        expect(lines(createMermaidDiagram(sm, 'TB', false, true)))
            .toContain(`broken --> broken : repair<br/>${calledMethod('receive')}`);
    });

    it('marks the tree node example without an allowed state', () => {
        const diagram = lines(createMermaidDiagram(treeNode(), 'TB', false, true));

        expect(diagram).toEqual(expect.arrayContaining([
            'state "✕ childrenAllowed" as childrenAllowed',
            'class childrenAllowed ljStateInvalid',
            'class maybeHasChildren ljStateAccepted',
            `maybeHasChildren --> maybeHasChildren : ${calledMethod('getFirstChild')}`,
        ]));
        expect(diagram.join('\n')).not.toMatch(/maybeHasChildren" as|ljStateValid|ljStateDimmed|lj-dimmed-transition/);
    });

    it('keeps the previous highlighting for an error context without the accepted states', () => {
        const sm = treeNode();
        sm.errorContext = { calledMethod: 'getFirstChild', actualStates: ['childrenAllowed'] };

        expect(getStateErrorFocus(sm)).toBeNull();
        const diagram = createMermaidDiagram(sm, 'TB', false, true);
        expect(diagram).toBe(createMermaidDiagram(sm, 'TB', false, false));
        expect(diagram).toContain(`maybeHasChildren --> maybeHasChildren : ${calledMethod('getFirstChild')}`);
        expect(diagram).toContain('class childrenAllowed ljStateErrorActual');
        expect(diagram).not.toMatch(/ljStateValid|ljStateInvalid|ljStateAccepted|ljStateDimmed|" as /);
    });

    it('leaves the general diagram unchanged without an error', () => {
        expect(createMermaidDiagram(treeNode(null), 'TB', false, true)).toBe([
            'stateDiagram-v2',
            '    direction TB',
            '    [*] --> childrenAllowed : DefaultMutableTreeNode(Object)',
            '    childrenAllowed --> maybeHasChildren : add',
            '    maybeHasChildren --> childrenAllowed : removeAllChildren',
            '    maybeHasChildren --> maybeHasChildren : getFirstChild',
        ].join('\n'));
    });
});
