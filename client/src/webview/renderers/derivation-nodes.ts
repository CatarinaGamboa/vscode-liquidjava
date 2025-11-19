import type { RefinementError, DerivationNode, ValDerivationNode, LJError } from "../../types";

const expansionsMap = new Map<string, Set<string>>();

export const getExpansions = (errorId: string): Set<string> => {
    if (!expansionsMap.has(errorId)) {
        expansionsMap.set(errorId, new Set());
    }
    return expansionsMap.get(errorId)!;
};

export const renderJsonTree = (
    error: RefinementError,
    node: DerivationNode | undefined,
    errorId: string,
    path: string,
    expandedPaths: Set<string>
): string => {
    if (!node) {
        return '<span class="node-value">undefined</span>';
    }

    if ("var" in node) {
        const placement = error.translationTable?.[node.var];
        const filePath = (placement as any)?.file ?? error.file;
        const filename = filePath ? filePath.split("/").pop() : "";
        const position = placement?.position;
        const tooltipData = placement
            ? `${placement.text} at ${filename}:${(position?.line ?? 0) + 1}:${(position?.column ?? 0) + 1}`
            : "No location available";
        const fileAttr = filePath ? `data-file="${filePath}"` : "";
        const lineAttr = position ? `data-line="${position.line}"` : "";
        const columnAttr = position ? `data-column="${position.column}"` : "";
        return `<span class="node-var tooltip clickable" data-tooltip="${tooltipData}" ${fileAttr} ${lineAttr} ${columnAttr}>${node.var}</span>`;
    }

    if ("value" in node) {
        const valueNode = node as ValDerivationNode;
        const hasOrigin = Boolean(valueNode.origin);
        const isExpanded = expandedPaths.has(path);
        if (hasOrigin && isExpanded) {
            return renderJsonTree(error, valueNode.origin, errorId, path, expandedPaths);
        }
        const valClass = typeof valueNode.value === "number" ? "node-number" : "node-value";
        const clickableClass = hasOrigin ? "derivable-node clickable" : "";
        const pathAttr = hasOrigin ? `data-node-path="${path}"` : "";
        const idAttr = hasOrigin ? `data-error-id="${errorId}"` : "";
        return `<span class="${valClass} ${clickableClass}" ${pathAttr} ${idAttr}>${valueNode.value}</span>`;
    }

    if ("left" in node && "right" in node) {
        const leftHtml = renderJsonTree(error, node.left, errorId, `${path}.left`, expandedPaths);
        const rightHtml = renderJsonTree(error, node.right, errorId, `${path}.right`, expandedPaths);
        return `${leftHtml} ${node.op} ${rightHtml}`;
    }

    if ("operand" in node) {
        const operandHtml = renderJsonTree(error, node.operand, errorId, `${path}.operand`, expandedPaths);
        return node.op === "-" ? `(${node.op}${operandHtml})` : `${node.op}${operandHtml}`;
    }

    return `<span class="node-value">${JSON.stringify(node)}</span>`;
};

export const handleDerivableNodeClick = (target?: any): boolean => {
    if (!target) return false;
    
    const nodePath = target.getAttribute("data-node-path");
    const errorId = target.getAttribute("data-error-id");
    if (nodePath && errorId !== null) {
        const paths = getExpansions(errorId);
        if (!paths.has(nodePath)) {
            paths.add(nodePath);
        }
        return true;
    }
    return false;
};

export const handleDerivationResetClick = (target?: any): boolean => {
    if (!target) return false;

    const errorId = target.getAttribute("data-error-id");
    if (errorId !== null) {
        expansionsMap.delete(errorId);
        return true;
    }
    return false;
};

export const hashError = (error: LJError): string => {
    const content = `${error.title}|${error.message}|${error.file}|${error.position?.lineStart ?? 0}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `error_${Math.abs(hash)}`;
};