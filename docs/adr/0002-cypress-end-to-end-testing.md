# 1. Cypress for end-to-end testing

Date: 2023-07-14

## Status

Accepted

## Context

We need to test the functionality of the application and manual testing was becoming tedious because of the need to accept/reject every output.

## Decision

Use Cypress for end-to-end testing, both as an aid to development (it can walk through the functionality in a browser window faster than a person and provide continuous feedback) and as part of our CI test suite to automatically detect problems.

## Consequences

In other areas we've used Playwright, which also has support for Python. However, we needed something that would help us in the short-term, and Cypress was faster to get started with. We've not evaluated Cypress for longer term use.

With any kind of end-to-end testing there's a risk that the tests will be slow and that the time to run the test suite will significantly increase. We've put the Cypress tests into a separate GitHub Action step, called with a different just command, so that we can monitor the time it takes to run. At the time of writing, the Cypress tests take around 1 minute to run, compared to two minutes for the unit tests.

There's also a risk that having tests coupled to the UI will make development slower and make it harder to change things. To avoid this, we will follow the [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices) when designing our tests. This includes using data attributes, e.g `data-sacro-el`, to avoid coupling specific UI characteristics to test behaviour. Following the best practices should also help us keep the tests fast and reliable.

We believe that the advantages of having the Cypress tests there to support development by providing fast feedback, outweigh the cost of having to maintain them and the slowdown in the CI pipeline.
