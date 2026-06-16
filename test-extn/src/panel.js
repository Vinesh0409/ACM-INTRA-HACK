const { versionAnalyzer } = require("./version-analyzer.js");

class DepTrackPanel {
    constructor() {
        this._view = null;
    }

    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };

        this.setLoading();

        this.runScan();

        webviewView.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === "refresh") {
                this.setLoading();
                await this.runScan();
            }
        });
    }

    setLoading() {
        if (!this._view) return;
        this._view.webview.html = `
            <!DOCTYPE html>
            <html>
            <body style="padding:16px;font-family:var(--vscode-font-family);color:var(--vscode-foreground);text-align:center;">
                <p style="margin-top:40px;">⏳ Scanning dependencies...</p>
            </body>
            </html>
        `;
    }

    async runScan() {
        const results = await versionAnalyzer();
        if (this._view) {
            this._view.webview.html = this.getHTML(results || []);
        }
    }

    getHTML(results) {
        let totalOutdated = 0;
        let totalMajor = 0;
        let totalMinor = 0;
        const allPackages = [];

        for (const res of results) {
            for (const key in res) {
                if (key === "path") continue;
                if (Array.isArray(res[key])) {
                    for (const dep of res[key]) {
                        if (dep.status === "latest") continue;
                        totalOutdated++;

                        const curMajor = parseInt(dep.current?.split(".")[0] || "0");
                        const latMajor = parseInt(dep.latest?.split(".")[0] || "0");
                        const isMajor = latMajor > curMajor;

                        if (isMajor) totalMajor++;
                        else totalMinor++;

                        allPackages.push({ ...dep, isMajor });
                    }
                }
            }
        }

        const score = Math.max(0, 100 - (totalMajor * 15) - (totalMinor * 5));
        const scoreColor = score > 75 ? "#22c55e" : score > 50 ? "#f59e0b" : "#ef4444";
        const emoji = score > 75 ? "🟢" : score > 50 ? "🟡" : "🔴";

        const packageRows = allPackages.map(p => `
            <div style="
                padding:8px 10px;
                margin-bottom:6px;
                border-radius:6px;
                border:1px solid var(--vscode-panel-border);
                background:var(--vscode-editor-background);
            ">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-weight:600;font-size:12px;">${p.package}</span>
                    <span style="
                        font-size:10px;
                        padding:2px 7px;
                        border-radius:999px;
                        background:${p.isMajor ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"};
                        color:${p.isMajor ? "#ef4444" : "#f59e0b"};
                        font-weight:500;
                    ">${p.isMajor ? "MAJOR" : "MINOR"}</span>
                </div>
                <div style="font-size:11px;color:var(--vscode-descriptionForeground);margin-top:3px;">
                    ${p.current} → ${p.latest}
                </div>
            </div>
        `).join("");

        return `<!DOCTYPE html>
        <html>
        <body style="padding:12px;font-family:var(--vscode-font-family);color:var(--vscode-foreground);">

            <div style="text-align:center;padding:16px;border-radius:8px;background:var(--vscode-editor-background);margin-bottom:12px;">
                <div style="font-size:40px;font-weight:700;color:${scoreColor};">${score}</div>
                <div style="font-size:11px;color:var(--vscode-descriptionForeground);">Health Score ${emoji}</div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                <div style="padding:10px;border-radius:6px;background:rgba(239,68,68,0.1);text-align:center;">
                    <div style="font-size:22px;font-weight:600;color:#ef4444;">${totalMajor}</div>
                    <div style="font-size:10px;color:var(--vscode-descriptionForeground);">Major</div>
                </div>
                <div style="padding:10px;border-radius:6px;background:rgba(245,158,11,0.1);text-align:center;">
                    <div style="font-size:22px;font-weight:600;color:#f59e0b;">${totalMinor}</div>
                    <div style="font-size:10px;color:var(--vscode-descriptionForeground);">Minor</div>
                </div>
            </div>

            <button onclick="refresh()" style="
                width:100%;
                padding:7px;
                margin-bottom:12px;
                border-radius:6px;
                border:1px solid var(--vscode-button-border);
                background:var(--vscode-button-background);
                color:var(--vscode-button-foreground);
                cursor:pointer;
                font-size:12px;
            ">🔄 Refresh</button>

            <div style="font-size:10px;font-weight:500;color:var(--vscode-descriptionForeground);margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">
                Outdated Packages
            </div>

            ${totalOutdated === 0
                ? `<div style="text-align:center;padding:24px;color:#22c55e;font-size:13px;">✅ All packages up to date!</div>`
                : packageRows
            }

            <script>
                const vscode = acquireVsCodeApi();
                function refresh() {
                    vscode.postMessage({ command: 'refresh' });
                }
            </script>

        </body>
        </html>`;
    }
}

module.exports = { DepTrackPanel };