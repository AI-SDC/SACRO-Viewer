==================
Contribution Guide
==================

This guide provides information for developers who want to contribute to SACRO Viewer, set up a development environment, or understand the codebase structure.

Getting Started
===============

System Requirements
------------------

**Required Software:**

* Python 3.10 or later
* Node.js v20 or later
* `just <https://github.com/casey/just>`_ task runner
* Git

**Platform-Specific Requirements:**

*Windows:*
  * Visual Studio Community with C++ Desktop Development tools
  * Git Bash (recommended terminal)
  * Windows Terminal (recommended)

*Linux:*
  * Build essentials (gcc, make, etc.)
  * Development headers for Python

*macOS:*
  * Xcode Command Line Tools
  * Homebrew (recommended package manager)

Setting Up Development Environment
=================================

Clone and Setup
--------------

.. code-block:: bash

   # Clone the repository
   git clone https://github.com/AI-SDC/SACRO-Viewer.git
   cd SACRO-Viewer

   # Install Python dependencies
   just install

   # Install Node.js dependencies
   npm install

   # Generate test data
   just test-outputs

Running in Development Mode
--------------------------

**Start the Django Development Server:**

.. code-block:: bash

   just run

This starts the web application at ``http://127.0.0.1:8000`` with hot-reload enabled.

**Start the Asset Development Server (Optional):**

For frontend development with hot-reload:

.. code-block:: bash

   # In a separate terminal
   export DJANGO_VITE_DEV_MODE=true
   just assets-run

**Run the Electron App in Development:**

.. code-block:: bash

   # Start Django server first
   just run &

   # Set the URL and start Electron
   export SACRO_URL=http://127.0.0.1:8000
   just sacro-app/run

Project Structure
================

.. code-block:: text

   sacro-viewer/
   ├── sacro/                    # Django web application
   │   ├── adapters/            # External integrations
   │   ├── templates/           # HTML templates
   │   ├── staticfiles/         # Compiled static assets
   │   ├── models.py           # Data models and ACRO parsing
   │   ├── views.py            # HTTP request handlers
   │   ├── settings.py         # Django configuration
   │   └── urls.py             # URL routing
   ├── sacro-app/              # Electron application
   │   ├── src/                # Electron main process code
   │   ├── styles/             # CSS for Electron windows
   │   ├── main.js             # Electron entry point
   │   └── package.json        # Electron dependencies
   ├── assets/                 # Frontend source code
   │   └── src/                # JavaScript and CSS sources
   ├── tests/                  # Python unit tests
   ├── cypress/                # End-to-end tests
   ├── docs/                   # Documentation source
   ├── data/                   # Test data generation
   ├── outputs/                # Sample ACRO outputs
   └── justfile                # Task definitions

Core Components
==============

Django Web Application
---------------------

**Models (sacro/models.py)**

The core data model is ``ACROOutputs``, which handles:

* Loading and parsing ACRO metadata files
* Validating file structure and content
* Generating URLs and checksums
* Creating scaffolded metadata for non-ACRO files

Key functions:

.. code-block:: python

   # Load ACRO outputs from a directory
   outputs = models.load_from_path(path_to_json)

   # Get file path for an output
   file_path = outputs.get_file_path(output_id, filename)

   # Auto-detect ACRO metadata
   metadata_path = models.find_acro_metadata(directory_path)

**Views (sacro/views.py)**

HTTP endpoints that handle:

* Directory loading and output display
* Secure file content delivery
* Review creation and management
* Release package generation

**Templates (sacro/templates/)**

Django templates using:

* Base template with common layout
* Component-based template organization
* Tailwind CSS for styling
* Minimal JavaScript for interactivity

Electron Application
-------------------

**Main Process (sacro-app/main.js)**

Handles:

* Application lifecycle (startup, shutdown)
* Python server management
* Native OS integration (menus, dialogs)
* Window management

**Key Features:**

.. code-block:: javascript

   // Start Python server
   const server = startServer();

   // Create application window
   const window = createWindow(serverUrl);

   // Handle file dialogs
   const directory = await dialog.showOpenDialog({
     properties: ['openDirectory']
   });

Frontend Assets
--------------

**Build System (Vite)**

Modern build tooling providing:

* Hot module replacement in development
* Asset bundling and optimization
* CSS processing with Tailwind
* Legacy browser support

**JavaScript (assets/src/scripts/)**

Vanilla JavaScript for:

* File content display and formatting
* Review form handling
* UI state management
* Native file opening integration

Development Workflow
===================

Making Changes
-------------

**Backend Changes (Python):**

1. Modify code in ``sacro/`` directory
2. Django dev server auto-reloads
3. Run tests: ``just test``
4. Check code style: ``just lint``

**Frontend Changes (CSS/JS):**

1. Modify files in ``assets/src/``
2. Vite dev server provides hot-reload
3. Build assets: ``just assets-build``
4. Test in Electron: ``just sacro-app/run``

**Electron Changes:**

1. Modify files in ``sacro-app/``
2. Restart Electron app to see changes
3. Test packaging: ``just sacro-app/build``

Testing
======

Unit Tests
---------

Python unit tests using pytest:

.. code-block:: bash

   # Run all tests
   just test

   # Run specific test file
   just test tests/test_models.py

   # Run with coverage
   just test --cov

**Test Structure:**

* ``tests/test_models.py``: ACRO parsing and data models
* ``tests/test_views.py``: HTTP endpoints and request handling
* ``tests/test_adapters.py``: External integrations
* ``tests/conftest.py``: Shared test fixtures

End-to-End Tests
---------------

Cypress tests for full application workflows:

.. code-block:: bash

   # Interactive test runner
   npm run cypress:open

   # Headless test execution
   npm run cypress:run

**Test Scenarios:**

* Loading directories with ACRO metadata
* Reviewing and approving/rejecting outputs
* Generating release packages
* Error handling and edge cases

Code Quality
===========

Linting and Formatting
---------------------

**Python:**

.. code-block:: bash

   # Format code
   just format

   # Check style
   just lint

   # Type checking
   just check

**JavaScript:**

.. code-block:: bash

   # Lint JavaScript
   npm run lint

   # Format code
   npm run format

**Pre-commit Hooks:**

The project uses pre-commit hooks to ensure code quality:

.. code-block:: bash

   # Install hooks
   pre-commit install

   # Run manually
   pre-commit run --all-files

Building and Packaging
=====================

Development Builds
-----------------

**Python Application:**

.. code-block:: bash

   # Build PyOxidizer binary
   just build

This creates a standalone executable in ``build/`` directory.

**Electron Application:**

.. code-block:: bash

   # Build installer packages
   just sacro-app/build

Creates platform-specific installers in ``sacro-app/dist/``.

Release Process
--------------

1. **Version Bump**: Update version numbers in relevant files
2. **Test Suite**: Ensure all tests pass
3. **Build Assets**: Generate production frontend assets
4. **Package Application**: Create installers for all platforms
5. **GitHub Release**: Tag and create release with installers

**Automated CI/CD:**

GitHub Actions automatically:

* Run test suite on all platforms
* Build release packages
* Create nightly development builds
* Deploy documentation updates

Contributing Guidelines
======================

Code Style
---------

**Python:**

* Follow PEP 8 style guidelines
* Use type hints where appropriate
* Write docstrings for public functions
* Keep functions focused and testable

**JavaScript:**

* Use modern ES6+ syntax
* Prefer const/let over var
* Use meaningful variable names
* Comment complex logic

**General:**

* Write clear commit messages
* Keep changes focused and atomic
* Include tests for new functionality
* Update documentation as needed

Pull Request Process
-------------------

1. **Fork Repository**: Create personal fork on GitHub
2. **Create Branch**: Use descriptive branch names
3. **Make Changes**: Follow coding standards
4. **Add Tests**: Ensure adequate test coverage
5. **Update Docs**: Document new features
6. **Submit PR**: Include clear description of changes

**PR Requirements:**

* All tests must pass
* Code coverage should not decrease
* Documentation updated if needed
* Changes reviewed by maintainers

Debugging
========

Development Debugging
--------------------

**Python Application:**

.. code-block:: python

   # Add breakpoints
   import pdb; pdb.set_trace()

   # Use Django debug toolbar
   # Enable in settings.py for detailed request info

**Electron Application:**

.. code-block:: javascript

   // Open DevTools
   mainWindow.webContents.openDevTools();

   // Console logging
   console.log('Debug info:', data);

**Common Issues:**

* **Port conflicts**: Change Django port in settings
* **File permissions**: Ensure read access to test directories
* **Path issues**: Use absolute paths for file operations
* **Token mismatches**: Restart both Django and Electron

Production Debugging
-------------------

**Log Files:**

* Django logs to console in development
* Electron logs available in DevTools
* System logs for installer issues

**Error Reporting:**

* Include system information
* Provide steps to reproduce
* Attach relevant log files
* Test with sample data


Future Development
=================

Planned Features
---------------

* **Enhanced File Support**: Additional output file formats
* **Improved UI**: Better accessibility and user experience
* **Performance Optimization**: Faster loading of large directories
* **Extended ACRO Integration**: Support for newer ACRO versions

**Technical Improvements:**

* **Web Deployment**: Deploy Django app as web service
* **API Extensions**: RESTful API for programmatic access
* **Plugin Architecture**: Extensible output type handlers
* **Enhanced Security**: TLS for internal communication

Contributing Areas
-----------------

Areas where contributions are especially welcome:

* **Documentation**: User guides and API documentation
* **Testing**: Additional test coverage and scenarios
* **Accessibility**: Improved keyboard navigation and screen reader support
* **Performance**: Optimization for large datasets
* **Platform Support**: Testing on additional OS versions

Getting Help
-----------

* **GitHub Issues**: Report bugs and request features
* **Discussions**: Ask questions and share ideas
* **Code Review**: Get feedback on proposed changes
* **Documentation**: Improve guides and examples

The development team is committed to maintaining a welcoming and inclusive environment for all contributors.
