const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('github_token');
    const octokit = github.getOctokit(token);
    const { context } = github;

    const { owner, repo } = context.repo;
    const release = context.payload.release;

    // List recent commits (optional, still real data)
    const commits = await octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: release.target_commitish,
      per_page: 10
    });

    const commitMessages = commits.data.map(c => `- ${c.commit.message}`).join("\n");

    // --- MOCK OpenAI ---
    const notes = `
## Features
- Example feature from commit messages

## Fixes
- Example fix from commit messages

## Chores
- Example chore from commit messages
`;

    // Update the release with mock notes
    await octokit.rest.repos.updateRelease({
      owner,
      repo,
      release_id: release.id,
      body: notes
    });

    console.log("✅ Release notes updated with mock data!");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
