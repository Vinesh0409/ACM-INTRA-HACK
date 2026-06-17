const {highlight} = require("./code-highlighter/highlighter.js")
const { getdependencies } = require("./extracter.js");
const axios = require("axios");

const versionAnalyzer = async () => {
	const dependencies = await getdependencies();
	const results = [];
	for (const dep of dependencies) {
		try {
			const res = await axios.post("http://127.0.0.1:8000/api/scan", dep);
			results.push(res.data);
		} catch (error) {
			console.error(error);
		}
	}
	for (const res of results) {
		highlight(res);
	}

	return results;
};

module.exports = { versionAnalyzer };
