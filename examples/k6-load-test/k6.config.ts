import { defineK6Config } from '@zosmaai/zosma-qa-k6';

/**
 * k6 config for the zosma.ai example load test suite.
 *
 * This shows how a team would configure zosma-qa for load testing
 * a production site. VU counts are kept low for the demo.
 */
export default defineK6Config({
  baseURL: 'https://www.zosma.ai',
  testType: 'load',
  vus: 5,
  duration: '10s',
  endpoints: [
    { method: 'GET', path: '/' },
    { method: 'GET', path: '/about' },
    { method: 'GET', path: '/openzosma' },
    { method: 'GET', path: '/contact' },
  ],
  thresholds: [
    { metric: 'http_req_duration', condition: 'p(95)<1000' },
    { metric: 'http_req_failed', condition: 'rate<0.01' },
  ],
});
