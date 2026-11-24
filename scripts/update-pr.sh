#!/usr/bin/env bash
# update-pr.sh <branch> <title> <body-file> <paths...>
# Commits <paths> to <branch> (from the current main) and opens or updates its PR; used by update.yml.
# If the repository does not allow Actions to create PRs, the branch is still pushed and the run
# summary gives the link to open the PR by hand.
set -euo pipefail
branch=$1 title=$2 body=$3
shift 3

git config user.name 'github-actions[bot]'
git config user.email '41898283+github-actions[bot]@users.noreply.github.com'
git checkout -B "$branch"
git add -- "$@"
# Only fetch and generation times changed: no PR (a weekly no-op would be noise).
real=$(git diff --cached -U0 | grep -E '^[+-]' | grep -vE '^(\+\+\+|---) ' |
  grep -vE '"(fetchedAt|generatedAt|asOf)": ' || true)
if [ -z "$real" ]; then
  echo "No changes for $branch (timestamps only)." | tee -a "$GITHUB_STEP_SUMMARY"
  exit 0
fi
git commit -q -m "chore: ${title,,} $(date -u +%F) (update.yml)"
git push -f origin "$branch"

# CI's pull_request trigger does not fire for PRs made with GITHUB_TOKEN; workflow_dispatch does.
gh workflow run CI --ref "$branch" || echo "Could not start CI on $branch."

state=$(gh pr view "$branch" --json state -q .state 2>/dev/null || true)
if [ "$state" = "OPEN" ]; then
  gh pr edit "$branch" --title "$title $(date -u +%F)" --body-file "$body"
elif ! gh pr create --base main --head "$branch" --title "$title $(date -u +%F)" --body-file "$body"; then
  {
    echo "Could not open the PR (allow Actions to create pull requests in the repository settings)."
    echo "Open it by hand: https://github.com/$GITHUB_REPOSITORY/compare/main...$branch?expand=1"
    echo
    cat "$body"
  } >> "$GITHUB_STEP_SUMMARY"
fi
