# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability** (https://github.com/bajalabs/borda-kit/security/advisories/new). Do not open a public issue for a security problem.

Include what you found, how to reproduce it, and what an attacker could do with it. We aim to acknowledge a report within five working days and to agree on a disclosure date with you.

## Supported versions

Fixes go into the latest release. A site built from this template is your copy: update it from the template's releases.

## Scope

The kit builds a static site; it holds no secret and runs no server. Issues in scope include, for example: content from `content/` reaching the HTML unescaped (the Markdown subset, links, the accent colour), a gate that lets a secret-looking string through, or a dependency vulnerability that affects the build or the output. The lead form's endpoint is yours, not part of this repository.
