# 4. Electron to package the application and provide a browser platform for the front-end

Date: 2023-07-21

## Status

Accepted

## Context

We need to provide a visual GUI for users so that they can interact with the ACRO outputs to approve or reject each output. The GUI should be available to be installed in a Trusted Research Environment (TRE) by a system administrator, ideally without too many manual steps or a large number of dependencies.

## Decision

Use Electron as the framework for building a desktop application. Electron embeds the Chromium browser engine and Node.js as a means of interacting with the users operating system. This allows us to use Django, HTML, CSS, and JavaScript to build a web application, something the team is deeply familiar with, yet provide a desktop application to users.

As part of our decision-making, we found that Electron provides some well-documented and well-supported ways of creating Windows and Linux installers.

## Consequences

Potential options for the application considered were:

- [Electron](https://www.electronjs.org/)
- [Tauri](https://tauri.app/)
- [CEF Python](https://github.com/cztomczak/cefpython)
- System web browser installed in the TRE
- Chrome in App Mode

Electron was selected after each of the above was tested by the team.

### Pros

- Electron apps are compatible with Windows, Linux, and macOS, meaning we did not need to find an individual application framework for each operating system.
- Electron has a mechanism for creating native Application installers, meaning we avoided building our own installer.
- Embedded Chromium means we can use the latest web technologies and know which version of the browser the user is using.
  - This meant we did not need to perform cross-browser testing.
  - Testing across operating systems has a much-reduced risk by using Electron, as the Chromium project aims to have feature parity across platforms. We are therefore unlikely to run into issues specific to one operating system.
- Electron is an Open Source project, meaning that we are not tied to a particular vendor or provider for an application building framework. Compared with other options (listed above), it is frequently updated and has good documentation.
- Electron is written in JavaScript, which the team has some familiarity with, compared with Tauri, for example, which uses Rust.

### Cons

- The team is most comfortable with Python, whereas Electron uses JavaScript (Node.js). Research and learning time was required to understand how to use JavaScript in the context of an Electron application.
- Connecting the Python side to Electron required custom code to talk between the Django app, and the Electron application processes.
- Tom O has the most knowledge of JavaScript on the team but has not used Electron for a production application.
