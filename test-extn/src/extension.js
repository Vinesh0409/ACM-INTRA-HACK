const vscode = require("vscode");
const { startWatcher } = require("./dependency-watcher.js");
const { versionAnalyzer } = require('./version-analyzer.js');
const { DepTrackPanel } = require('./panel.js');

async function activate(context) {
    console.log('Congratulations, your extension "test-extn" is now active!');

    const provider = new DepTrackPanel();
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("deptrack.panel", provider)
    );

    vscode.window.showInformationMessage("Analysing dependencies");
    await versionAnalyzer();
    vscode.window.showInformationMessage("Analysed dependencies");

    const watcher = startWatcher(async () => {
        vscode.window.showInformationMessage("Analysing dependencies");
        await versionAnalyzer();
        vscode.window.showInformationMessage("Analysed dependencies");
        // panel bhi update karo
        provider.setLoading();
        await provider.runScan();
    });

    const disposable = vscode.commands.registerCommand(
        "test-extn.helloWorld",
        function () {
            vscode.window.showInformationMessage("Hello World from test extn!");
        },
    );

    context.subscriptions.push(disposable, watcher);
}

function deactivate() {}

module.exports = { activate, deactivate };