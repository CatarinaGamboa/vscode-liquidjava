import type { LJStateMachine } from "../types/fsm";

// labels shown next to the states and call of a state error
export const FOUND_STATE_ICON = '\u25C9';
export const FOUND_STATE_TEXT = 'Found for this receiver at the call';
export const POSSIBLE_STATE_ICON = '?';
export const POSSIBLE_STATE_TEXT = 'Possible for this receiver at the call';
export const REQUIRED_STATE_ICON = '\u2713';
export const REQUIRED_STATE_TEXT = 'Required for this call';
export const REJECTED_CALL_ICON = '\u2298';
export const REJECTED_CALL_TEXT = 'Call rejected from this state';
export const REJECTED_CALL_UNKNOWN_STATE_TEXT = 'Call rejected from the found state';
export const UNKNOWN_FOUND_STATE_TEXT = 'no single state';

/**
 * The selected state error of a single state machine, with the states it involves
 */
export type StateErrorFocus = {
    calledMethod: string | null;
    receiver: string | null;
    foundState: string | null;
    possibleStates: string[];
    requiredStates: string[];
    foundCondition: string | null;
    expectedCondition: string | null;
};

/**
 * Gets the state error to focus on from the error context of a state machine
 * @param sm
 * @returns the state error focus, or null when there is no error or the server only reports the called method and found states
 */
export function getStateErrorFocus(sm: LJStateMachine | undefined): StateErrorFocus | null {
    const context = sm?.errorContext;
    if (!context?.expectedStates) return null;

    const foundState = context.definiteFoundState && sm.states.includes(context.definiteFoundState)
        ? context.definiteFoundState
        : null;
    return {
        calledMethod: context.calledMethod,
        receiver: context.receiver ?? null,
        foundState,
        possibleStates: foundState ? [] : sm.states.filter(state => context.actualStates.includes(state)),
        requiredStates: sm.states.filter(state => state !== foundState && context.expectedStates?.includes(state)),
        // a trivially true condition tells nothing about the state of the receiver
        foundCondition: context.foundCondition && context.foundCondition !== 'true' ? context.foundCondition : null,
        expectedCondition: context.expectedCondition ?? null,
    };
}

/**
 * Gets the states shown when focusing on a state error: the found states, the required states,
 * and the states on a shortest path between them
 * @param sm
 * @param focus
 * @returns the focused states, in the order of the state machine
 */
export function getFocusedStates(sm: LJStateMachine, focus: StateErrorFocus): string[] {
    const sources = focus.foundState ? [focus.foundState] : focus.possibleStates;
    const focused = new Set([...sources, ...focus.requiredStates, ...getShortestPath(sm, sources, focus.requiredStates)]);
    return sm.states.filter(state => focused.has(state));
}

function getShortestPath(sm: LJStateMachine, sources: string[], targets: string[]): string[] {
    const previous = new Map<string, string | null>(sources.map(source => [source, null]));
    const queue = [...sources];
    while (queue.length > 0) {
        const state = queue.shift()!;
        if (targets.includes(state)) {
            const path: string[] = [];
            for (let current: string | null | undefined = state; current; current = previous.get(current)) {
                path.unshift(current);
            }
            return path;
        }
        sm.transitions
            .filter(transition => transition.from === state && !previous.has(transition.to))
            .forEach(transition => {
                previous.set(transition.to, state);
                queue.push(transition.to);
            });
    }
    return [];
}

/**
 * Gets the text shown for the rejected call, e.g. root.getFirstChild()
 * @param focus
 * @returns the call text, or null when the called method is unknown
 */
export function getRejectedCallText(focus: StateErrorFocus): string | null {
    if (!focus.calledMethod) return null;
    return `${focus.receiver ? `${focus.receiver}.` : ''}${focus.calledMethod}()`;
}
