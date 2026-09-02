import { neon } from "@neondatabase/serverless";
import { expect, test } from "@playwright/test";

test("a user can sign up, search, log out, and log back in", async ({ page }) => {
  const email = `reviewer-${Date.now()}@example.com`;
  const password = "Review-password-2026";

  try {
    await page.goto("/sign-up");
    await page.getByLabel("Name").fill("RTS Reviewer");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create your account" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByLabel("Stock symbol").fill("aapl");
    await page.getByRole("button", { name: "Check the open" }).click();

    await expect(page.getByRole("heading", { name: "AAPL" })).toBeVisible();
    await expect(
      page.getByText("$231.42", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText("1 saved searches")).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/sign-in$/);

    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill(password);
    await page
      .getByRole("button", { name: "Continue to your dashboard" })
      .click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("AAPL", { exact: true })).toBeVisible();
    await expect(page.getByText("$231.42", { exact: true })).toBeVisible();
  } finally {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      const sql = neon(databaseUrl);
      await sql`delete from "user" where email = ${email}`;
    }
  }
});

test("an anonymous visitor cannot access the dashboard", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/sign-in$/);
});
