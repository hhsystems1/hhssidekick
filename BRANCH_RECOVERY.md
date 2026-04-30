# Recovering a Commit Landed on the Wrong Branch

If you accidentally merged or committed to `codex` and meant to update `main`, use this workflow.

## 1) Identify the commit(s)

```bash
git log --oneline codex -n 10
```

Copy the SHA(s) you want on `main`.

## 2) Move the change to `main`

```bash
git checkout main
git pull origin main
git cherry-pick <commit_sha>
```

If there are conflicts, resolve them, then:

```bash
git add .
git cherry-pick --continue
```

## 3) Push `main`

```bash
git push origin main
```

## 4) (Optional) remove the accidental commit from `codex`

If the commit should **not** stay on `codex`:

```bash
git checkout codex
git reset --hard HEAD~1
git push --force-with-lease origin codex
```

> Only force-push if your team agrees.

## Safer alternative: open a PR

Instead of rewriting branch history, open a PR from `codex` into `main` and merge normally.
