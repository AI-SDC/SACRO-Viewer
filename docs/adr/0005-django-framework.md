# 5. Uee django framework for python backend

Date: 2023-08-11

## Status

Accepted

## Context

We need to provide a python http server to deliver the UI and handle the files.

## Decision

We will use the Django framework for two reasons

 - the team is very familiar with it
 - there's a high likelihood of needing a db for this project in future, and
   django has good support for migrations.

## Consequences


### Pros

 - familiarity
 - strong db support

### Cons

 - larger dependency than needed for the initial scope
 - currenly uses in-memory db, which logs some spurious migration errors on startup
