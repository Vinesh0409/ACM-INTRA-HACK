const semver = require("semver");
const { getChangelogs } = require("./getChangelogs.js");

const getChangesBetweenVersions = async (
	repoUrl,
	currentVersion,
	latestVersion,
) => {
	const releases = await getChangelogs(repoUrl);
	const current = semver.coerce(currentVersion);
	const latest = semver.coerce(latestVersion);

	const relaventReleases = releases.filter((release) => {
		const version = semver.coerce(release.version);
		if (!version) {
			return false;
		}
		return semver.gt(version, current) && semver.lte(version, latest);
	});
    
    return relaventReleases;
};

module.exports = {getChangesBetweenVersions};