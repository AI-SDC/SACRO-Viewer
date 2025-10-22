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
