import { buffer } from "stream/consumers";

const vscode = require("vscode");

const getdependencies = async () => {
    const files = await vscode.workspace.findFiles(
        "**/{package.json,package-lock.json,yarn.lock,pnpm-lock.yaml,requirements.txt,pyproject.toml,poetry.lock,Pipfile,Pipfile.lock}"
    );

    if (files.length === 0) {
        return [];
    }


    const dependency = await Promise.all(
        files.map(async (file) => {
            const content = await vscode.workspace.fs.readFile(file);

            return {
                path: file.fsPath,
                content: Buffer.from(content).toString('utf-8')
            }
        })
    );

    return dependency;
}
module.exports = { getdependencies };