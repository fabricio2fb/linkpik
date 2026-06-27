const fs = require("fs");
const path = require("path");

const root = process.cwd();
const targets = ["app/dashboard", "app/api", "components/dashboard", "components/store"];
const forbidden = [
  "@/lib/mock-data",
  "@/lib/mocks",
  "dashboard.mock",
  "dashboard-modules.mock",
  "physical-products.mock",
  "MockDashboardSection",
  "MockTable",
  "mockPaymentStatus",
  "shippingOptionsMock",
  "physicalOrders2",
  "physicalFlow",
  "deliveryKanban",
  "orderTimeline",
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx|js|jsx)$/.test(entry.name) ? [full] : [];
  });
}

const failures = [];
for (const target of targets) {
  for (const file of walk(path.join(root, target))) {
    const content = fs.readFileSync(file, "utf8");
    for (const token of forbidden) {
      if (content.includes(token)) {
        failures.push(`${path.relative(root, file)} -> ${token}`);
      }
    }
  }
}

if (failures.length) {
  console.error("Mocks operacionais encontrados:\n" + failures.join("\n"));
  process.exit(1);
}

console.log("Nenhum mock operacional encontrado nos diretórios protegidos.");
