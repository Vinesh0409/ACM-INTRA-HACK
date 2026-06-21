
function getPriorityLabel(priority) {
    if (typeof priority === 'string' && priority.trim()) {
        return priority.trim().toUpperCase();
    } else if (typeof priority === 'number') {
        if (priority >= 100) return 'CRITICAL';
        if (priority >= 50) return 'HIGH';
        if (priority >= 25) return 'MEDIUM';
        if (priority > 0)  return 'LOW';
    }
    return null;
}


function buildPackageRows(packagesList, emptyId) {
    if (!packagesList || packagesList.length === 0) {
        return `<div id="${emptyId}-empty" class="empty-state">No packages found.</div>`;
    }

    const rows = packagesList.map(p => {
        const isOutdated = p.status === "outdated";
        const isVulnerable = p.vulnerable === true || p.vulnerable === "true";

        const priorityLabel = getPriorityLabel(p.priority);
        const riskLabel = (p.risk && p.risk !== 'UNKNOWN') ? p.risk : null;
        const severityClass = (p.severity && p.severity !== 'NONE') ? p.severity.toLowerCase() : 'low';

        const badgeHtml = `
            ${isVulnerable ? `<span class="badge badge-vulnerable">⚠️ Vulnerable</span>` : ''}
            ${isOutdated ? `<span class="badge badge-outdated">Outdated</span>` : `<span class="badge badge-latest">Latest</span>`}
        `;

        return `
        <div class="package-card" data-name="${p.package.toLowerCase()}" data-status="${p.status}" data-vulnerable="${isVulnerable ? 'true' : 'false'}">
            <div class="card-header" onclick="toggleCard(this)">
                <div class="title-section">
                    <span class="chevron">▶</span>
                    <span class="package-name">${p.package}</span>
                </div>
                <div class="badge-section">
                    ${badgeHtml}
                </div>
            </div>

            <div class="card-content" style="display: none;">
                <div class="info-grid">
                    <div><strong>Current:</strong> <code>${p.current}</code></div>
                    <div><strong>Latest:</strong> <code>${p.latest}</code></div>
                </div>

                ${riskLabel ? `<div style="margin-top: 6px;"><strong>Upgrade Risk:</strong> <span class="risk-${riskLabel.toLowerCase()}">${riskLabel}</span></div>` : ''}
                ${priorityLabel ? `<div style="margin-top: 4px;"><strong>Priority Level:</strong> <span class="priority-${priorityLabel.toLowerCase()}">${priorityLabel}</span></div>` : ''}
                
                ${p.repo_url ? `
                    <div style="margin-top: 4px; word-break: break-all;">
                        <strong>Repository:</strong> 
                        <a href="${p.repo_url}" target="_blank" style="color: var(--vscode-textLink-foreground); text-decoration: none;">
                            ${p.repo_url}
                        </a>
                    </div>
                ` : ''}

                ${isVulnerable ? `
                    <div class="vuln-box" style="margin-top: 8px;">
                        <div class="vuln-header">
                            <strong>Advisory:</strong> <code>${p.vulnerability_id || 'N/A'}</code>
                            <span class="severity-${severityClass}">${p.severity || 'UNKNOWN'} Severity</span>
                        </div>
                        <div style="margin-top: 4px; font-size: 10.5px;"><strong>Vulnerabilities Found:</strong> ${p.vulnerability_count || 0}</div>
                        ${p.summary ? `<p class="vuln-summary">${p.summary}</p>` : ''}
                    </div>
                ` : ''}

                ${isOutdated ? `
                    ${p.recommendation ? `<div class="recommendation-box" style="margin-top: 8px;"><strong>Recommendation:</strong><br>${p.recommendation}</div>` : ''}
                    <div class="card-actions" style="margin-top: 10px;">
                        <button onclick="copyInstall('${p.package}', '${p.latest}')" class="btn btn-primary">📋 Copy Install Command</button>
                    </div>
                ` : ''}
            </div>
        </div>
        `;
    }).join("");

    return rows + `<div id="${emptyId}-empty" class="empty-state" style="display: none;">No matching packages found.</div>`;
}


function buildGraphTreeRows(graph) {
    const pkgs = Object.keys(graph);
    if (pkgs.length === 0) {
        return '<div class="empty-state">No graph data available.</div>';
    }
    return pkgs.map(pkg => {
        const info = graph[pkg];
        const hasChildren = Array.isArray(info.children) && info.children.length > 0;
        return `
        <div class="graph-node">
            <div class="graph-node-header" ${hasChildren ? 'onclick="toggleGraphNode(this)"' : ''}>
                ${hasChildren ? '<span class="chevron">▶</span>' : '<span style="width: 8px; display: inline-block;"></span>'}
                <span class="node-name"><strong>${pkg}</strong> <span style="opacity: 0.6; font-size: 10px;">v${info.version || ''}</span></span>
            </div>
            ${hasChildren ? `
            <div class="graph-node-children" style="display: none;">
                ${info.children.map(child => `
                    <div class="graph-child" style="padding: 2px 0 2px 10px; font-family: var(--vscode-editor-font-family, monospace); font-size: 10.5px; opacity: 0.85;">
                        ↳ ${child}
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
        `;
    }).join('');
}


const styles = `
    body {
        padding: 12px;
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background-color: var(--vscode-sidebar-background);
        margin: 0;
        font-size: 13px;
    }
    ::-webkit-scrollbar {
        width: 6px;
    }
    ::-webkit-scrollbar-track {
        background: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background: var(--vscode-scrollbarSlider-background);
        border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: var(--vscode-scrollbarSlider-activeBackground);
    }
    .header-container {
        padding: 16px 12px;
        border-radius: 10px;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.12));
        border: 1px solid var(--vscode-panel-border);
        margin-bottom: 12px;
        text-align: center;
    }
    .score-value {
        font-size: 2.8rem;
        font-weight: 800;
        line-height: 1;
        margin-bottom: 4px;
        font-family: system-ui, -apple-system, sans-serif;
    }
    .score-label {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
    }
    .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 6px;
        margin-bottom: 12px;
    }
    .stat-card {
        padding: 8px 2px;
        border-radius: 6px;
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        text-align: center;
    }
    .stat-value {
        font-size: 1.2rem;
        font-weight: 700;
    }
    .stat-label {
        font-size: 9px;
        color: var(--vscode-descriptionForeground);
        margin-top: 1px;
    }
    .controls-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
    }
    .search-input {
        width: 100%;
        box-sizing: border-box;
        padding: 6px 10px;
        border-radius: 6px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        outline: none;
        font-size: 12px;
    }
    .search-input:focus {
        border-color: var(--vscode-focusBorder);
    }
    .filter-bar {
        display: flex;
        gap: 4px;
    }
    .filter-btn {
        flex: 1;
        padding: 5px;
        border-radius: 4px;
        border: 1px solid var(--vscode-panel-border);
        background: var(--vscode-editor-background);
        color: var(--vscode-foreground);
        font-size: 10.5px;
        cursor: pointer;
        font-weight: 500;
    }
    .filter-btn.active {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-border);
    }
    .refresh-btn {
        width: 100%;
        padding: 7px;
        border-radius: 6px;
        border: 1px solid var(--vscode-button-border);
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 12px;
    }
    .refresh-btn:hover {
        background: var(--vscode-button-hoverBackground);
    }
    .tabs-header {
        display: flex;
        border-bottom: 1px solid var(--vscode-panel-border);
        margin-bottom: 10px;
    }
    .tab-link {
        padding: 6px 12px;
        border: none;
        background: transparent;
        color: var(--vscode-descriptionForeground);
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
        position: relative;
        outline: none;
    }
    .tab-link.active {
        color: var(--vscode-foreground);
    }
    .tab-link.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--vscode-focusBorder);
    }
    .packages-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .package-card {
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        overflow: hidden;
        transition: border-color 0.2s;
    }
    .package-card:hover {
        border-color: var(--vscode-focusBorder);
    }
    .card-header {
        padding: 8px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        user-select: none;
    }
    .title-section {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .chevron {
        font-size: 8px;
        color: var(--vscode-descriptionForeground);
        transition: transform 0.2s;
        display: inline-block;
    }
    .package-card.expanded .chevron {
        transform: rotate(90deg);
    }
    .package-name {
        font-weight: 600;
        font-size: 11.5px;
        word-break: break-all;
    }
    .badge-section {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    .badge {
        font-size: 8.5px;
        font-weight: 600;
        padding: 1px 4px;
        border-radius: 3px;
        white-space: nowrap;
    }
    .badge-vulnerable {
        background: rgba(239, 68, 68, 0.12);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .badge-outdated {
        background: rgba(245, 158, 11, 0.12);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .badge-latest {
        background: rgba(34, 197, 94, 0.1);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.2);
    }
    .card-content {
        padding: 8px 10px 10px 10px;
        border-top: 1px solid var(--vscode-panel-border);
        font-size: 11px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
    }
    code {
        font-family: var(--vscode-editor-font-family, monospace);
        background: rgba(156, 163, 175, 0.12);
        padding: 1px 3px;
        border-radius: 3px;
    }
    .recommendation-box {
        background: rgba(59, 130, 246, 0.06);
        border-left: 2px solid #3b82f6;
        padding: 6px 8px;
        border-radius: 0 4px 4px 0;
    }
    .vuln-box {
        background: rgba(239, 68, 68, 0.06);
        border-left: 2px solid #ef4444;
        padding: 6px 8px;
        border-radius: 0 4px 4px 0;
    }
    .vuln-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2px;
    }
    .vuln-summary {
        margin: 2px 0 0 0;
        color: var(--vscode-descriptionForeground);
        font-size: 10.5px;
        line-height: 1.35;
    }
    .risk-high { color: #f87171; font-weight: 600; }
    .risk-medium { color: #fbbf24; font-weight: 600; }
    .risk-low { color: #60a5fa; font-weight: 600; }
    .priority-critical { color: #ef4444; font-weight: 700; text-transform: uppercase; }
    .priority-high { color: #f59e0b; font-weight: 600; text-transform: uppercase; }
    .priority-medium { color: #3b82f6; font-weight: 600; text-transform: uppercase; }
    .priority-low { color: var(--vscode-descriptionForeground); font-weight: 500; text-transform: uppercase; }
    .severity-critical { color: #ef4444; font-weight: 700; font-size: 8.5px; }
    .severity-high { color: #ef4444; font-weight: 700; font-size: 8.5px; }
    .severity-medium { color: #fbbf24; font-weight: 600; font-size: 8.5px; }
    .severity-low { color: #60a5fa; font-weight: 600; font-size: 8.5px; }
    .card-actions {
        display: flex;
        gap: 6px;
        margin-top: 4px;
    }
    .btn {
        flex: 1;
        padding: 5px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        text-align: center;
        border: 1px solid var(--vscode-button-border);
        text-decoration: none;
        box-sizing: border-box;
    }
    .btn-primary {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
    }
    .btn-primary:hover {
        background: var(--vscode-button-hoverBackground);
    }
    .btn-secondary {
        background: var(--vscode-button-secondaryBackground, rgba(156, 163, 175, 0.15));
        color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
        border-color: var(--vscode-button-border, transparent);
    }
    .btn-secondary:hover {
        background: var(--vscode-button-secondaryHoverBackground, rgba(156, 163, 175, 0.25));
    }
    .empty-state {
        text-align: center;
        padding: 24px 12px;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
    }
    .graph-node {
        margin-bottom: 6px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        background: var(--vscode-editor-background);
        padding: 8px 10px;
    }
    .graph-node-header {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        user-select: none;
    }
    .graph-node-children {
        margin-top: 6px;
        padding-left: 12px;
        border-left: 1px dashed var(--vscode-panel-border);
    }
    .graph-node.expanded .chevron {
        transform: rotate(90deg);
    }
    .node-name {
        font-size: 11.5px;
    }
`;

module.exports = {
    buildPackageRows,
    buildGraphTreeRows,
    styles
};
