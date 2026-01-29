describe("Start to finish user journey for rejecting all outputs and downloading the empty zip", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8000");
    cy.contains("Output Checker").click();
  });

  it("Rejects all files, visits the summary page, and review details", () => {
    // Comment on and reject each output
    cy.get("[data-sacro-el='outputList'] li").each(($el) => {
      cy.get($el).click();
      cy.findByLabelText(/Review comments on/i).type("This is a comment");
      cy.findByLabelText("Reject").closest("label").click();
    });

    // open the modal, comment, and submit the form
    cy.get("button#openModalBtn").click();
    cy.get("[data-sacro-el='submissionComment']").type(
      "Everything has been rejected"
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
