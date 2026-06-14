const vscode = require("vscode");
const path = require("path");

const deprecatedDecoration = vscode.window.createTextEditorDecorationType({
	// backgroundColor: "rgba(245, 158, 11, 0.15)",
	border: "1px solid rgba(245, 158, 11, 0.5)",
	borderRadius: "2px",
	overviewRulerColor: "rgba(245, 158, 11, 0.8)",
	overviewRulerLane: vscode.OverviewRulerLane.Right,
	after: {
		contentText: "  ⚠ Outdated",
		color: "rgba(245, 158, 11, 0.8)",
		fontStyle: "italic",
	},
});

const diagnosticCollection =
	vscode.languages.createDiagnosticCollection("test-extn");

function waringRange(document, dependencyName) {
    if (!dependencyName || typeof dependencyName !== "string") {
        return null;
    }
    console.log(dependencyName);
    const escapedName = dependencyName.replace(
		/[.*+?^${}()|[\]\\]/g,
		"\\$&"
	);
	const regex = new RegExp(`"${escapedName}"\\s*:`);

	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i);

		if (regex.test(line.text)) {
			return line.range;
		}
	}

	return null;
}

async function highlight(res) {
	if (!res || !res.path) {
		return;
	}
	const document = await vscode.workspace.openTextDocument(res.path);
	const diagnostics = [];
	const decorationOptions = [];
	for (const dependency in res) {
		if (dependency === "path") continue;
		if (Array.isArray(res[dependency])) {
			for (const dep of res[dependency]) {
				if (dep.status === "latest") continue;
				console.log(dep);
				const range = waringRange(document, dep.package);

				if (!range) continue;

				diagnostics.push(
					new vscode.Diagnostic(
						range,
						`${dep.package} is outdated (${dep.current} → ${dep.latest})`,
						vscode.DiagnosticSeverity.Warning,
					),
				);
				decorationOptions.push({
					range,
					hoverMessage: new vscode.MarkdownString(
						`### ${dep.package}\n\n` +
							`Current: ${dep.current}\n\n` +
							`Latest: ${dep.latest}`,
					),
				});
			}
		}
	}

	diagnosticCollection.set(document.uri, diagnostics);
	const editor = await vscode.window.showTextDocument(document, {
    preserveFocus: true,
    preview: false,
});

editor.setDecorations(deprecatedDecoration, decorationOptions);
}


module.exports = { highlight }