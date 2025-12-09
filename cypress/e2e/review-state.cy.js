const outputText = {
  passingOutput: "ols_pass",
  failingOutput: "crosstab_fail",
  unknownOutput: "custom_json",
};

describe("Check all variations of state for reviewing an output", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8000");
  });

  it("approves an output", () => {
    cy.findByText(outputText.passingOutput).click();

    cy.findByLabelText("Approve").as("approveBtn");

    cy.get("@approveBtn").should("not.be.checked").closest(`label`).click();
    cy.get("@approveBtn").should("be.checked");

    cy.get(`[data-sacro-el="outputList"]`)
      .findByText(outputText.passingOutput)
      .closest("dl")
      .find(`[data-sacro-el="file-list-review-status-approved"]`)
      .should("be.visible");
  });

  it("rejects an output", () => {
    cy.findByText(outputText.failingOutput).click();

    cy.findByLabelText("Reject").as("rejectBtn");

    cy.get("@rejectBtn").should("not.be.checked").closest(`label`).click();
    cy.get("@rejectBtn").should("be.checked");

    cy.get(`[data-sacro-el="outputList"]`)
      .findByText(outputText.failingOutput)
      .closest("dl")
      .find(`[data-sacro-el="file-list-review-status-rejected"]`)
      .should("be.visible");
  });

  it("cannot approve a failed output", () => {
    cy.findByText(outputText.passingOutput).click();

    cy.findByText(
      "You cannot reject this output until you add a comment."
    ).should("be.visible");
    cy.findByLabelText("Reject").should("be.disabled");
  });

  it("cannot reject a passing output", () => {
    cy.findByText(outputText.failingOutput).click();

    cy.findByText(
      "You cannot approve this output until you add a comment."
    ).should("be.visible");
    cy.findByLabelText("Approve").should("be.disabled");
  });

  it("cannot approve or reject an unknown output", () => {
    cy.findByText(outputText.unknownOutput).click();

    cy.findByText(
      "You cannot set a review status on this output until you add a comment."
    ).should("be.visible");
    cy.findByLabelText("Approve").should("be.disabled");
    cy.findByLabelText("Reject").should("be.disabled");
  });

  it("can reject a passing output once a comment has been added", () => {
    cy.findByText(outputText.passingOutput).click();

    cy.findByLabelText("Reject").as("rejectBtn");

    cy.findByText(
      "You cannot reject this output until you add a comment."
    ).should("be.visible");
    cy.get("@rejectBtn").should("be.disabled");

    cy.findByLabelText(`Review comments on ${outputText.passingOutput}:`).type(
      `This is a comment on ${outputText.passingOutput} so that we can reject it`
    );

    cy.get("@rejectBtn")
      .should("be.enabled")
      .should("not.be.checked")
      .closest(`label`)
      .click();
    cy.get("@rejectBtn").should("be.checked");

    cy.get(`[data-sacro-el="outputList"]`)
      .findByText(outputText.passingOutput)
      .closest("dl")
      .find(`[data-sacro-el="file-list-review-status-rejected"]`)
      .should("be.visible");
  });

  it("can approve a failing output once a comment has been added", () => {
    cy.findByText(outputText.failingOutput).click();

    cy.findByLabelText("Approve").as("approveBtn");

    cy.findByText(
      "You cannot approve this output until you add a comment."
    ).should("be.visible");
    cy.get("@approveBtn").should("be.disabled");

    cy.findByLabelText(`Review comments on ${outputText.failingOutput}:`).type(
      `This is a comment on ${outputText.failingOutput} so that we can approve it`
    );

    cy.get("@approveBtn")
      .should("be.enabled")
      .should("not.be.checked")
      .closest(`label`)
      .click();
    cy.get("@approveBtn").should("be.checked");

    cy.get(`[data-sacro-el="outputList"]`)
      .findByText(outputText.failingOutput)
      .closest("dl")
      .find(`[data-sacro-el="file-list-review-status-approved"]`)
      .should("be.visible");
  });

  it("can approve or reject an unknown output once a comment has been added", () => {
    cy.findByText(outputText.unknownOutput).click();

    cy.findByLabelText("Approve").as("approveBtn");
    cy.findByLabelText("Reject").as("rejectBtn");

    cy.get("@approveBtn").should("be.disabled");
    cy.get("@rejectBtn").should("be.disabled");

    cy.findByLabelText(`Review comments on ${outputText.unknownOutput}:`).type(
      `This is a comment on ${outputText.unknownOutput} so that we can approve or reject it`
    );

    cy.get("@approveBtn").should("be.enabled");
    cy.get("@rejectBtn").should("be.enabled");

    cy.get("@approveBtn").should("not.be.checked").closest(`label`).click();
    cy.get("@approveBtn").should("be.checked");

    cy.get(`[data-sacro-el="outputList"]`)
      .findByText(outputText.unknownOutput)
      .closest("dl")
      .find(`[data-sacro-el="file-list-review-status-approved"]`)
      .should("be.visible");

    cy.get("@rejectBtn").should("not.be.checked").closest(`label`).click();
    cy.get("@rejectBtn").should("be.checked");

    cy.get(`[data-sacro-el="outputList"]`)
      .findByText(outputText.unknownOutput)
      .closest("dl")
      .find(`[data-sacro-el="file-list-review-status-rejected"]`)
      .should("be.visible");
  });

  it("resets the button state when adding and then removing a comment", () => {
    // Passing output
    cy.findByText(outputText.passingOutput).click();

    cy.findByLabelText("Reject").as("rejectBtn");

    cy.get("@rejectBtn").should("be.disabled");
    cy.findByLabelText(`Review comments on ${outputText.passingOutput}:`).type(
      `This is a comment on ${outputText.passingOutput} so that we can reject it`
    );

    cy.get("@rejectBtn")
      .should("be.enabled")
      .should("not.be.checked")
      .closest(`label`)
      .click();
    cy.get("@rejectBtn").should("be.checked");

    cy.findByLabelText(
      `Review comments on ${outputText.passingOutput}:`
    ).clear();
    cy.get("@rejectBtn").should("be.disabled").should("not.be.checked");

    // Failing output
    cy.findByText(outputText.failingOutput).click();

    cy.findByLabelText("Approve").as("approveBtn");

    cy.get("@approveBtn").should("be.disabled");
    cy.findByLabelText(`Review comments on ${outputText.failingOutput}:`).type(
      `This is a comment on ${outputText.failingOutput} so that we can approve it`
    );

    cy.get("@approveBtn")
      .should("be.enabled")
      .should("not.be.checked")
      .closest(`label`)
      .click();
    cy.get("@approveBtn").should("be.checked");

    cy.findByLabelText(
      `Review comments on ${outputText.failingOutput}:`
    ).clear();
    cy.get("@approveBtn").should("be.disabled").should("not.be.checked");

    // Unknown output
    cy.findByText(outputText.unknownOutput).click();

    cy.findByLabelText("Approve").as("approveBtn");
    cy.findByLabelText("Reject").as("rejectBtn");

    cy.get("@approveBtn").should("be.disabled");
    cy.get("@rejectBtn").should("be.disabled");

    cy.findByLabelText(`Review comments on ${outputText.unknownOutput}:`).type(
      `This is a comment on ${outputText.unknownOutput} so that we can approve or reject it`
    );

    cy.get("@approveBtn").should("be.enabled").should("not.be.checked");
    cy.get("@rejectBtn").should("be.enabled").should("not.be.checked");

    cy.get("@approveBtn").closest(`label`).click();
    cy.get("@approveBtn").should("be.checked");

    cy.get("@rejectBtn").closest(`label`).click();
    cy.get("@rejectBtn").should("be.checked");
    cy.get("@approveBtn").should("not.be.checked");

    cy.findByLabelText(
      `Review comments on ${outputText.unknownOutput}:`
    ).clear();
    cy.get("@approveBtn").should("be.disabled").should("not.be.checked");
    cy.get("@rejectBtn").should("be.disabled").should("not.be.checked");
  });

  it("restores state when visiting a passing output", () => {
    const comment = `This is a comment on ${outputText.passingOutput} so that we can check state`;
    cy.findByText(outputText.passingOutput).click();

    cy.findByLabelText("Approve").as("approveBtn");
    cy.findByLabelText(`Review comments on ${outputText.passingOutput}:`).as(
      "commentText"
    );

    cy.get("@commentText").type(comment);

    cy.get("@approveBtn").should("not.be.checked").closest(`label`).click();
    cy.get("@approveBtn").should("be.checked");

    cy.findByText(outputText.failingOutput).click();
    cy.get("@approveBtn").should("not.be.enabled");

    cy.findByText(outputText.passingOutput).click();
    cy.get("@approveBtn").should("be.enabled").should("be.checked");
    cy.get("@commentText").value = comment;
  });

  it("restores state when visiting a failing output", () => {
    const comment = `This is a comment on ${outputText.failingOutput} so that we can check state`;
    cy.findByText(outputText.failingOutput).click();

    cy.findByLabelText("Reject").as("rejectBtn");
    cy.findByLabelText(`Review comments on ${outputText.failingOutput}:`).as(
      "commentText"
    );

    cy.get("@commentText").type(comment);

    cy.get("@rejectBtn").should("not.be.checked").closest(`label`).click();
    cy.get("@rejectBtn").should("be.checked");

    cy.findByText(outputText.passingOutput).click();
    cy.get("@rejectBtn").should("not.be.enabled");

    cy.findByText(outputText.failingOutput).click();
    cy.get("@rejectBtn").should("be.enabled").should("be.checked");
    cy.get("@commentText").value = comment;
  });

  it("restores state when visiting an unknown output", () => {
    const comment = `This is a comment on ${outputText.unknownOutput} so that we can check state`;
    cy.findByText(outputText.unknownOutput).click();

    cy.findByLabelText("Approve").as("approveBtn");
    cy.findByLabelText("Reject").as("rejectBtn");
    cy.findByLabelText(`Review comments on ${outputText.unknownOutput}:`).as(
      "commentText"
    );

    cy.get("@commentText").type(comment);

    cy.get("@approveBtn").should("not.be.checked").should("be.enabled");
    cy.get("@rejectBtn").should("not.be.checked").should("be.enabled");
    cy.get("@approveBtn").closest(`label`).click();
    cy.get("@approveBtn").should("be.checked");

    cy.findByText(outputText.failingOutput).click();
    cy.get("@approveBtn").should("not.be.enabled");

    cy.findByText(outputText.unknownOutput).click();
    cy.get("@approveBtn").should("be.enabled").should("be.checked");
    cy.get("@commentText").value = comment;
  });

  it("restores state when visiting an passing output, then when the comment is removed cannot reject", () => {
    const comment = `This is a comment on ${outputText.passingOutput} so that we can check state`;
    cy.findByText(outputText.passingOutput).click();

    cy.findByLabelText("Approve").as("approveBtn");
    cy.findByLabelText("Reject").as("rejectBtn");
    cy.findByLabelText(`Review comments on ${outputText.passingOutput}:`).as(
      "commentText"
    );

    cy.get("@commentText").type(comment);

    cy.get("@rejectBtn").should("be.enabled");

    cy.get("@approveBtn").should("not.be.checked").closest(`label`).click();
    cy.get("@approveBtn").should("be.checked");

    cy.findByText(outputText.failingOutput).click();
    cy.get("@approveBtn").should("not.be.enabled");

    cy.findByText(outputText.passingOutput).click();
    cy.get("@approveBtn").should("be.enabled").should("be.checked");
    cy.get("@rejectBtn").should("be.enabled");
    cy.get("@commentText").value = comment;

    cy.get("@commentText").clear();
    cy.get("@rejectBtn").should("not.be.enabled");
  });

  it("restores state when visiting a failed output, then when the comment is removed cannot approve", () => {
    const comment = `This is a comment on ${outputText.failingOutput} so that we can check state`;
    cy.findByText(outputText.failingOutput).click();

    cy.findByLabelText("Approve").as("approveBtn");
    cy.findByLabelText("Reject").as("rejectBtn");
    cy.findByLabelText(`Review comments on ${outputText.failingOutput}:`).as(
      "commentText"
    );

    cy.get("@commentText").type(comment);

    cy.get("@approveBtn").should("be.enabled");

    cy.get("@rejectBtn").should("not.be.checked").closest(`label`).click();
    cy.get("@rejectBtn").should("be.checked");

    cy.findByText(outputText.passingOutput).click();
    cy.get("@rejectBtn").should("not.be.enabled");

    cy.findByText(outputText.failingOutput).click();
    cy.get("@rejectBtn").should("be.enabled").should("be.checked");
    cy.get("@approveBtn").should("be.enabled");
    cy.get("@commentText").value = comment;

    cy.get("@commentText").clear();
    cy.get("@approveBtn").should("not.be.enabled");
  });

  it("restores state when visiting an unknown output, then when the comment is removed cannot approve or reject", () => {
    const comment = `This is a comment on ${outputText.unknownOutput} so that we can check state`;
    cy.findByText(outputText.unknownOutput).click();

    cy.findByLabelText("Approve").as("approveBtn");
    cy.findByLabelText("Reject").as("rejectBtn");
    cy.findByLabelText(`Review comments on ${outputText.unknownOutput}:`).as(
      "commentText"
    );

    cy.get("@commentText").type(comment);

    cy.get("@approveBtn").should("be.enabled");
    cy.get("@rejectBtn").should("be.enabled");

    cy.get("@approveBtn").should("not.be.checked").closest(`label`).click();
    cy.get("@approveBtn").should("be.checked");

    cy.findByText(outputText.failingOutput).click();
    cy.get("@approveBtn").should("not.be.enabled");

    cy.findByText(outputText.unknownOutput).click();
    cy.get("@approveBtn").should("be.enabled").should("be.checked");
    cy.get("@rejectBtn").should("be.enabled");
    cy.get("@commentText").value = comment;

    cy.get("@commentText").clear();
    cy.get("@approveBtn").should("not.be.enabled").should("not.be.checked");
    cy.get("@rejectBtn").should("not.be.enabled").should("not.be.checked");
  });
});
