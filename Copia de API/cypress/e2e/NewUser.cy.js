describe("Add new user in orangehrmlive", () => {
  beforeEach(() => {
    cy.visit(
      "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login"
    );
  });

  it("Should succesfuly create a new user", () => {
    cy.get('input[name="username"]').type("Admin");
    cy.get('input[name="password"]').type("admin123");
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/dashboard");
    cy.contains("Admin").click();
    cy.contains("Add").click();
    cy.get("form").within(() => {
      cy.get("label").contains("User Role").parent().next().click();
      cy.contains("ESS").click();
      cy.get("label")
        .contains("Employee Name")
        .parent()
        .next()
        .find("input")
        .type("Peter Mac Anderson");
      cy.contains("div", "Peter Mac Anderson").click();

      cy.get("label").contains("Status").parent().next().click();
      cy.contains("Enabled").click();
      const username = "TestUsuario"
      cy.get("label")
        .contains("Username")
        .parent()
        .next()
        .find("input")
        .type(username);

      cy.get("label")
        .contains("Password")
        .parent()
        .next()
        .find("input")
        .type("TestPass123!");
      cy.get("label")
        .contains("Confirm Password")
        .parent()
        .next()
        .find("input")
        .type("TestPass123!");
    });
    cy.contains("Save").click();
    cy.get(".oxd-toast")
      .should("be.visible")
      .and("contain.text", "Successfully Saved");
  });
});