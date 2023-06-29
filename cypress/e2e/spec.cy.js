describe('template spec', () => {
  it('passes', () => {
    cy.visit('http://localhost:8000')
    cy.get('[data-cy="filesList"] li').each(($el, index, $list) => {
      cy.wrap($el).click()
      cy.get('[data-cy="approve"]').click()
    })
    // prepare for form submission that returns back a file
    // https://on.cypress.io/intercept
    cy.intercept({
      pathname: '/review*',
      method: 'POST',
    }, (req) => {
      // instead of redirecting to the zip file
      // and having the browser deal with it,
      // we download the file ourselves
      // but we cannot use Cypress commands inside the callback
      // so we will download it later using the captured URL
      req.redirect('/')
    }).as('records')

    cy.get('button#openModalBtn').click()

    cy.wait('@records').its('request').then((req) => {
      cy.request(req)
        .then(({ body, headers }) => {
          const { "content-type": contentType } = headers;
          expect(contentType).to.be.oneOf([
            "application/x-zip-compressed",
            "application/zip"
          ]);
      })
    })
  })
})
