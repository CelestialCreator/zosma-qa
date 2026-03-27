import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

/**
 * Stress test — ramp from 1 to 20 VUs in stages.
 *
 * Gradually increases load to find the breaking point.
 * Stages: warm up → ramp to 50% → hold → ramp to 100% → hold → cool down.
 */
export const options = {
  stages: [
    { duration: '10s', target: 5 },   // warm up
    { duration: '20s', target: 10 },  // ramp to 50%
    { duration: '10s', target: 10 },  // hold at 50%
    { duration: '20s', target: 20 },  // ramp to 100%
    { duration: '10s', target: 20 },  // hold at 100%
    { duration: '10s', target: 0 },   // cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1500'],
    'http_req_failed': ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://www.zosma.ai';

const PAGES = ['/', '/about', '/openzosma', '/contact'];

export default function () {
  const page = PAGES[Math.floor(Math.random() * PAGES.length)];
  const res = http.get(`${BASE_URL}${page}`);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'duration < 1.5s': (r) => r.timings.duration < 1500,
  });

  sleep(1);
}

export function handleSummary(data) {
  const outputPath = __ENV.SUMMARY_OUTPUT || 'k6-results/stress-summary.json';

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [outputPath]: JSON.stringify(data, null, 2),
  };
}
