import type { LJStateMachine } from "../types/fsm";

export const VALID_STATE_ICON = '✓';
export const INVALID_STATE_ICON = '✕';

/**
 * The selected state error of a single state machine, split by the possible states of the receiver
 */
export type StateErrorFocus = {
    calledMethod: string | null;
    receiver: string | null;
    // possible states from which the call is accepted
    validStates: string[];
    // possible states from which the call is rejected
    invalidStates: string[];
    // states from which the call is accepted
    acceptedStates: string[];
};

/**
 * Gets the state error to focus on from the error context of a state machine
 * @param sm
 * @returns the state error focus, or null when there is no error or the server does not report the accepted states
 */
export function getStateErrorFocus(sm: LJStateMachine | undefined): StateErrorFocus | null {
    const context = sm?.errorContext;
    if (!context?.expectedStates) return null;

    const possible = context.possibleStates
        ?? (context.definiteFoundState ? [context.definiteFoundState] : context.actualStates);
    const possibleStates = sm.states.filter(state => possible.includes(state));
    const acceptedStates = sm.states.filter(state => context.expectedStates?.includes(state));
    return {
        calledMethod: context.calledMethod,
        receiver: context.receiver ?? null,
        validStates: possibleStates.filter(state => acceptedStates.includes(state)),
        invalidStates: possibleStates.filter(state => !acceptedStates.includes(state)),
        acceptedStates,
    };
}

/**
 * Gets the states related to a state error: the possible states of the receiver and the accepted states
 * @param focus
 * @returns the related states
 */
export function getRelatedStates(focus: StateErrorFocus): string[] {
    return [...new Set([...focus.validStates, ...focus.invalidStates, ...focus.acceptedStates])];
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
