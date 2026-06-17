const { buildPackageRows, buildGraphTreeRows, styles } = require("./templates");

function getHTML(results) {
    let healthScore = 100;
    let healthStatus = "GOOD";
    let totalPackages = 0;
    let totalOutdated = 0;
    let totalVulnerable = 0;
    let totalHighRisk = 0;
    let totalNodes = 0;
    let totalEdges = 0;
    const dependencyGraph = {};

    const deps = [];
    const devDeps = [];

    for (const res of results) {
        if (res.health_score) {
            healthScore = res.health_score.score ?? 100;
            healthStatus = res.health_score.status ?? "GOOD";
        }
        if (res.summary) {
            totalPackages += res.summary.total_packages ?? 0;
            totalOutdated += res.summary.outdated ?? 0;
            totalVulnerable += res.summary.vulnerable ?? 0;
            totalHighRisk += res.summary.high_risk ?? 0;
        }
        if (res.graph_stats) {
            totalNodes += res.graph_stats.nodes ?? 0;
            totalEdges += res.graph_stats.edges ?? 0;
        }
        if (res.dependency_graph) {
            Object.assign(dependencyGraph, res.dependency_graph);
        }

        if (Array.isArray(res.dependencies)) {
            deps.push(...res.dependencies);
        }
        if (Array.isArray(res.devDependencies)) {
            devDeps.push(...res.devDependencies);
        }
    }

    // Fallback calculation if summary fields are empty
    if (totalPackages === 0 && (deps.length > 0 || devDeps.length > 0)) {
        totalPackages = deps.length + devDeps.length;
        totalOutdated = deps.filter(d => d.status === "outdated").length + devDeps.filter(d => d.status === "outdated").length;
        totalVulnerable = deps.filter(d => d.vulnerable).length + devDeps.filter(d => d.vulnerable).length;
        totalHighRisk = deps.filter(d => d.risk === "HIGH").length + devDeps.filter(d => d.risk === "HIGH").length;
        
        const minorCount = totalOutdated - totalHighRisk;
        healthScore = Math.max(0, 100 - (totalHighRisk * 15) - (minorCount * 5));
        healthStatus = healthScore > 75 ? "GOOD" : healthScore > 50 ? "WARNING" : "CRITICAL";
    }

    const scoreColor = healthScore > 75 ? "#22c55e" : healthScore > 50 ? "#f59e0b" : "#ef4444";
    const statusEmoji = healthScore > 75 ? "🟢" : healthScore > 50 ? "🟡" : "🔴";

    const prodRows = buildPackageRows(deps, 'list-prod');
    const devRows = buildPackageRows(devDeps, 'list-dev');
    const graphRows = buildGraphTreeRows(dependencyGraph);

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            ${styles}
        </style>
    </head>
    <body>

        <div class="header-container">
            <div class="score-value" style="color: ${scoreColor};">${healthScore}</div>
            <div class="score-label">Health Score ${statusEmoji} ${healthStatus}</div>
        </div>

        <div class="stats-grid">
            <div class="stat-card" style="border-bottom: 2px solid #ef4444;">
                <div class="stat-value" style="color: #ef4444;">${totalVulnerable}</div>
                <div class="stat-label">Vulnerable</div>
            </div>
            <div class="stat-card" style="border-bottom: 2px solid #f59e0b;">
                <div class="stat-value" style="color: #f59e0b;">${totalOutdated}</div>
                <div class="stat-label">Outdated</div>
            </div>
            <div class="stat-card" style="border-bottom: 2px solid #3b82f6;">
                <div class="stat-value" style="color: #3b82f6;">${totalPackages}</div>
                <div class="stat-label">Total</div>
            </div>
        </div>

        <button class="refresh-btn" onclick="refresh()">🔄 Refresh Scan</button>

        <div class="controls-section">
            <input type="text" id="search-box" class="search-input" placeholder="🔍 Search packages..." oninput="applyFilters()">
            <div class="filter-bar">
                <button id="filter-btn-all" class="filter-btn active" onclick="setFilter('all')">All</button>
                <button id="filter-btn-outdated" class="filter-btn" onclick="setFilter('outdated')">Outdated</button>
                <button id="filter-btn-vulnerable" class="filter-btn" onclick="setFilter('vulnerable')">⚠️ Vulnerable</button>
            </div>
        </div>

        <div class="tabs-header">
            <button id="tab-link-prod" class="tab-link active" onclick="switchTab('prod')">Dependencies</button>
            <button id="tab-link-dev" class="tab-link" onclick="switchTab('dev')">Dev Dependencies</button>
            <button id="tab-link-graph" class="tab-link" onclick="switchTab('graph')">Dependency Graph</button>
        </div>

        <div id="list-prod" class="packages-list" style="display: flex;">
            ${prodRows}
        </div>

        <div id="list-dev" class="packages-list" style="display: none;">
            ${devRows}
        </div>

        <div id="list-graph" class="packages-list" style="display: none; flex-direction: column; gap: 8px;">
            <div class="graph-stats-summary" style="margin-bottom: 12px; padding: 10px; border-radius: 6px; background: rgba(59, 130, 246, 0.05); border: 1px solid var(--vscode-panel-border); font-size: 11px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span><strong>Total Graph Nodes:</strong></span>
                    <span>${totalNodes}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span><strong>Total Connections (Edges):</strong></span>
                    <span>${totalEdges}</span>
                </div>
            </div>
            <div class="graph-tree-container">
                ${graphRows}
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();

            function refresh() {
                vscode.postMessage({ command: 'refresh' });
            }

            function toggleCard(headerElement) {
                const card = headerElement.parentElement;
                const content = card.querySelector('.card-content');
                const isExpanded = card.classList.contains('expanded');
                
                if (isExpanded) {
                    card.classList.remove('expanded');
                    content.style.display = 'none';
                } else {
                    card.classList.add('expanded');
                    content.style.display = 'flex';
                }
            }

            let activeTab = 'prod';
            let activeFilter = 'all';

            function switchTab(tab) {
                activeTab = tab;
                document.querySelectorAll('.tab-link').forEach(el => el.classList.remove('active'));
                document.getElementById('tab-link-' + tab).classList.add('active');
                
                document.getElementById('list-prod').style.display = tab === 'prod' ? 'flex' : 'none';
                document.getElementById('list-dev').style.display = tab === 'dev' ? 'flex' : 'none';
                document.getElementById('list-graph').style.display = tab === 'graph' ? 'flex' : 'none';
                
                const controlsEl = document.querySelector('.controls-section');
                if (tab === 'graph') {
                    controlsEl.style.display = 'none';
                } else {
                    controlsEl.style.display = 'flex';
                    applyFilters();
                }
            }

            function setFilter(filter) {
                activeFilter = filter;
                document.querySelectorAll('.filter-btn').forEach(el => el.classList.remove('active'));
                document.getElementById('filter-btn-' + filter).classList.add('active');
                
                applyFilters();
            }

            function toggleGraphNode(headerElement) {
                const node = headerElement.parentElement;
                const childrenContainer = node.querySelector('.graph-node-children');
                const isExpanded = node.classList.contains('expanded');
                
                if (isExpanded) {
                    node.classList.remove('expanded');
                    childrenContainer.style.display = 'none';
                } else {
                    node.classList.add('expanded');
                    childrenContainer.style.display = 'block';
                }
            }

            function applyFilters() {
                const searchQuery = document.getElementById('search-box').value.toLowerCase();
                const listId = activeTab === 'prod' ? 'list-prod' : 'list-dev';
                
                // Hide the inactive list entirely to prevent filters overlapping visually
                const otherListId = activeTab === 'prod' ? 'list-dev' : 'list-prod';
                document.getElementById(otherListId).style.display = 'none';
                document.getElementById(listId).style.display = 'flex';

                const cards = document.getElementById(listId).querySelectorAll('.package-card');
                let visibleCount = 0;
                
                cards.forEach(card => {
                    const name = card.getAttribute('data-name');
                    const isVulnerable = card.getAttribute('data-vulnerable') === 'true';
                    const isOutdated = card.getAttribute('data-status') === 'outdated';
                    
                    let matchSearch = name.includes(searchQuery);
                    let matchFilter = true;
                    
                    if (activeFilter === 'outdated') {
                        matchFilter = isOutdated;
                    } else if (activeFilter === 'vulnerable') {
                        matchFilter = isVulnerable;
                    }
                    
                    if (matchSearch && matchFilter) {
                        card.style.display = 'block';
                        visibleCount++;
                    } else {
                        card.style.display = 'none';
                    }
                });
                
                const emptyEl = document.getElementById(listId + '-empty');
                if (visibleCount === 0) {
                    emptyEl.style.display = 'block';
                } else {
                    emptyEl.style.display = 'none';
                }
            }

            function copyInstall(pkg, version) {
                const command = 'npm install ' + pkg + '@' + version;
                navigator.clipboard.writeText(command).then(() => {
                    vscode.postMessage({ command: 'showNotification', text: 'Copied to clipboard: ' + command });
                });
            }
        </script>

    </body>
    </html>`;
}

module.exports = {
    getHTML
};
