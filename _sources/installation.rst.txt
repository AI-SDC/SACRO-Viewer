=======
Install
=======

SACRO Viewer is distributed as pre-built installers for Windows, Linux, and macOS. No additional dependencies or setup are required - the installers include everything needed to run the application.

System Requirements
===================

**Windows**
  * Windows 10 or later
  * Administrator privileges may be required for installation

**Linux**
  * Ubuntu 18.04 or later (or equivalent distribution)
  * 64-bit architecture (amd64)

**macOS**
  * macOS 10.14 (Mojave) or later
  * Intel or Apple Silicon processors supported

Windows Installation
====================

1. Download the `latest Windows release <https://github.com/AI-SDC/SACRO-Viewer/releases/download/v0.1.0/SACRO-0.1.0-windows-build.zip>`_
2. Unzip the downloaded file
3. Run the included ``sacro 0.1.0.msi`` installer
4. Follow the installation wizard prompts
5. The application will launch automatically when installation completes

.. note::
   Administrator privileges may be required to install the application. If you encounter permission issues, right-click the MSI file and select "Run as administrator".

Linux Installation
==================

1. Download the `latest Linux release <https://github.com/AI-SDC/SACRO-Viewer/releases/download/v0.1.0/SACRO-0.1.0-linux-build.zip>`_
2. Unzip the downloaded file
3. Install the included ``.deb`` package:

   .. code-block:: bash

      sudo dpkg -i sacro_0.1.0_amd64.deb

4. Launch the application from your applications menu or run ``sacro`` from the command line

macOS Installation
==================

1. Download the `latest macOS release <https://github.com/AI-SDC/SACRO-Viewer/releases/download/v0.1.0/SACRO-0.1.0-macos-build.zip>`_
2. Unzip the downloaded file
3. Move ``Sacro.app`` to your Applications folder
4. Right-click on the Sacro app icon and select "Open"
5. macOS will display a security warning - click "Open" to proceed
6. If the app is blocked, go to **System Preferences → Security & Privacy** and click "Open Anyway"

.. warning::
   macOS may block the application because it's not from an identified developer. This is normal for open-source applications. Follow the security steps above to allow the application to run.

Development Builds
==================

For testing the latest features, development builds are available:

* `Windows Development Build <https://nightly.link/AI-SDC/SACRO-Viewer/workflows/main/main/SACRO-latest-windows-build.zip>`_
* `Linux Development Build <https://nightly.link/AI-SDC/SACRO-Viewer/workflows/main/main/SACRO-latest-linux-build.zip>`_
* `macOS Development Build <https://nightly.link/AI-SDC/SACRO-Viewer/workflows/main/main/SACRO-latest-macos-build.zip>`_

.. caution::
   Development builds are automatically generated from the latest code and may contain bugs or incomplete features. Use stable releases for production environments.

.. _running-the-web-application:

Running the Web Application
============================

SACRO Viewer consists of two parts:

1. A Django web app with vanilla JavaScript UI that renders a set of ACRO outputs for review
2. An Electron app and installer that bundles the web app

The web app is designed to be used as a normally deployed website. The Electron app packages a pre-built version of this web app with a Chrome-based browser for desktop distribution.

System Requirements for Development
====================================

**General Requirements**

* Python 3.10
* `just <https://github.com/casey/just>`_ command runner
* Node.js v20
* Git

**Windows Specific Requirements**

Windows requires additional setup:

* **Python 3.10**: Download from https://www.python.org/downloads/windows/ (do not use the Microsoft Store version)
* **Node.js v20**: Install via `fnm <https://github.com/Schniz/fnm>`_
* **Git Bash**: Download from https://gitforwindows.org/
* **Just**: Install via Chocolatey: ``choco install just`` (install Chocolatey from https://chocolatey.org/)
* **Visual Studio Community**: Download from https://visualstudio.microsoft.com/downloads/ and install with the "Desktop Development with C++" workload
* **Windows Terminal**: Recommended tool available at https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701

.. note::
   After installing all Windows requirements, please reboot your system.

   Just commands will only work inside git-bash shell by default, as they assume bash.

Local Development Environment
=============================

1. Clone the repository:

   .. code-block:: bash

      git clone https://github.com/AI-SDC/SACRO-Viewer.git
      cd SACRO-Viewer

2. Run the Django development server:

   .. code-block:: bash

      just run

   This command will set up the Python virtual environment, install dependencies, and start the Django development server on ``http://localhost:8000``

Development with Vite Live Reload
----------------------------------

If you are making changes to JavaScript, enable live reload:

1. Set the environment variable:

   .. code-block:: bash

      export DJANGO_VITE_DEV_MODE=true

2. In a separate terminal, run the Vite development server:

   .. code-block:: bash

      just assets-run

   The server will automatically refresh when you make changes to frontend assets.

Running the Electron App in Development
========================================

To run the Electron app in development mode:

1. First, start the Django development server:

   .. code-block:: bash

      just run &

2. Set the SACRO_URL environment variable:

   .. code-block:: bash

      export SACRO_URL=http://127.0.0.1:8000

3. Run the Electron app:

   .. code-block:: bash

      just sacro-app/run

Testing
=======

Running Unit Tests
------------------

Run the automated test suite:

.. code-block:: bash

   just test <args>

Test Data
---------

The script ``data/test-nursery.py`` uses ACRO to generate outputs from a public test dataset. Test outputs are automatically regenerated as needed by the justfile for commands like ``just test`` or ``just run``. Outputs are generated in the ``outputs/`` directory.

To manually regenerate test data:

.. code-block:: bash

   just test-outputs

To force removal of all test data and regenerate it:

.. code-block:: bash

   just clean
   just test-outputs

Testing the Electron App
------------------------

Semi-automated testing of the Electron app can be done locally using Cypress.

First, ensure a development server is running:

.. code-block:: bash

   just run

Then open Cypress:

.. code-block:: bash

   npm run cypress:open

To run Cypress in headless mode (useful for CI):

.. code-block:: bash

   npm run cypress:run

Headless mode automatically produces a video on each run and provides screenshots of any errors.

Building the Application
=========================

There are two stages to building the application for release: building the executable, then building the Windows installer (MSI).

Building the Python Web App
----------------------------

To build the PyOxidizer binary:

.. code-block:: bash

   just build

This creates a PyOxidizer binary of the Python application for your platform. The build process takes some time. The build executable and supporting files can be found in:

.. code-block:: text

   build/$ARCH/release/install/sacro

Building the Electron GUI App
------------------------------

The `sacro-app` directory contains the Electron and packaging configuration and tooling.

To build the installer:

.. code-block:: bash

   just sacro-app/build

This builds the Windows MSI installer, which can be found in ``sacro-app/dist``.

Testing the Built Application
------------------------------

To test the built application:

1. Double-click the MSI file found in ``sacro-app/dist`` to install it
2. The application will launch automatically
3. You may need to click through various Windows dialogs to approve the installation
4. Navigate to the ``outputs`` directory and choose ``results.json``
5. You should now see the outputs rendered in the app
6. Click the ``Approve and Download`` button to test the download functionality

Technology Stack
================

**Backend**
* Django web framework with Python 3.10+
* PyOxidizer for bundling Python applications

**Frontend**
* Vanilla JavaScript
* `Vite <https://vitejs.dev/>`_ - modern build tool and development server
* `django-vite <https://github.com/MrBin99/django-vite>`_ - Django integration for Vite

**Frontend Asset Build Process**

Vite compiles JavaScript files and outputs:
* A manifest file
* Compiled JavaScript files
* Included assets (stylesheets, images, etc.)

Vite uses `ES6 Module syntax <https://caniuse.com/es6-module>`_ for all JavaScript on the page. For legacy browser support, the `Vite Legacy Plugin <https://github.com/vitejs/vite/tree/main/packages/plugin-legacy>`_ provides fallback support using the `module/nomodule pattern <https://philipwalton.com/articles/deploying-es2015-code-in-production-today/>`_.

Vite is configured to:
* Build assets from ``assets/src``
* Output compiled assets to ``assets/dist``
* Django collects static files from ``assets/dist``

Latest Development Builds
==========================

Latest development builds are available via `nightly.link <https://nightly.link/>`_:

* `Windows Development Build <https://nightly.link/AI-SDC/SACRO-Viewer/workflows/main/main/SACRO-latest-windows-build.zip>`_
* `macOS Development Build <https://nightly.link/AI-SDC/SACRO-Viewer/workflows/main/main/SACRO-latest-macos-build.zip>`_
* `Linux Development Build <https://nightly.link/AI-SDC/SACRO-Viewer/workflows/main/main/SACRO-latest-linux-build.zip>`_

Sample Data
===========

All download packages include sample data for testing the application:

* Sample ACRO outputs in the ``outputs`` directory
* Test files including CSV tables, images, and statistical results
* Example metadata showing different ACRO status types (pass/fail/review)

To test the installation, launch SACRO Viewer and select the ``outputs`` directory from the downloaded package.

Troubleshooting
===============

**Windows: "Windows protected your PC" message**
  This is normal for new applications. Click "More info" then "Run anyway" to proceed with installation.

**macOS: "Cannot open because it is from an unidentified developer"**
  Go to System Preferences → Security & Privacy → General tab and click "Open Anyway" next to the blocked application message.

**Linux: Permission denied errors**
  Ensure you have sudo privileges and the downloaded ``.deb`` file has execute permissions:

  .. code-block:: bash

     chmod +x sacro_0.1.0_amd64.deb

**Application won't start**
  Check that your system meets the minimum requirements listed above. On older systems, try running the application from the command line to see detailed error messages.

For additional support, please visit the `GitHub Issues page <https://github.com/AI-SDC/SACRO-Viewer/issues>`_.
