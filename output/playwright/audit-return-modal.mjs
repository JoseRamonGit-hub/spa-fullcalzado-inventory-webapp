import { chromium } from "playwright";

const baseURL = "http://127.0.0.1:5173";
const outputDir = "output/playwright";
const executablePath = `${process.env.HOME}/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`;

const browser = await chromium.launch({ headless: true, executablePath });

async function login() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const startupErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") startupErrors.push(message.text());
  });
  page.on("pageerror", (error) => startupErrors.push(error.message));
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1_000);
  if (page.url().includes("/login")) {
    for (let attempt = 0; attempt < 4 && (await page.getByLabel("Correo Electrónico").count()) === 0; attempt += 1) {
      await page.goto(`${baseURL}/login?audit=${Date.now()}-${attempt}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1_500);
    }
    if ((await page.getByLabel("Correo Electrónico").count()) === 0) {
      throw new Error(`La pantalla de acceso no renderizó: ${startupErrors.join(" | ") || "sin error de consola"}`);
    }
    await page.getByLabel("Correo Electrónico").fill("maria@tienda.com");
    await page.getByLabel("Contraseña").fill("password123");
    await page.getByRole("button", { name: "Entrar al panel" }).click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 });
  }
  const storageState = await context.storageState();
  await context.close();
  return storageState;
}

async function capture(page, name) {
  await page.waitForTimeout(300);
  await page.evaluate(() => document.fonts.clear?.());
  await page.screenshot({
    path: `${outputDir}/${name}.png`,
    fullPage: true,
    animations: "disabled",
    style: "* { font-family: Arial, sans-serif !important; }",
  });
}

async function selectProduct(dialog, code) {
  const search = dialog.getByPlaceholder(/Buscar por código o descripción/);
  await search.fill(code);
  const option = dialog.locator("[cmdk-item]").filter({ hasText: code }).first();
  await option.waitFor({ state: "visible", timeout: 10_000 });
  await option.click();
  await pageWait(dialog);
}

async function pageWait(locator) {
  await locator.page().waitForTimeout(250);
}

async function getDialogLayout(dialog) {
  return dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const body = element.children.item(1);
    const footer = element.children.item(2);

    return {
      y: Math.round(rect.y),
      height: Math.round(rect.height),
      bodyHeight: body instanceof HTMLElement ? Math.round(body.getBoundingClientRect().height) : null,
      footerHeight: footer instanceof HTMLElement ? Math.round(footer.getBoundingClientRect().height) : null,
    };
  });
}

async function audit(storageState, viewport, suffix) {
  const context = await browser.newContext({ viewport, storageState });
  await context.route("**/*", async (route) => {
    if (route.request().resourceType() === "font") {
      await route.abort();
      return;
    }
    await route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(`${baseURL}/inventory`, { waitUntil: "domcontentloaded" });
  await page.getByText("Inventario", { exact: true }).first().waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForTimeout(500);
  await page.keyboard.press("Control+k");

  const dialog = page.getByRole("dialog", { name: /^Devolución$/i });
  await dialog.waitFor({ state: "visible" });
  await capture(page, `return-${suffix}-empty`);

  await selectProduct(dialog, "NK-39");
  await dialog.getByLabel("Cantidad").fill("1");
  await capture(page, `return-${suffix}-selected`);
  await dialog.getByRole("button", { name: "Agregar producto" }).click();
  await dialog.getByRole("button", { name: /Eliminar NK-39/i }).waitFor({ state: "visible" });
  await capture(page, `return-${suffix}-refund`);
  const refundLayout = await getDialogLayout(dialog);

  await dialog.getByRole("button", { name: "Registrar devolución" }).click();
  const refundConfirm = page.getByRole("alertdialog");
  await refundConfirm.waitFor({ state: "visible" });
  await capture(page, `return-${suffix}-refund-confirm`);
  await refundConfirm.getByRole("button", { name: "Cancelar" }).click();

  await dialog.getByRole("tab", { name: /Salida/i }).click();
  await selectProduct(dialog, "NK-39");
  await dialog.getByLabel("Cantidad").fill("2");
  await dialog.getByRole("button", { name: "Agregar producto" }).click();
  await dialog.getByRole("button", { name: "Registrar cambio" }).waitFor({ state: "visible" });
  await capture(page, `return-${suffix}-exchange`);
  const exchangeLayout = await getDialogLayout(dialog);

  const bodyMetrics = await dialog.evaluate((element) => {
    const body = element.children.item(1);
    if (!(body instanceof HTMLElement)) return null;

    return {
      overflowY: getComputedStyle(body).overflowY,
      scrollHeight: body.scrollHeight,
      clientHeight: body.clientHeight,
    };
  });

  await dialog.getByRole("button", { name: "Registrar cambio" }).click();
  const exchangeConfirm = page.getByRole("alertdialog");
  await exchangeConfirm.waitFor({ state: "visible" });
  await capture(page, `return-${suffix}-exchange-confirm`);

  const metrics = await page.evaluate(() =>
    [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 180),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      };
    }),
  );

  await context.close();
  return { errors, refundLayout, exchangeLayout, bodyMetrics, metrics };
}

try {
  const storageState = await login();
  const results = {
    desktop: await audit(storageState, { width: 1440, height: 900 }, "desktop"),
    mobile: await audit(storageState, { width: 390, height: 844 }, "mobile"),
  };
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
