// Publish dist/ to the gh-pages branch.
//
// Replaces the `gh-pages` CLI, which passes every file in the branch to a single
// `git rm` and fails on Windows (ENAMETOOLONG) once the site has a few thousand files.
// This uses a temporary git worktree instead, so every git command takes one path.
//
//   npm run deploy            build + publish
//   npm run deploy -- --dry-run   build + commit locally, but don't push

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const WORKTREE = path.join(ROOT, ".gh-pages-worktree");
const BRANCH = "gh-pages";
const REMOTE = "origin";
const dryRun = process.argv.includes("--dry-run");

function git(args, options = {}) {
  return execFileSync("git", args, { cwd: ROOT, stdio: ["ignore", "pipe", "inherit"], encoding: "utf-8", ...options }).trim();
}

function tryGit(args, options) {
  try {
    return git(args, options);
  } catch {
    return null;
  }
}

if (!existsSync(path.join(DIST, "index.html"))) {
  console.error("dist/index.html not found - run `npm run build` first.");
  process.exit(1);
}

// Start from a clean worktree directory.
tryGit(["worktree", "remove", "--force", WORKTREE]);
rmSync(WORKTREE, { recursive: true, force: true });
tryGit(["worktree", "prune"]);

const remoteBranchExists = tryGit(["ls-remote", "--exit-code", "--heads", REMOTE, BRANCH]) !== null;
if (remoteBranchExists) {
  git(["fetch", REMOTE, BRANCH]);
  git(["worktree", "add", "--detach", WORKTREE, `${REMOTE}/${BRANCH}`]);
} else {
  git(["worktree", "add", "--detach", WORKTREE]);
  git(["checkout", "--orphan", BRANCH], { cwd: WORKTREE });
}

const wt = (args, options = {}) => git(args, { cwd: WORKTREE, ...options });

// Clear the old site, then copy the new build in.
wt(["rm", "-r", "-q", "-f", "--ignore-unmatch", "."]);
for (const entry of readdirSync(WORKTREE)) {
  if (entry !== ".git") rmSync(path.join(WORKTREE, entry), { recursive: true, force: true });
}
cpSync(DIST, WORKTREE, { recursive: true });
writeFileSync(path.join(WORKTREE, ".nojekyll"), "");

wt(["add", "-A"]);
if (wt(["status", "--porcelain"]) === "") {
  console.log("Nothing changed since the last deploy.");
} else {
  const source = git(["rev-parse", "--short", "HEAD"]);
  wt(["commit", "-q", "-m", `Deploy ${new Date().toISOString().slice(0, 16).replace("T", " ")} (from ${source})`]);
  if (dryRun) {
    console.log(`Dry run: commit created in ${WORKTREE} but not pushed.`);
    console.log(wt(["log", "--stat", "-1", "--format=%h %s"]).split("\n").slice(-1)[0]);
  } else {
    wt(["push", REMOTE, `HEAD:${BRANCH}`]);
    console.log(`Published to ${REMOTE}/${BRANCH}.`);
  }
}

git(["worktree", "remove", "--force", WORKTREE]);
