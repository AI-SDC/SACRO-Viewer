# 3. Use python and pyoxidizer


Date: 2023-07-17

## Status

Accepted

## Context

We have chosen to use Electron as our front-end application framework and packaging tool.

However, we still need to write application logic. We could write this is
nodejs, but the team is not familiar with writing this kind of applictaion
logic in Javascript, or with the nodejs APIs.


## Decision

We have chosen to use python to implement the application logic for the ACRO
Viewer, in the form of a normal python web application. Reasons:

- the team is familiar with python
- allows for deployment as a web service in the future

This does raise a question - how do we distribute the python interpreter?

For this, we will use pyoxidizer to build a stand-alone platform native binary
that includes python and the python stdlib.

Other options for this include pyinstaller - this option has not been
explored, as pyoxidizer worked well when tried.


## Consequences

Pros:
 - We can write and maintain the application logic in python, and potentially reuse it in future.

Cons:
 - We will need to implement and maintain a pyoxidizer build process.
 - We will need to start it as a separate process with Electron, and communicate
with it over HTTP. This is potentially less secure, and needed mitigation.

