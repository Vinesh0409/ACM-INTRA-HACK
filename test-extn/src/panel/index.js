const vscode = require("vscode");
const { versionAnalyzer } = require("../version-analyzer.js");
const { getHTML } = require("./htmlBuilder");

class DepTrackPanel {
    constructor() {
        this._view = null;
        this._results = [];
    }

    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };

        if (this._results && this._results.length > 0) {
            webviewView.webview.html = getHTML(this._results);
        } else {
            this.setLoading();
            this.runScan();
        }

        webviewView.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === "refresh") {
                this.setLoading();
                await this.runScan();
            } else if (msg.command === "showNotification") {
                vscode.window.showInformationMessage(msg.text);
            }
        });
    }

    setLoading() {
        if (!this._view) return;
        this._view.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        padding: 24px 16px;
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        text-align: center;
                        background-color: var(--vscode-sidebar-background);
                    }
                    .loader {
                        display: inline-block;
                        width: 24px;
                        height: 24px;
                        border: 3px solid rgba(59, 130, 246, 0.2);
                        border-radius: 50%;
                        border-top-color: #3b82f6;
                        animation: spin 1s ease-in-out infinite;
                        margin-bottom: 16px;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    .text {
                        font-size: 13px;
                        color: var(--vscode-descriptionForeground);
                    }
                </style>
            </head>
            <body>
                <div class="loader"></div>
                <div class="text">Analyzing project dependencies...</div>
            </body>
            </html>
        `;
    }

    updateResults(results) {
        this._results = results || [];
        if (this._view) {
            this._view.webview.html = getHTML(this._results);
        }
    }

    async runScan() {
        let results = [];
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing dependencies...",
            cancellable: false
        }, async () => {
            results = await versionAnalyzer();
        });
        this.updateResults(results);
    }
}

module.exports = { DepTrackPanel };
