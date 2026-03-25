describe('Login page', () => {
  it('opens the forgot password form and fills the email field', () => {
    cy.visit('/login');

    cy.contains('button', 'Forgot password?').click();
    cy.contains('label', 'Work Email').should('be.visible');
    cy.get('input[name="forgotEmail"]').type('user@example.com');
    cy.get('input[name="forgotEmail"]').should('have.value', 'user@example.com');
  });
});
