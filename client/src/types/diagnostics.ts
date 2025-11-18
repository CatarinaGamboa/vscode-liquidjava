import type { ValDerivationNode } from './derivationNodes';

export type ErrorPosition = {
    lineStart: number;
    lineEnd: number;
    colStart: number;
    colEnd: number;
}

export type Position = {
    file: string;
    line: number;
    column: number;
}

export type PlacementInCode = {
    text: string;
    position: Position;
}

export type TranslationTable = Record<string, PlacementInCode>;

export type LJDiagnostic = LJError | LJWarning;

export type LJError = CustomError | GhostInvocationError | IllegalConstructorTransitionError | 
    InvalidRefinementError | NotFoundError | RefinementError | StateConflictError | 
    StateRefinementError | SyntaxError;

export type LJWarning = ExternalClassNotFoundWarning | ExternalMethodNotFoundWarning;

export type CustomError = {
    category: 'error';
    type: 'custom-error';
    title: string;
    message: string;
    details: string;
    file: string;
    position: ErrorPosition;
}

export type GhostInvocationError = {
    category: 'error';
    type: 'ghost-invocation-error';
    title: string;
    message: string;
    details: string;
    file: string;
    position: ErrorPosition;
    translationTable: TranslationTable;
    expected: string;
}

export type IllegalConstructorTransitionError = {
    category: 'error';
    type: 'illegal-constructor-transition-error';
    title: string;
    message: string;
    details: string;
    file: string;
    position: ErrorPosition;
}

export type InvalidRefinementError = {
    category: 'error';
    type: 'invalid-refinement-error';
    title: string;
    message: string;
    details: string;
    file: string;
    position: ErrorPosition;
    refinement: string;
}

export type NotFoundError = {
    category: 'error';
    type: 'not-found-error';
    title: string;
    message: string;
    details: string;
    file: string;
    position: ErrorPosition;
    translationTable: TranslationTable;
}

export type RefinementError = {
    category: 'error';
    type: 'refinement-error';
    title: string;
    message: string;
    details: string;
    file: string;
    position: ErrorPosition;
    translationTable: TranslationTable;
    expected: string;
    found: ValDerivationNode;
}

export type StateConflictError = {
    category: 'error';
    type: 'state-conflict-error';
    title: string;
    message: string;
    details: string;
    file: string;
    position: ErrorPosition;
    translationTable: TranslationTable;
    state: string;
    className: string;
}

export type StateRefinementError = {
    category: 'error';
    type: 'state-refinement-error';
    title: string;
    message: string;
    details: string;
    file: string;
    position: ErrorPosition;
    translationTable: TranslationTable;
    method: string;
    expected: string[];
    found: string;
}

export type SyntaxError = {
    category: 'error';
    type: 'syntax-error';
    title: string;
    message: string;
    details: string;
    file: string;
    position: ErrorPosition;
    refinement: string;
}

export type ExternalClassNotFoundWarning = {
    category: 'warning';
    type: 'external-class-not-found-warning';
    title: string;
    message: string;
    details: string;
    file: string;
    position: ErrorPosition;
    className: string;
}

export type ExternalMethodNotFoundWarning = {
    category: 'warning';
    type: 'external-method-not-found-warning';
    title: string;
    message: string;
    details: string;
    file: string;
    position: ErrorPosition;
    methodName: string;
    className: string;
}
