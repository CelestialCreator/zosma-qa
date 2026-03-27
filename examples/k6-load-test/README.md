# k6 Load Test — Example Performance Tests

This example project demonstrates how to write load tests with `@zosmaai/zosma-qa-k6`. The scripts show three common load testing patterns against the public zosma.ai site.

> **Note:** VU counts are intentionally low for demonstration. Adjust thresholds and VU targets for your own infrastructure.

---

## Prerequisites

1. **Node.js** >= 18
2. **k6** — [installation guide](https://k6.io/docs/get-started/installation/)

   ```bash
   # macOS
   brew install k6

   # Linux (Debian/Ubuntu)
   sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update && sudo apt-get install k6
   ```

---

## Project Structure

```
examples/k6-load-test/
├── k6/
│   ├── load.k6.js      ← Constant VU load test
│   ├── stress.k6.js     ← Ramping stress test
│   └── spike.k6.js      ← Sudden traffic spike test
├── k6.config.ts          ← zosma-qa k6 config
├── package.json
└── README.md             ← this file
```

---

## Running the Examples

### Run all tests via zosma-qa CLI

```bash
cd examples/k6-load-test
npx zosma-qa k6 run
```

### Run individual scripts directly with k6

```bash
# Load test (constant 5 VUs, 10s)
k6 run k6/load.k6.js

# Stress test (ramp 1 → 20 VUs)
k6 run k6/stress.k6.js

# Spike test (burst to 50 VUs)
k6 run k6/spike.k6.js
```

### Override the target URL

```bash
k6 run -e BASE_URL=http://localhost:3000 k6/load.k6.js
```

---

## What the Scripts Demonstrate

### `k6/load.k6.js`
- Constant VU load (5 VUs, 10 seconds)
- Iterates all 4 public pages per VU iteration
- Thresholds: p(95) < 1s, error rate < 1%
- JSON summary output via `handleSummary()`

### `k6/stress.k6.js`
- Ramping stages: warm up → 50% → hold → 100% → hold → cool down
- Random page selection per iteration
- Tests how response times degrade under increasing load

### `k6/spike.k6.js`
- Sudden burst from 5 → 50 VUs
- Relaxed thresholds (p(95) < 2s, error rate < 10%)
- Validates site recovers after traffic spike subsides

---

## Adapting for Your App

1. Update `k6.config.ts` with your base URL and endpoints
2. Copy a script template and adjust VU counts, durations, and thresholds
3. Add POST/PUT endpoints with request bodies for API load testing
4. Use `k6-results/` directory for CI artifact collection

---

## Learn More

- [k6 Documentation](https://k6.io/docs/)
- [k6 Package README](../../packages/k6/README.md)
- [Getting Started with Playwright](../../docs/GETTING_STARTED_PLAYWRIGHT.md) — web testing
- [Appium Demo Example](../appium-demo/) — mobile testing
