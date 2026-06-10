const vscode = require("vscode");

function startDependencyWatcher(onDependencyChange) {
	const watcher = vscode.workspace.createFileSystemWatcher(
		"**/{package.json,package-lock.json,yarn.lock,pnpm-lock.yaml,requirements.txt,pyproject.toml,poetry.lock,Pipfile,Pipfile.lock}",
	);

    watcher.onDidChange(() => {
        console.log("dependency file changed");
        onDependencyChange();
    });
    
    watcher.onDidCreate(() => {
        console.log("dependency file created");
        onDependencyChange();
    });
    
    watcher.onDidDelete(() => {
        console.log("dependency file deleted");
        onDependencyChange();
    });


    
    
    return watcher;
}

module.exports = {startDependencyWatcher};
