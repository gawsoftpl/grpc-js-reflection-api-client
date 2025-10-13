#!/usr/bin/env bash
set -e  # Exit immediately on error

# Ask for version number
read -p "Enter new version (e.g., 1.3.2-beta-0): " VERSION

# Check if input is empty
if [ -z "$VERSION" ]; then
  echo "❌ Version cannot be empty."
  exit 1
fi

# Check if package.json exists
if [ ! -f package.json ]; then
  echo "❌ package.json not found!"
  exit 1
fi

# Update version field in package.json
echo "🔧 Updating package.json to version $VERSION..."
# Works on macOS and Linux
sed -i.bak -E "s/\"version\": *\"[^\"]+\"/\"version\": \"$VERSION\"/" package.json
rm -f package.json.bak

# Show updated version line for confirmation
grep '"version"' package.json

# Commit the change
git add package.json
git commit -m "chore(release): bump version to $VERSION"

# Create a new git tag
TAG="v$VERSION"
git tag -a "$TAG" -m "Release $TAG"

# Push changes and tag
git push origin main
git push origin "$TAG"

echo "✅ Release $TAG created and pushed!"
