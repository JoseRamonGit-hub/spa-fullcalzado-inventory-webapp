import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "/home/zionhes/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome",
  headless: true,
});

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto("http://127.0.0.1:5173/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: "Correo Electrónico" }).fill("maria@tienda.com");
  await page.getByRole("textbox", { name: "Contraseña" }).fill("password123");
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await page.waitForURL("**/inventory");

  await page.goto("http://127.0.0.1:5173/transactions", { waitUntil: "networkidle" });
  await page.screenshot({ path: "output/playwright/sales-module-audit/desktop.png" });

  const desktop = await page.evaluate(() => ({
    title: document.title,
    bodyText: document.body.innerText,
    tables: Array.from(document.querySelectorAll("[data-slot=table-container]")).map((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      overflowX: getComputedStyle(element).overflowX,
    })),
  }));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "output/playwright/sales-module-audit/mobile.png" });

  const mobile = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    tables: Array.from(document.querySelectorAll("[data-slot=table-container]")).map((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      overflowX: getComputedStyle(element).overflowX,
    })),
    scrollHosts: Array.from(document.querySelectorAll(".custom-scrollbar")).map((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      overflowX: getComputedStyle(element).overflowX,
    })),
  }));

  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} finally {
  await browser.close();
}
