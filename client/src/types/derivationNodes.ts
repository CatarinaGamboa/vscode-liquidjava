export type DerivationNode = ValDerivationNode | VarDerivationNode | BinaryDerivationNode | UnaryDerivationNode;

export type ValDerivationNode = {
    val: any;
    origin?: DerivationNode,
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
