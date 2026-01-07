# SACRO Outputs Viewer

A viewer for research outputs produced using the
[ACRO](https://github.com/AI-SDC/ACRO) tools.

It can load the JSON metadata output by the tool, and displays the outputs for
an output checker to review. The reviewer can see each file, researcher
comments, and as the outcomes of any statistical analysis performed by ACRO
tools.

It allow the output checker to approve or reject the outputs, and can generate a
zipfile with approved outputs for releasing.

## Installation

### Windows

A Windows installer (MSI) is available. The download also includes sample data for testing.

<!---1. Download the [latest installer build](https://opensafely.org/sacro/latest-windows-build).--->
1. Download the [latest release build](https://github.com/AI-SDC/SACRO-Viewer/releases/download/v0.1.0/SACRO-0.1.0-windows-build.zip).
2. Unzip the downloaded zipfile.
3. Open the included `sacro 0.1.0.msi` file to install.

Admin privileges may be required to install the viewer.
When the installation completes, it will run the application.

### Linux

A Linux installer (deb) is available. The download also includes sample data for testing.
<!---(https://opensafely.org/sacro/latest-linux-build).--->
1. Download the [latest release build](https://github.com/AI-SDC/SACRO-Viewer/releases/download/v0.1.0/SACRO-0.1.0-linux-build.zip).
2. Unzip the downloaded zipfile.
3. Install the included `sacro_0.1.0_amd64.deb` file.

### macOS

An Apple Disk Image (dmg) file is available. The download also includes sample data for testing.
 <!---(https://opensafely.org/sacro/latest-macos-build)--->
1. Download the [latest release build](https://github.com/AI-SDC/SACRO-Viewer/releases/download/v0.1.0/SACRO-0.1.0-macos-build.zip).
2. Unzip the downloaded zipfile
3. Move the `Sacro.app` to you Applications folder
4. Right-mouse click on the Sacro app icon, and then click Open
5. macOS will warn you that it cannot open the app
6. Go to macOS Settings -> Security and find where it says
    > "sacro.app" was blocked from use because it is not from an identified developer.
7. Select "Open Anyway"

### Latest Development Builds

* [Windows latest](https://nightly.link/AI-SDC/SACRO-Viewer/workflows/main/main/SACRO-latest-windows-build.zip)
* [Linux latest](https://nightly.link/AI-SDC/SACRO-Viewer/workflows/main/main/SACRO-latest-linux-build.zip)
* [masOS latest](https://nightly.link/AI-SDC/SACRO-Viewer/workflows/main/main/SACRO-latest-macos-build.zip)

## Usage

To view outputs, you need to open a directory containing the output files.
The viewer will detect if there is ACRO-generated metadata and use that to display the files.
If there is no ACRO daa, it will generate some,
adding each file in the directory as a "custom" ACRO output.

(If you don't have any outputs to hand,
you can use the test outputs we have included in the downloaded zipfile to get started.
Navigate to and select the `outputs` directory in the zipfile.)

In the appliction, you will see the list of outputs on the left, and can
select each one to view it. Each output must be approved or rejected.

Once all outputs have been approved or rejected, complete the release by clicking "Approve and Download".
This downloads a zipfile with all approved outputs and metadata describing the release.
You can then continue your normal release process.

## Developer docs

Please see the [additional information](DEVELOPERS.md).

### Acknowledgement

This work was funded by UK Research and Innovation under  as part  of the [DARE UK](https://dareuk.org.uk) (Data and Analytics Research Environments UK) programme, delivered in partnership with Health Data Research UK (HDR UK) and Administrative Data Research UK (ADR UK). The specific projects were:
- Semi-Automatic Checking of Research Outputs (SACRO) [Grant Number MC_PC_23006] - a phase 1 Driver project
- TREvolution [Grant Number MC_PC_24038] - phase 2:Transformative Components.

