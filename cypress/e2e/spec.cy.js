/* eslint-disable no-unused-vars */
describe("Approve all files, view summary page, and download approved outputs", () => {
  it("passes", () => {
    cy.visit("http://localhost:8000");

    // comment on and approve each output
    cy.get("[data-sacro-el='outputList'] li").each(($el) => {
      cy.wrap($el).click();

      cy.get("[data-sacro-el='output-details-review-comment']").type(
        "This is a comment"
      );
      cy.get("[data-sacro-el='output-details-review-approve']").click();
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
        req.redirect("/review/current");
      }
    ).as("approvedOutputs");

    cy.get("[data-sacro-el='downloadOutputsForm']").submit();

    cy.wait("@approvedOutputs")
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
    ).as("summary");

    cy.get("[data-sacro-el='downloadSummaryForm']").submit();

    cy.wait("@summary")
      .its("request")
      .then((req) => {
        cy.request(req).then(({ headers }) => {
          const { "content-type": contentType } = headers;
          expect(contentType).to.equal("text/plain");
        });
      });
  });
});

describe("clearing a comment resets the button state", () => {
  it("passes", () => {
    cy.visit("http://localhost:8000");

    cy.get("[data-sacro-el='outputList'] li:nth-child(3)").click();

    // check we're looking at a passing one
    cy.get("[data-sacro-el='outputDetailsStatus'] span").should(
      "have.text",
      "Pass"
    );

    // check initial states of approve and reject buttons
    cy.get("[data-sacro-el='outputDetailsBtnApprove']").should("be.enabled");
    cy.get("[data-sacro-el='outputDetailsBtnReject']").should("be.disabled");

    // set a comment and check the buttons have their border-only css classes
    cy.get("[data-sacro-el='outputDetailsTextareaComments']").type(
      "This is a comment"
    );
    cy.get("[data-sacro-el='outputDetailsBtnApprove']").should(
      "have.class",
      "bg-transparent",
      "border-green-700"
    );
    cy.get("[data-sacro-el='outputDetailsBtnReject']").should(
      "have.class",
      "bg-transparent",
      "border-red-700"
    );
    cy.get("[data-sacro-el='outputDetailsBtnReject']").should("be.enabled");

    // approve the output
    cy.get("[data-sacro-el='outputDetailsBtnApprove']").click();

    // pick another output
    cy.get("[data-sacro-el='outputList'] li:nth-child(4)").click();

    // pick the original output
    cy.get("[data-sacro-el='outputList'] li:nth-child(3)").click();

    // clear the comment
    cy.get("[data-sacro-el='outputDetailsTextareaComments']").clear();

    // check the buttons are reset to border-only styles and disabled appropriately
    cy.get("[data-sacro-el='outputDetailsBtnApprove']").should(
      "have.class",
      "bg-transparent",
      "border-green-700"
    );
    cy.get("[data-sacro-el='outputDetailsBtnApprove']").should("be.enabled");
    cy.get("[data-sacro-el='outputDetailsBtnReject']").should(
      "have.class",
      "bg-transparent",
      "border-red-700"
    );
    cy.get("[data-sacro-el='outputDetailsBtnReject']").should("be.disabled");
  });
});
