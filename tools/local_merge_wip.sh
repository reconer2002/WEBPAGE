#!/usr/bin/env bash
set -euo pipefail

# Local-only merge helper
# - Merges your WIP branch into RamaMasMasNueva without any network access
# - Keeps backend/ and DB from RamaMasMasNueva (ours)
# - Keeps all other changes from WIP (theirs)
# - Blocks pushes to WIP/local-merge via a local pre-push hook

BASE_BRANCH=${BASE_BRANCH:-RamaMasMasNueva}
WIP_BRANCH=${1:-}

if [ -z "$WIP_BRANCH" ]; then
  # default to current branch if none provided
  WIP_BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi

echo "[info] Base: $BASE_BRANCH | WIP: $WIP_BRANCH"

# Ensure we have a clean index for safety
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[info] Guardando cambios locales en un commit WIP (solo local)"
  git add -A
  git -c user.name="Local WIP" -c user.email="wip@example.com" \
    commit -m "WIP local auto before local merge"
fi

echo "[step] Checkout base branch: $BASE_BRANCH"
git checkout "$BASE_BRANCH"

MERGE_BRANCH="local-merge-${BASE_BRANCH}-$(date +%Y%m%d-%H%M%S)"
echo "[step] Crear rama de trabajo: $MERGE_BRANCH"
git checkout -b "$MERGE_BRANCH"

echo "[step] Merge (no-commit, no-ff) de $WIP_BRANCH"
git merge --no-commit --no-ff "$WIP_BRANCH" || true

echo "[step] Resolver conflictos priorizando backend/ y DB del base"
conflicts=$(git diff --name-only --diff-filter=U || true)
if [ -n "$conflicts" ]; then
  while IFS= read -r f; do
    case "$f" in
      backend/*|backend|backend/.env|backend/sql/*|MentesCreativasStore-2.sql)
        echo "  ours -> $f"; git checkout --ours -- "$f" || true; git add -- "$f" || true ;;
      *)
        echo "  theirs -> $f"; git checkout --theirs -- "$f" || true; git add -- "$f" || true ;;
    esac
  done <<< "$conflicts"
fi

echo "[step] Finalizar merge local"
git commit -m "Local merge: $WIP_BRANCH -> $BASE_BRANCH (backend/BD from base)"

echo "[step] Desvincular upstream para evitar push accidental"
git branch --unset-upstream 2>/dev/null || true

echo "[step] Instalar hook pre-push para bloquear ramas WIP/local-merge"
HOOK=".git/hooks/pre-push"
mkdir -p .git/hooks
cat > "$HOOK" <<'HOOK'
#!/bin/sh
# Bloquea pushes desde/ hacia ramas WIP o local-merge*
set -e
[ "$ALLOW_WIP_PUSH" = "1" ] 2>/dev/null && exit 0
current=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true)
case "$current" in
  wip*|WIP*|*wip*|local-merge-*) echo "Push bloqueado para rama $current"; exit 1;;
esac
blocked=0
while read local_ref local_sha remote_ref remote_sha; do
  br=${remote_ref#refs/heads/}
  case "$br" in wip*|WIP*|*wip*|local-merge-*) blocked=1;; esac
done
[ $blocked -eq 1 ] && { echo "Push bloqueado (destino WIP/local-merge)"; exit 1; }
exit 0
HOOK
chmod +x "$HOOK" 2>/dev/null || true

echo ""
echo "[ok] Merge local listo en rama: $MERGE_BRANCH"
echo "    - Para usar el resultado en $BASE_BRANCH (solo local):"
echo "      git checkout $BASE_BRANCH && git merge --ff-only $MERGE_BRANCH && git branch --unset-upstream"
echo "    - Ver cambios: git log --oneline --graph --decorate"
echo "    - No se ha hecho ningún push ni fetch."

