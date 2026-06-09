# Contributing

Contributions to this repository are very welcome. If this is your first contribution to the repository, please ensure that you have carefully read and understood the entirety of this contributing guide and our [AI Policy](https://github.com/AI-SDC/ACRO/blob/main/AI_POLICY.md).

Please create an issue before starting any significant work so that we can discuss and understand the changes before you invest time in it. You can contact us directly or use the [issue tracking system](https://github.com/AI-SDC/SACRO-Viewer/issues). Once agreed, external collaborators should fork the project and submit a pull request (PR). If you are a member of the repository team, your changes should be made in a feature branch before opening a PR.

## Pull Request Standards

All PRs must meet the following requirements before being accepted.

### Provenance and legal

- Contributors assert copyright ownership and release their contribution under the MIT License.
- If work is copied from another open source repository, the license must be checked and included.

### Code quality

- The PR is small and addresses a single specific issue.
- Code is high quality. This includes: small focused functions and modules, no duplication, fully documented, extensive use of type hints, no unused arguments, no more than 3 levels of nesting except in rare justified cases, no bloat.
- No inline pragmas. If a rule suppression is genuinely necessary, add a per-file setting to `pyproject.toml` to keep the source code clean.
- New dependencies are added to `requirements.prod.in` (and compiled to `requirements.prod.txt`).
- All pre-commit checks pass, including automatic formatting and linting. Run pre-commit locally before opening a PR.

### Tests

- All existing tests pass.
- New code is accompanied by appropriate tests.
- Code coverage is at least 95% statement coverage.
- Tests verify real-world effects, not just that lines of code execute.
- Run the full test suite locally before opening a PR. CI minutes are not unlimited.

### Pull request description

- The PR title follows Conventional Commits format.
- The description is short, written in your own words, and explains what changed and why.
- Do not add issue or PR numbers to the title manually. To close an issue automatically, add the closing keyword in a comment instead.

## Development

### System Requirements

- Python 3.10
- Node.js v20
- [just](https://github.com/casey/just)

### Setting up your development environment

Clone the repository and install the dependencies:

```bash
git clone https://github.com/AI-SDC/SACRO-Viewer.git
cd SACRO-Viewer
just devenv
```

This sets up a virtual environment and installs both Python and Node.js dependencies.

### Running tests

Run all tests:

```bash
just test
```

Run Cypress end-to-end tests (ensure the development server is running first with `just run`):

```bash
just test-e2e
```

Or open the Cypress UI:

```bash
just test-cypress
```

### Running the development server

Start the Django development server:

```bash
just run
```

The application will be available at `http://127.0.0.1:8000`.

### Code formatting and linting

Check code quality without making changes:

```bash
just check
```

Automatically fix formatting and linting issues:

```bash
just fix
```

This runs:
- Black for Python formatting
- Ruff for Python linting
- ESLint for JavaScript linting

## Directory Structure

| Directory | Contents |
|-----------|----------|
| `sacro` | SACRO-Viewer Django application source code |
| `sacro-app` | Electron app wrapper and installer configuration |
| `assets` | Frontend JavaScript and CSS source files |
| `tests` | Python unit tests |
| `cypress` | End-to-end tests using Cypress |
| `data` | Test data files and data generation scripts |
| `docs` | Sphinx documentation |

## Pre-commit

Code quality is maintained through pre-commit hooks. A `.pre-commit-config.yaml` configuration file is provided to automatically handle:

- Trimming trailing whitespace and fixing line endings
- Validating JSON, TOML, YAML files
- Checking for common issues
- Formatting and linting with Black and Ruff

The pre-commit hooks are automatically installed when you run `just devenv`.

To manually run pre-commit on all files:

```bash
$BIN/pre-commit run -a
```

Or if pre-commit is installed separately:

```bash
pre-commit run -a
```

## Pull Request Titles

PR titles must follow the Conventional Commits specification. Individual commit messages within a branch are unrestricted, but the PR title is used to generate release notes and must be correct.

### Format

```
<type>[optional scope]: <description>
```

### Example

```
feat: add output filtering by status
```

### Types

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting or styling with no logic change |
| `refactor` | Code restructuring without feature or bug impact |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Build system or dependency changes |
| `ci` | CI configuration or script changes |
| `chore` | Miscellaneous maintenance |
| `revert` | Reverting an earlier commit |

To flag a breaking change, append `!` to the type: `refactor!: renamed foo() to goo()`.

### Why we use Conventional Commit PR titles

We require PR titles to follow the Conventional Commits format because it:

- Clearly communicates intent - reviewers can immediately see whether a PR is a feat, fix, chore, etc.
- Improves git history navigation - makes it easy to scan and understand changes over time.
- Aligns with Semantic Versioning (SemVer) - structured titles help determine version bumps automatically.
- Supports better PR labeling and filtering - PRs are labeled by type, making them easier to prioritise and review.
- Flags breaking changes - adding `!` (e.g. `feat!:`) automatically marks a PR as a breaking change.
