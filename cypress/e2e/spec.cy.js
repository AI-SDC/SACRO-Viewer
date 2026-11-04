describe("Start to finish user journey for approving and downloading outputs", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8000");
    cy.contains("Output Checker").click();
  });

  it("Approves all files, visits the summary page, and downloads approved outputs", () => {
    // Comment on and approve each output
    cy.get("[data-sacro-el='outputList'] li").each(($el) => {
      cy.get($el).click();
      cy.findByLabelText(/Review comments on/i).type("This is a comment");
      cy.findByLabelText("Approve").closest("label").click();
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

const summaries = [
  "2ndary_risk_summary_json-DONT_RELEASE",
  "2ndary_risk_summary_csv-DONT_RELEASE",
];

describe("Secondary-risk summaries are read-only", () => {
  beforeEach(() => {
    // Reuse the normal JSON/CSV fixtures, under ACRO's summary output names.
    cy.intercept("GET", "**/checker/*", (req) => {
      req.continue((res) => {
        const doc = new DOMParser().parseFromString(res.body, "text/html");
        const data = doc.getElementById("outputData");
        const outputs = JSON.parse(data.textContent);
        const selected = { ols_pass: outputs.ols_pass };
        ["custom_json", "custom_csv"].forEach((name, index) => {
          selected[summaries[index]] = outputs[name];
          const item = doc.querySelector(`[data-output-name="${name}"]`);
          item.setAttribute("data-output-name", summaries[index]);
          item.querySelector("a span").textContent = summaries[index];
        });
        doc.querySelectorAll("#outputList li").forEach((item) => {
          if (!selected[item.getAttribute("data-output-name")]) item.remove();
        });
        data.textContent = JSON.stringify(selected);
        res.body = `<!DOCTYPE html>${doc.documentElement.outerHTML}`;
      });
    });
    cy.visit("http://localhost:8000");
    cy.contains("Output Checker").click();
  });

  it("keeps both reports visible without review controls or status", () => {
    cy.findByText("ols_pass").click();
    cy.findByLabelText("Approve").should("exist");
    summaries.forEach((name) => {
      cy.get(`[data-output-name="${name}"]`).click();
      cy.get("#reviewForm").should("be.empty");
      cy.get(`[data-output-name="${name}"]`)
        .find('[data-sacro-el="file-list-review-status"]')
        .should("not.be.visible");
      cy.get("#filePreviewContainer").should("not.be.empty");
    });
    cy.findByText("ols_pass").click();
    cy.findByLabelText("Approve").should("be.enabled");
  });

  it("completes review without summary decisions or comments", () => {
    cy.get("#openModalBtn").should("be.disabled");
    cy.findByText("ols_pass").click();
    cy.findByLabelText("Approve").closest("label").click();
    cy.get("#openModalBtn").should("be.enabled").click();
    cy.get("#approveForm").then(($form) => {
      const data = new FormData($form[0]);
      expect(JSON.parse(data.get("review"))).to.deep.equal({
        ols_pass: { state: true, comment: "" },
      });
    });
  });
});
