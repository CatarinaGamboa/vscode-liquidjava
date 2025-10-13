import { Range, DiagnosticSeverity, Diagnostic } from "vscode";

export type RefinementError = {
    message: string;
    range: Range;
    severity: DiagnosticSeverity;
    file: string;
    expected: string;
    found: ValDerivationNode;
    kind: string;
    translationTable: Record<string, TranslationEntry>;
}

export type DerivationNode = ValDerivationNode | VarDerivationNode | BinaryDerivationNode | UnaryDerivationNode;

export type ValDerivationNode = {
    val: any;
    origin?: DerivationNode,
    type?: "folding" | "propagation";
}

export type VarDerivationNode = {
    var: string;
}

export type BinaryDerivationNode = {
    op: string;
    left: ValDerivationNode;
    right: ValDerivationNode;
}

export type UnaryDerivationNode = {
    op: string;
    operand: ValDerivationNode;
}

export type LJDiagnostic = Diagnostic & {
    data: {
        titleMessage: string;
        fullMessage: string;
        errorKind: string;
    }
};

export type TranslationEntry = {
    created: string;
    file: string;
    line: number;
    column: number;
}