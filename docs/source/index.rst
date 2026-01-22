.. raw:: html

   <div style="text-align: left; margin: 20px 0;">
      <img src="./_static/SACRO_Logo_final.png" alt="SACRO Logo" width="100" style="background: transparent !important; border: none;" />
   </div>



========================================
Welcome to the AI-SDC family of tools
========================================

Our tools are designed to help researchers assess the privacy disclosure risks of their outputs, including tables, plots, statistical models, and trained machine learning models


.. toctree::
   :maxdepth: 1
   :hidden:

   introduction
   installation
   user_guide
   contribution_guide


.. grid:: 2

    .. grid-item-card:: ACRO (Python)
        :link: https://jessuwe.github.io/ACRO/introduction.html
        :link-type: url
        :shadow: md
        :class-header: bg-info

        **Statistical Disclosure Control for Python**

        Tools for the Semi-Automatic Checking of Research Outputs. Drop-in replacements for common analysis commands with built-in privacy protection.

        +++

        :bdg-info:`Statistical Analysis` `Visit ACRO Docs →`

    .. grid-item-card:: SACRO-ML
        :link: https://jessuwe.github.io/SACRO-ML/introduction.html
        :link-type: url
        :shadow: md
        :class-header: bg-primary

        **Machine Learning Privacy Tools**

        Collection of tools and resources for managing the statistical disclosure control of trained machine learning models.

        +++

        :bdg-primary:`ML Privacy` `Visit SACRO-ML Docs →`

.. grid:: 2

    .. grid-item-card:: ACRO-R
        :link: https://jessuwe.github.io/ACRO/introduction.html
        :link-type: url
        :shadow: md
        :class-header: bg-success

        **R Package Integration**

        R-language interface for the Python ACRO library, providing familiar R syntax for statistical disclosure control.

        +++

        :bdg-success:`R Integration` `Explore ACRO-R →`

    .. grid-item-card:: SACRO Viewer
        :link: introduction
        :link-type: doc
        :shadow: md
        :class-header: bg-warning

        **Graphical User Interface**

        A graphical user interface for fast, secure and effective output checking, which can work in any TRE (Trusted Research Environment).

        +++

        :bdg-warning:`Current Documentation Focus` :doc:`Get Started → <introduction>`

SACRO Viewer: Graphical Output Review Tool
==========================================

SACRO Viewer is a desktop application for reviewing research outputs produced using the ACRO tools. It provides a graphical interface for output checkers to review files, researcher comments, and statistical analysis outcomes in a secure environment.

.. note::
   **Current Version:** v0.1.0 - Cross-platform desktop application with Windows, Linux, and macOS support.

What is SACRO Viewer?
=====================

SACRO Viewer is a desktop application that:

* Loads JSON metadata output by ACRO tools for comprehensive output review
* Displays research outputs with researcher comments and statistical analysis results
* Allows output checkers to approve or reject individual outputs
* Generates zipfiles containing only approved outputs for secure release
* Works in Trusted Research Environments (TREs) without internet connectivity

Core Features
=============

Comprehensive Output Review
---------------------------

* **ACRO Integration**: Automatically detects and loads ACRO-generated metadata
* **File Display**: View various file types including CSV, images, and text files
* **Statistical Context**: See ACRO analysis results including disclosure risk assessments
* **Researcher Comments**: Review comments and justifications provided by researchers
* **Approval Workflow**: Individual approve/reject decisions for each output
* **Secure Release**: Generate zipfiles containing only approved outputs

Design Principles
-----------------

* **Desktop Application**: Runs locally without requiring internet connectivity
* **Cross-platform**: Available for Windows, Linux, and macOS
* **TRE Compatible**: Designed for use in secure Trusted Research Environments
* **User-friendly**: Intuitive graphical interface for non-technical users
* **Secure**: Local processing with no external data transmission
* **Audit Trail**: Maintains records of approval decisions

Getting Started
===============

.. grid:: 4

    .. grid-item-card:: Install
        :link: installation
        :link-type: doc
        :class-header: bg-light

        Download and install SACRO Viewer for your operating system

    .. grid-item-card:: User Guide
        :link: user_guide
        :link-type: doc
        :class-header: bg-light

        Learn how to review outputs and manage approvals

    .. grid-item-card:: FAQ
        :link: faq
        :link-type: doc
        :class-header: bg-light

        Find answers to common questions

    .. grid-item-card:: Support
        :link: support
        :link-type: doc
        :class-header: bg-light

        Get help and troubleshooting information

Key Components
--------------

* **Output List**: Browse all research outputs in a directory
* **File Viewer**: Display output files with syntax highlighting and formatting
* **Review Panel**: See ACRO status, comments, and make approval decisions
* **Release Manager**: Generate approved output packages for secure release

Developer Resources
===================

.. grid:: 3

    .. grid-item-card:: Architecture
        :link: architecture
        :link-type: doc
        :class-header: bg-info

        Understand the technical design and system components

    .. grid-item-card:: Developer Guide
        :link: developer_guide
        :link-type: doc
        :class-header: bg-info

        Set up development environment and contribute code

    .. grid-item-card:: API Reference
        :link: api_reference
        :link-type: doc
        :class-header: bg-info

        Detailed documentation of classes and functions

Community and Support
=====================

.. grid:: 2

    .. grid-item-card:: Get Help
        :class-header: bg-light

        * `GitHub Issues <https://github.com/AI-SDC/SACRO-Viewer/issues>`_
        * `Discussion Forum <https://github.com/AI-SDC/SACRO-Viewer/discussions>`_
        * Email: sacro.contact@uwe.ac.uk

    .. grid-item-card:: Contribute
        :class-header: bg-light

        * `Contributing Guide <https://github.com/AI-SDC/SACRO-Viewer/blob/main/CONTRIBUTING.md>`_
        * `Source Code <https://github.com/AI-SDC/SACRO-Viewer>`_
        * `Report Issues <https://github.com/AI-SDC/SACRO-Viewer/issues/new>`_

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

Acknowledgement
===============

This work was supported by UK Research and Innovation as part of the Data and Analytics Research Environments UK (`DARE UK <https://dareuk.org.uk>`_) programme, delivered in partnership with Health Data Research UK (HDR UK) and Administrative Data Research UK (ADR UK). The specific projects were Semi-Automated Checking of Research Outputs (`SACRO <https://gtr.ukri.org/projects?ref=MC_PC_23006>`_; MC_PC_23006), Guidelines and Resources for AI Model Access from TrusTEd Research environments (`GRAIMATTER <https://gtr.ukri.org/projects?ref=MC_PC_21033>`_; MC_PC_21033), and `TREvolution <https://dareuk.org.uk/trevolution>`_ (MC_PC_24038). This project has also been supported by MRC and EPSRC (`PICTURES <https://gtr.ukri.org/projects?ref=MR%2FS010351%2F1>`_; MR/S010351/1).
