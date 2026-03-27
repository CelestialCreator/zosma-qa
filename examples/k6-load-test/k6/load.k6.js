import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

/**
 * Load test — constant 5 VUs for 10 seconds.
 *
 * Validates that zosma.ai serves all public pages under 1 second
 * at a light, steady load. This is the simplest k6 test profile.
 */
export const options = {
  vus: 5,
  duration: '10s',
  thresholds: {
    'http_req_duration': ['p(95)<1000'],
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://www.zosma.ai';

const PAGES = ['/', '/about', '/openzosma', '/contact'];

export default function () {
  for (const page of PAGES) {
    const res = http.get(`${BASE_URL}${page}`);
    check(res, {
      [`${page} status 200`]: (r) => r.status === 200,
      [`${page} duration < 1s`]: (r) => r.timings.duration < 1000,
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  const outputPath = __ENV.SUMMARY_OUTPUT || 'k6-results/load-summary.json';

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [outputPath]: JSON.stringify(data, null, 2),
  };
}
