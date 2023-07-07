/* eslint-disable no-unused-vars */
describe("Approve all files, view summary page, and download approved outputs", () => {
  it("passes", () => {
    cy.visit("http://localhost:8000");

    // comment on and approve each output
    cy.get("[data-sacro-el='outputList'] li").each(($el) => {
      cy.wrap($el).click();

      cy.get("[data-sacro-el='outputDetailsTextareaComments']").type(
        "This is a comment"
      );
      cy.get("[data-sacro-el='outputDetailsBtnApprove']").click();
    });

    // open the modal, comment, and submit the form
    cy.get("button#openModalBtn").click();
    cy.get("[data-sacro-el='submissionComment']").type(
      "Everything has been approved"
    );
    cy.get("#approveForm").submit();

    cy.url().should("eq", "http://localhost:8000/review/current/");
    //
    // prepare for form submission that returns back a file
    // https://on.cypress.io/intercept
    cy.intercept(
      {
        pathname: "/review/current/approved-outputs/",
        method: "POST",
      },
      (req) => {
        // instead of redirecting to the zip file
        // and having the browser deal with it,
        // we download the file ourselves
        // but we cannot use Cypress commands inside the callback
        // so we will download it later using the captured URL
        req.redirect("/");
      }
    ).as("records");

    cy.get("[data-sacro-el='downloadOutputsForm']").submit();

    cy.wait("@records")
      .its("request")
      .then((req) => {
        cy.request(req).then(({ headers }) => {
          const { "content-type": contentType } = headers;
          expect(contentType).to.be.oneOf([
            "application/x-zip-compressed",
            "application/zip",
          ]);
        });
      });
  });
});

describe("Approve all files, view summary page, and download summary", () => {
  it("passes", () => {
    cy.visit("http://localhost:8000");

    // comment on and approve each output
    cy.get("[data-sacro-el='outputList'] li").each(($el) => {
      cy.wrap($el).click();

      cy.get("[data-sacro-el='outputDetailsTextareaComments']").type(
        "This is a comment"
      );
      cy.get("[data-sacro-el='outputDetailsBtnApprove']").click();
    });

    // open the modal, comment, and submit the form
    cy.get("button#openModalBtn").click();
    cy.get("[data-sacro-el='submissionComment']").type(
      "Everything has been approved"
    );
    cy.get("#approveForm").submit();

    cy.url().should("eq", "http://localhost:8000/review/current/");
    //
    // prepare for form submission that returns back a file
    // https://on.cypress.io/intercept
    cy.intercept(
      {
        pathname: "/review/current/summary/",
        method: "POST",
      },
      (req) => {
        // instead of redirecting to the zip file
        // and having the browser deal with it,
        // we download the file ourselves
        // but we cannot use Cypress commands inside the callback
        // so we will download it later using the captured URL
        req.redirect("/");
      }
    ).as("records");

    cy.get("[data-sacro-el='downloadSummaryForm']").submit();

    cy.wait("@records")
      .its("request")
      .then((req) => {
        cy.request(req).then(({ headers }) => {
          const { "content-type": contentType } = headers;
          expect(contentType).to.be.oneOf(["text/plain"]);
        });
      });
  });
});
