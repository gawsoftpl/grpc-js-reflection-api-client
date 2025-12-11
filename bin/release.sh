#!/usr/bin/env bash
set -e  # Exit immediately on error

# Ensure package.json exists
if [ ! -f package.json ]; then
  echo "❌ package.json not found!"
  exit 1
fi

# Read current version from package.json
CURRENT_VERSION=$(grep '"version"' package.json | sed -E 's/.*"version": *"([^"]+)".*/\1/')

if [[ -z "$CURRENT_VERSION" ]]; then
  echo "❌ Could not read current version from package.json"
  exit 1
fi

# Auto-increment patch version
IFS='.' read -r MAJOR MINOR PATCH <<< "$(echo "$CURRENT_VERSION" | sed 's/-.*//')"   # strip prerelease suffix for bump
PATCH=$((PATCH + 1))
DEFAULT_VERSION="${MAJOR}.${MINOR}.${PATCH}"

echo "Current version: $CURRENT_VERSION"
read -p "Enter new version (press Enter for ${DEFAULT_VERSION}): " VERSION

# If empty, use default patch bump
if [ -z "$VERSION" ]; then
  VERSION="$DEFAULT_VERSION"
fi

echo "🔧 Updating package.json to version $VERSION..."

# Works on macOS and Linux
sed -i.bak -E "s/\"version\": *\"[^\"]+\"/\"version\": \"$VERSION\"/" package.json
rm -f package.json.bak

grep '"version"' package.json

# Commit the change
git add package.json
git commit -m "chore(release): bump version to $VERSION"

# Create tag
TAG="v$VERSION"
git tag -a "$TAG" -m "Release $TAG"

# Push
git push origin main
git push origin "$TAG"

echo "✅ Release $TAG created and pushed!"
