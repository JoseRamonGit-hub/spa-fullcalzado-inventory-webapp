import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = "http://127.0.0.1:5173";
const outputDir = "output/playwright";
const executablePath = `${process.env.HOME}/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`;

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath });

async function login() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Correo Electrónico").fill("maria@tienda.com");
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 });
  await page.waitForLoadState("domcontentloaded");
  const storageState = await context.storageState();
  await context.close();
  return storageState;
}

async function selectProduct(dialog, code) {
  const search = dialog.getByPlaceholder(/Buscar por código o descripción/);
  await search.fill(code);
  const option = dialog.getByText(code, { exact: true }).last();
  await option.waitFor({ state: "visible", timeout: 10_000 });
  await option.click();
  await dialog.page().waitForTimeout(250);
}

async function screenshot(page, name) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outputDir}/${name}.png`, fullPage: true });
}

async function auditInventory(storageState, viewport, suffix) {
  const context = await browser.newContext({ viewport, storageState });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(`${baseURL}/inventory`, { waitUntil: "domcontentloaded" });
  await page.getByText("Inventario", { exact: true }).first().waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForTimeout(500);
  await page.keyboard.press("Control+i");
  const dialog = page.getByRole("dialog", { name: /Carga de Inventario/i });
  await dialog.waitFor({ state: "visible" });
  await page.waitForTimeout(350);
  await screenshot(page, `inventory-${suffix}-empty`);

  await selectProduct(dialog, "NK-39");
  await dialog.getByLabel("Cantidad a ingresar").fill("2");
  await screenshot(page, `inventory-${suffix}-selected`);

  await dialog.getByRole("button", { name: "Agregar item al lote" }).click();
  await dialog.getByRole("button", { name: /Eliminar NK-39/i }).waitFor({ state: "visible" });
  await screenshot(page, `inventory-${suffix}-batch`);

  await dialog.getByRole("button", { name: /Cargar 1 producto/i }).click();
  const confirm = page.getByRole("alertdialog").or(page.getByRole("dialog", { name: /Confirmar carga/i })).last();
  await confirm.waitFor({ state: "visible" });
  await screenshot(page, `inventory-${suffix}-confirm`);

  const metrics = await page.evaluate(() => {
    const dialogs = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')];
    return dialogs.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 120),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      };
    });
  });

  await context.close();
  return { errors, metrics };
}

async function auditSales(storageState, viewport, suffix) {
  const context = await browser.newContext({ viewport, storageState });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(`${baseURL}/inventory`, { waitUntil: "domcontentloaded" });
  await page.getByText("Inventario", { exact: true }).first().waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForTimeout(500);
  await page.keyboard.press("Control+j");
  const dialog = page.getByRole("dialog", { name: /Registrar Ventas/i });
  await dialog.waitFor({ state: "visible" });
  await page.waitForTimeout(350);
  await screenshot(page, `sales-${suffix}-empty`);

  await selectProduct(dialog, "NK-39");
  await dialog.getByLabel("Cantidad").fill("2");
  await screenshot(page, `sales-${suffix}-selected`);

  await dialog.getByRole("button", { name: "Agregar producto" }).click();
  await dialog.getByRole("button", { name: /Eliminar NK-39/i }).waitFor({ state: "visible" });
  await screenshot(page, `sales-${suffix}-batch`);

  await dialog.getByRole("button", { name: /Registrar 1 venta/i }).click();
  const confirm = page.getByRole("alertdialog").or(page.getByRole("dialog", { name: /Confirmar registro/i })).last();
  await confirm.waitFor({ state: "visible" });
  await screenshot(page, `sales-${suffix}-confirm`);

  const metrics = await page.evaluate(() => {
    const dialogs = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')];
    return dialogs.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 120),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      };
    });
  });

  await context.close();
  return { errors, metrics };
}

try {
  const storageState = await login();
  const scope = process.argv[2] ?? "all";
  const results = {};
  if (scope === "all" || scope === "desktop") {
    results.inventoryDesktop = await auditInventory(storageState, { width: 1440, height: 900 }, "desktop");
    results.salesDesktop = await auditSales(storageState, { width: 1440, height: 900 }, "desktop");
  }
  if (scope === "all" || scope === "mobile") {
    results.inventoryMobile = await auditInventory(storageState, { width: 390, height: 844 }, "mobile");
    results.salesMobile = await auditSales(storageState, { width: 390, height: 844 }, "mobile");
  }
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
