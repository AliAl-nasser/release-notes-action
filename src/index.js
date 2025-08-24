const core = require('@actions/core');
const github = require('@actions/github');
const OpenAI = require('openai');

async function run() {
  try {
    const token = core.getInput('github_token');
    const openaiKey = core.getInput('openai_api_key');
    const octokit = github.getOctokit(token);
    const { context } = github;

    const { owner, repo } = context.repo;
    const release = context.payload.release;

    // 1. Get commits since last release
    const commits = await octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: release.target_commitish,
      per_page: 50
    });

    const commitMessages = commits.data.map(c => `- ${c.commit.message}`).join("\n");

    // 2. Summarize with OpenAI
    const client = new OpenAI({ apiKey: openaiKey });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Categorize commit messages into Features, Fixes, and Chores. Format in Markdown."
        },
        {
          role: "user",
          content: commitMessages
        }
      ]
    });

    const notes = response.choices[0].message.content;

    // 3. Update the release notes
    await octokit.rest.repos.updateRelease({
      owner,
      repo,
      release_id: release.id,
      body: notes
    });

    console.log("✅ Release notes updated!");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
