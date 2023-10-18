# SACRO Outputs Viewer

A viewer for research outputs produced using the
[ACRO](https://github.com/AI-SDC/ACRO) tools.

It can load the JSON metadata output by the tool, and displays the outputs for
an output checker to review. The reviewer can see each file, researcher
comments, and as the outcomes of any statistical analysis performed by ACRO
tools.

It allow the output checker to approve or reject the outputs, and can generate a
zip file with approved outputs for releasing.

Warning: this tool is under active development, and not all features are
complete at this point.

## Installation

The latest development version can be found here:

https://opensafely.org/sacro/latest-windows-build

Unzip this, and install the application by double clicking on the SACRO.msi file.

This will install and then run the application.  Because the application is not
yet signed, you will likely need to approve the installation, for which you may
need admin priviledges. Depending on your local machines configuration, you may
not be able to install it if you don't ahve admin access.

When the installation completes, it will run the application.

## Usage

To view outputs, you need to open a directory containing the output files. The Viewer will detect if there is ACRO-generated metadata, and use that to display the files. If there is no ACRO data, it will generate some, adding each file in the directory as a `custom` ACRO outputs.

If you don't have any outputs to hand, you can use the test outputs we have included in the
downloaded zip to get started with: navigate to and select directory `outputs`  in the zip file.

In the appliction, you should now see the list of outputs on the left, and can
select each one to view it.

If you want to approve these outputs, you can click on the green "Approve and
Download" button, which allow you to save a zip file with them all included. You
can then continue with your normal release process.

## Developer docs

Please see the [additional information](DEVELOPERS.md).
