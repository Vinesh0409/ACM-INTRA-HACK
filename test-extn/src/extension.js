const vscode = require("vscode");
const { startWatcher } = require("./dependency-watcher.js");
const { getdependencies } = require("./extracter.js");

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('Congratulations, your extension "test-extn" is now active!');
	const dependency = await getdependencies();
	console.log(dependency);

	const watcher = startWatcher(async () => {
		vscode.window.showInformationMessage("Analysing dependencies");
		const dependency = await getdependencies();
		console.log(dependency);
	});

	const disposable = vscode.commands.registerCommand(
		"test-extn.helloWorld",
		function () {
			vscode.window.showInformationMessage("Hello World from test extn!");
		},
	);

	context.subscriptions.push(disposable, watcher);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate,
};
