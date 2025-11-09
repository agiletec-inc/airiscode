# Publishing Guide

This document describes how to publish AIRIS Code to npm and Homebrew.

## Prerequisites

1. **npm account**: You need publish access to `@airiscode` scope
2. **GitHub release**: Create a tagged release for Homebrew

## Publishing to npm

### 1. Prepare for Release

```bash
# Ensure all tests pass
make test

# Build all packages
make build

# Update version (choose one)
cd apps/airiscode-cli
pnpm version patch  # 0.1.0 -> 0.1.1
pnpm version minor  # 0.1.0 -> 0.2.0
pnpm version major  # 0.1.0 -> 1.0.0
```

### 2. Publish to npm

```bash
# Login to npm (first time only)
npm login

# Publish from CLI package directory
cd apps/airiscode-cli
pnpm publish --access public

# Or use npm directly
npm publish --access public
```

### 3. Verify Publication

```bash
# Check on npm
npm view @airiscode/cli

# Test installation
npm install -g @airiscode/cli
airis --version
```

## Publishing to Homebrew

### 1. Create GitHub Release

```bash
# Tag the release
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0

# Or create release via GitHub UI
# https://github.com/agiletec-inc/airiscode/releases/new
```

### 2. Get Release SHA256

```bash
# Calculate SHA256 of release tarball
curl -L https://github.com/agiletec-inc/airiscode/archive/refs/tags/v0.1.0.tar.gz | shasum -a 256
```

### 3. Update Homebrew Formula

```bash
# Clone the tap repository
git clone https://github.com/agiletec-inc/homebrew-tap.git
cd homebrew-tap

# Copy updated formula
cp /path/to/airiscode/homebrew/airiscode.rb Formula/airiscode.rb

# Update version and SHA256 in Formula/airiscode.rb
# url "https://github.com/agiletec-inc/airiscode/archive/refs/tags/v0.1.0.tar.gz"
# sha256 "<calculated-sha256>"

# Commit and push
git add Formula/airiscode.rb
git commit -m "Update airiscode to v0.1.0"
git push
```

### 4. Test Homebrew Installation

```bash
# Test locally
brew install --build-from-source Formula/airiscode.rb

# Test from tap
brew uninstall airiscode
brew update
brew install agiletec-inc/tap/airiscode

# Verify
airis --version
```

## Version Strategy

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

### Version Workflow

```bash
# 1. Update version
cd apps/airiscode-cli
pnpm version <major|minor|patch>

# 2. Commit version bump
git add .
git commit -m "chore: bump version to v0.2.0"

# 3. Create git tag
git tag -a v0.2.0 -m "Release v0.2.0"

# 4. Push
git push && git push --tags

# 5. Publish to npm
pnpm publish --access public

# 6. Update Homebrew formula (see above)
```

## Release Checklist

Before publishing:

- [ ] All tests pass (`make test`)
- [ ] Build succeeds (`make build`)
- [ ] Version updated in `package.json`
- [ ] CHANGELOG.md updated
- [ ] README.md reflects new features
- [ ] Git tag created
- [ ] GitHub release created

After publishing:

- [ ] npm package published
- [ ] Homebrew formula updated
- [ ] Installation verified from both sources
- [ ] Documentation updated

## Troubleshooting

### npm publish fails with "403 Forbidden"

You need publish access to the `@airiscode` scope:

```bash
# Contact scope owner to add you as maintainer
# Or publish under different scope
```

### Homebrew install fails

Common issues:

1. **Wrong SHA256**: Recalculate after GitHub release
2. **Build failure**: Test with `--build-from-source` flag
3. **Missing dependencies**: Check formula dependencies

### Version mismatch

Ensure versions match across:
- `apps/airiscode-cli/package.json`
- Git tag (e.g., `v0.1.0`)
- Homebrew formula URL
- GitHub release

## Automated Publishing (Future)

Consider GitHub Actions for automated releases:

```yaml
# .github/workflows/publish.yml
name: Publish
on:
  push:
    tags:
      - 'v*'
jobs:
  publish-npm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm build
      - run: pnpm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
