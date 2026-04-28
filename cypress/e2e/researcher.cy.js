describe("Researcher Comprehensive Journey", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8000");
    cy.contains("Researcher").click();

    cy.get("#outputList li").should("have.length.at.least", 1);
  });

  it("can perform the full output lifecycle (add, edit, rename, delete)", () => {
    const outputName = "LifecycleTest_" + Date.now();
    const renamedOutput = outputName + "_renamed";

    cy.intercept("POST", /\/researcher\/output\/add\//).as("addOutput");

    cy.get("#uploadZone").click();

    cy.get("#addOutputName").should("be.visible").type(outputName);
    cy.get("#addOutputFile").selectFile({
      contents: Cypress.Buffer.from("test content"),
      fileName: "test.csv",
      mimeType: "text/csv",
    });

    cy.get("#confirmAddOutput").click();

    cy.wait("@addOutput").its("response.statusCode").should("eq", 200);
    cy.get("#outputList").contains(outputName).should("exist");


    cy.intercept("POST", /\/researcher\/output\/edit\//).as("editOutput");

    cy.get(`li[data-output-name="${outputName}"] .edit-output-btn`).click({ force: true });

    cy.get("#editOutputType").should("be.visible").select("regression");
    cy.get("#confirmEditOutput").click();

    cy.wait("@editOutput").its("response.statusCode").should("eq", 200);
    cy.get(`li[data-output-name="${outputName}"]`)
      .contains("regression")
      .should("exist");


    cy.intercept("POST", /\/researcher\/output\/edit\//).as("renameOutput");

    cy.get(`li[data-output-name="${outputName}"] .edit-output-btn`).click({ force: true });

    cy.get("#editOutputName")
      .should("be.visible")
      .clear()
      .type(renamedOutput);

    cy.get("#confirmEditOutput").click();

    cy.wait("@renameOutput").its("response.statusCode").should("eq", 200);
    cy.get("#outputList").contains(renamedOutput).should("exist");


    cy.intercept("POST", /\/researcher\/output\/delete\//).as("deleteOutput");

    cy.get(`li[data-output-name="${renamedOutput}"] .delete-output-btn`).click({ force: true });

    cy.get("#confirmDeleteOutput").should("be.visible").click();

    cy.wait("@deleteOutput").its("response.statusCode").should("eq", 200);
    cy.get("#outputList").contains(renamedOutput).should("not.exist");
  });

  it("can manage comments (add, edit, delete)", () => {
    cy.get("#outputList li").first().click({ force: true });

    cy.get("#researcherForm form").should("be.visible");

    const initialComment = "Original Comment";
    const updatedComment = "Updated Comment";

    cy.get('[data-sacro-el="researcher-new-comment"]')
      .should("exist")
      .type(initialComment, { force: true });

    cy.get('[data-sacro-el="researcher-add-comment-btn"]').click({ force: true });

    cy.get('[data-sacro-el="outputDetailsComments"]')
      .contains(initialComment)
      .should("exist");

    cy.get('[data-sacro-el="outputDetailsComments"] .edit-comment')
      .first()
      .click({ force: true });

    cy.get('[data-sacro-el="researcher-new-comment"]')
      .clear({ force: true })
      .type(updatedComment, { force: true });

    cy.get('[data-sacro-el="researcher-add-comment-btn"]').click({ force: true });

    cy.get('[data-sacro-el="outputDetailsComments"]')
      .contains(updatedComment)
      .should("exist");


    cy.on("window:confirm", () => true);

    cy.get('[data-sacro-el="outputDetailsComments"] .delete-comment')
      .first()
      .click({ force: true });

    cy.get('[data-sacro-el="outputDetailsComments"]')
      .contains(updatedComment)
      .should("not.exist");
  });

  it("can add an exception request", () => {
    cy.get("#outputList li").first().click({ force: true });

    cy.get("#researcherForm form").should("be.visible");

    const exceptionText = "This is a justified exception.";

    cy.get('[data-sacro-el="researcher-exception-request"]')
      .type(exceptionText, { force: true });

    cy.get('[data-sacro-el="researcher-add-exception-btn"]').click({ force: true });

    cy.get('[data-sacro-el="outputExceptionRequest"]')
      .contains(exceptionText)
      .should("exist");
  });

  it("can save a draft session", () => {
    cy.intercept("POST", /\/researcher\/session\/save\//).as("saveDraft");

    cy.get("#saveDraftBtn").should("be.visible").click();

    cy.wait("@saveDraft").its("response.statusCode").should("eq", 200);
  });

  it("can complete the finalize workflow", () => {
    cy.intercept("POST", /\/researcher\/finalize\//).as("finalizeSession");

    cy.get("#finalizeBtn").should("be.visible").click();

    cy.get("#finalizeSessionName")
      .should("be.visible")
      .type("Cypress Final Session");

    cy.get("#checkCellCounts").check();
    cy.get("#checkIdentifiers").check();
    cy.get("#checkOutputTypes").check();
    cy.get("#checkConfirmation").check();

    cy.get("#confirmFinalize").click();

    cy.wait("@finalizeSession")
      .its("response.statusCode")
      .should("eq", 200);
  });
});
