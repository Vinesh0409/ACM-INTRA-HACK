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

    let initialResults = [];
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Analysing dependencies...",
        cancellable: false
    }, async () => {
        initialResults = await versionAnalyzer();
    });
    provider.updateResults(initialResults);

    const watcher = startWatcher(async () => {
        provider.setLoading();
        let results = [];
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analysing dependencies...",
            cancellable: false
        }, async () => {
            results = await versionAnalyzer();
        });
        provider.updateResults(results);
    });

    const disposable = vscode.commands.registerCommand(
        "verdiff.scan",
        function () {
            vscode.window.showInformationMessage("Verdiff scanning...");
        },
    );

    context.subscriptions.push(disposable, watcher);
}

function deactivate() {}

module.exports = { activate, deactivate };