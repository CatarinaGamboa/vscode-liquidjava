import { ExternalClassNotFoundWarning, ExternalMethodNotFoundWarning, LJWarning } from "../../../types";
import { renderHeader, renderLocation, renderSection } from "./utils";

export function getWarningsView(warnings: LJWarning[]): string {
    return /*html*/`
        <div>
            <div class="content">
                <ul>
                    ${warnings.map((warning) => /*html*/`
                        <li class="diagnostic-item warning-item">
                            ${renderWarning(warning)}
                        </li>
                    `).join("")}
                </ul>
            </div>
        </div>
    `;
}

export function renderWarning(warning: LJWarning): string {
    const header = renderHeader(warning);
    const location = renderLocation(warning);
    switch (warning.type) {
        case 'external-class-not-found-warning': {
            const e = warning as ExternalClassNotFoundWarning;
            return `${header}${renderSection('Class Name', `<pre>${e.className}</pre>`)}${location}`;
        }
        case 'external-method-not-found-warning': {
            const e = warning as ExternalMethodNotFoundWarning;
            const methodInfo = e.methodName ? `<pre>${e.methodName}</pre>` : '';
            return `${header}${methodInfo ? renderSection('Method', methodInfo) : ''}${location}`;
        }
        default:
            return `${header}${location}`;
    }
}
