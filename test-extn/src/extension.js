const vscode = require('vscode');
const {startDependencyWatcher} = require('./dependency-watcher.js')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {


	console.log('Congratulations, your extension "test-extn" is now active!');
	
	const watcher = startDependencyWatcher(()=>{
		vscode.window.showInformationMessage('Analysing dependencies');
	})

	const disposable = vscode.commands.registerCommand('test-extn.helloWorld', function () {
		vscode.window.showInformationMessage('Hello World from test extn!');
	});

	context.subscriptions.push(disposable,watcher);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
