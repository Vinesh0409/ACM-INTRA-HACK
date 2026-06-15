function warningRange(document, dependencyName) {
    if (!dependencyName || typeof dependencyName !== "string") {
        return null;
    };
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

module.exports = {warningRange}