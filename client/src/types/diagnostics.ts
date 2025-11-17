import type { ValDerivationNode } from './derivationNodes';

export type ErrorPosition = {
    lineStart: number;
    lineEnd: number;
    columnStart: number;
    columnEnd: number;
}

export type PlacementInCode = {
    text: string;
    position: {
        file: string;
        line: number;
        column: number;
    };
}

export type TranslationTable = Record<string, PlacementInCode>;

export type LJDiagnostic = LJError | LJWarning;

export type LJError = CustomError | GhostInvocationError | IllegalConstructorTransitionError | 
    InvalidRefinementError | NotFoundError | RefinementError | StateConflictError | 
    StateRefinementError | SyntaxError;

export type LJWarning = ExternalClassNotFoundWarning | ExternalMethodNotFoundWarning;

export type CustomError = {
    title: string;
    message: string;
    details?: string;
    file?: string;
    position?: ErrorPosition;
    translationTable?: TranslationTable;
}

export type GhostInvocationError = {
    title: string;
    message: string;
    details?: string;
    file?: string;
    position?: ErrorPosition;
    translationTable?: TranslationTable;
    expected: string;
}

export type IllegalConstructorTransitionError = {
    title: string;
    message: string;
    details?: string;
    file?: string;
    position?: ErrorPosition;
    translationTable?: TranslationTable;
}

export type InvalidRefinementError = {
    title: string;
    message: string;
    details?: string;
    file?: string;
    position?: ErrorPosition;
    translationTable?: TranslationTable;
    refinement: string;
}

export type NotFoundError = {
    title: string;
    message: string;
    details?: string;
    file?: string;
    position?: ErrorPosition;
    translationTable?: TranslationTable;
}

export type RefinementError = {
    title: string;
    message: string;
    details?: string;
    file?: string;
    position?: ErrorPosition;
    translationTable?: TranslationTable;
    expected: string;
    found: ValDerivationNode;
}

export type StateConflictError = {
    title: string;
    message: string;
    details?: string;
    file?: string;
    position?: ErrorPosition;
    translationTable?: TranslationTable;
    state: string;
    className: string;
}

export type StateRefinementError = {
    title: string;
    message: string;
    details?: string;
    file?: string;
    position?: ErrorPosition;
    translationTable?: TranslationTable;
    method: string;
    expected: string[];
    found: string;
}

export type SyntaxError = {
    title: string;
    message: string;
    details?: string;
    file?: string;
    position?: ErrorPosition;
    translationTable?: TranslationTable;
    refinement: string;
}

export type ExternalClassNotFoundWarning = {
    title: string;
    message: string;
    details?: string;
    file?: string;
    position?: ErrorPosition;
    className: string;
}

export type ExternalMethodNotFoundWarning = {
    title: string;
    message: string;
    details?: string;
    file?: string;
    position?: ErrorPosition;
    methodName: string;
    className: string;
}
