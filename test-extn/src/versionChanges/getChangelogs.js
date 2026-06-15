const axios = require("axios");

const getChangelogs = async (repoUrl) =>{

    const cleanUrl = repoUrl.replace(".git","");
    const parts = cleanUrl.split("/");
    const owner = parts[parts.length-2];
    const repo = parts[parts.length-1];

    try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases`)
        const releases = response.data.map(release => ({
                version: release.tag_name,
                title: release.name,
                changelog: release.body,
                publishedAt: release.published_at
            }))

        return releases
        
    } catch (error) {
        console.log("no changelogs")
        return "no data available";
    }
}

module.exports = {getChangelogs}
