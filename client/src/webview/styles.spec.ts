import { afterEach, describe, expect, it } from 'vitest';
import { getStyles } from './styles';

// node markup copied from Mermaid 11 state diagrams rendered in the webview
const describedState = (className: string) => /*html*/`
    <g class="node ${className} statediagram-state">
        <g><rect class="outer title-state"></rect><line class="divider"></line></g>
        <g class="label"></g>
    </g>`;
const plainState = (className: string) => /*html*/`
    <g class="node ${className} statediagram-state ">
        <rect class="basic label-container"></rect>
        <g class="label"><rect></rect></g>
    </g>`;

function render(nodes: string) {
    document.head.innerHTML = `<style>${getStyles()}</style>`;
    document.body.innerHTML = /*html*/`
        <div class="diagram-container"><div class="mermaid"><svg>${nodes}</svg></div></div>`;
}

function stroke(selector: string): { color: string; dash: string } {
    const style = getComputedStyle(document.querySelector(selector)!);
    return { color: style.getPropertyValue('stroke'), dash: style.getPropertyValue('stroke-dasharray') };
}

afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
});

describe('state error styles', () => {
    it('outlines found and required states that have a description', () => {
        render(describedState('ljStateErrorFound') + describedState('ljStateErrorRequired'));

        for (const part of ['rect.outer', '.divider']) {
            expect(stroke(`.ljStateErrorFound ${part}`).color).toBe('var(--vscode-errorForeground)');
            expect(stroke(`.ljStateErrorRequired ${part}`).color).toBe('var(--lj-state-required)');
        }
    });

    it('dashes the found condition and the possible found states', () => {
        render(plainState('ljStateErrorFoundCondition') + describedState('ljStateErrorPossible'));

        expect(stroke('.ljStateErrorFoundCondition .label-container')).toEqual({ color: 'var(--vscode-errorForeground)', dash: '5 3' });
        expect(stroke('.ljStateErrorPossible rect.outer').dash).toBe('5 3');
    });

    it('dashes a possible state that is also required in the required colour', () => {
        render(describedState('ljStateErrorPossibleRequired'));

        expect(stroke('.ljStateErrorPossibleRequired rect.outer')).toEqual({ color: 'var(--lj-state-required)', dash: '5 3' });
        expect(stroke('.ljStateErrorPossibleRequired .divider').color).toBe('var(--lj-state-required)');
    });

    it('keeps unrelated states with the default outline', () => {
        render(describedState('') + plainState(''));

        expect(stroke('rect.outer').color).toBe('var(--vscode-foreground)');
        expect(stroke('.label-container').color).toBe('var(--vscode-foreground)');
    });
});
