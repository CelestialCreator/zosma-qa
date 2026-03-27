import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

/**
 * Spike test — sudden burst to 50 VUs then rapid recovery.
 *
 * Simulates a traffic spike (e.g. marketing campaign, viral post)
 * to verify the site stays up and recovers quickly.
 */
export const options = {
  stages: [
    { duration: '5s', target: 5 },    // baseline
    { duration: '5s', target: 50 },   // spike up
    { duration: '10s', target: 50 },  // hold spike
    { duration: '5s', target: 5 },    // recover
    { duration: '5s', target: 0 },    // cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.10'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://www.zosma.ai';

const PAGES = ['/', '/about', '/openzosma', '/contact'];

export default function () {
  const page = PAGES[Math.floor(Math.random() * PAGES.length)];
  const res = http.get(`${BASE_URL}${page}`);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'responds under spike': (r) => r.timings.duration < 2000,
  });

  sleep(0.5);
}

export function handleSummary(data) {
  const outputPath = __ENV.SUMMARY_OUTPUT || 'k6-results/spike-summary.json';

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [outputPath]: JSON.stringify(data, null, 2),
  };
}
