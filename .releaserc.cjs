module.exports = {
  "branches": [
    { "name": "main" },
    { "name": "prerelease", "channel": "pre", "prerelease": true }
  ],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md"
      }
    ],
    "@semantic-release/npm",
    [
      "@semantic-release/gitlab",
      {
        "repositoryUrl": process.env.REPOSITORY_URL
      }
    ],
    "@semantic-release/github",
    [
      "@semantic-release/exec",
      {
        "verifyConditionsCmd": "bash ./scripts/publish.sh --action verify --base-path ${config.basePath} --project ${config.project}",
        "publishCmd": "bash ./scripts/publish.sh --action publish --base-path ${config.basePath} --project ${config.project} --version ${nextRelease.version} --channel ${nextRelease.channel || 'latest'} --assets ${config.assets.join(',')}",
        "project": "js-sdk",
        "assets": ["dist", "doc"],
        "basePath": "s3://baqend-website"
      }
    ],
    [
      "@semantic-release/git",
      {
        "repositoryUrl": process.env.REPOSITORY_URL,
        "assets": ["package.json", "package-lock.json", "CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ]
  ]
}