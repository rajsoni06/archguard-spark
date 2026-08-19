const fs = require('fs');

// Fix catalog.ts
let cat = fs.readFileSync('src/lib/catalog.ts', 'utf8');
const replacement = `export type Capability =
  | "client"
  | "dns"
  | "cdn"
  | "waf"
  | "load-balancer"
  | "api-gateway"
  | "compute"
  | "container"
  | "serverless"
  | "autoscaling"
  | "cache"
  | "database"
  | "managed-database"
  | "nosql"
  | "object-storage"
  | "block-storage"
  | "network"
  | "private-network"
  | "auth"
  | "encryption"
  | "secrets"
  | "monitoring"
  | "tracing"
  | "queue"
  | "pubsub"
  | "streaming"
  | "data"
  | "archive";`;
cat = cat.replace(/export type Capability =[\s\S]*?;/, replacement);
fs.writeFileSync('src/lib/catalog.ts', cat);

// Fix costEngine.ts
let cost = fs.readFileSync('src/lib/costEngine.ts', 'utf8');
const costMatch = cost.match(/const BASE_CAP_COSTS: Record<Capability, number> = \{[\s\S]*?\};/);
if (costMatch) {
    const newCosts = `const BASE_CAP_COSTS: Record<Capability, number> = {
  client: 0,
  dns: 0.5,
  cdn: 15,
  waf: 20,
  "load-balancer": 18,
  "api-gateway": 5,
  compute: 30,
  container: 45,
  serverless: 2,
  autoscaling: 5,
  cache: 16,
  database: 50,
  "managed-database": 80,
  nosql: 40,
  "object-storage": 5,
  "block-storage": 10,
  network: 5,
  "private-network": 10,
  auth: 5,
  encryption: 5,
  secrets: 2,
  monitoring: 5,
  tracing: 5,
  queue: 2,
  pubsub: 2,
  streaming: 15,
  data: 20,
  archive: 1,
};`;
    cost = cost.replace(costMatch[0], newCosts);
    fs.writeFileSync('src/lib/costEngine.ts', cost);
}

console.log('TS fixes applied');
