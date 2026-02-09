import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Ramp up to 20 users
        { duration: '1m', target: 20 },  // Stay at 20 users
        { duration: '10s', target: 0 },  // Ramp down
    ],
};

const BASE_URL = 'http://localhost:3000'; // Change to production URL

export default function () {
    // 1. Visit Landing Page
    let res = http.get(`${BASE_URL}/`);
    check(res, { 'status was 200': (r) => r.status === 200 });
    sleep(1);

    // 2. Visit Course Catalog
    res = http.get(`${BASE_URL}/courses`);
    check(res, { 'status was 200': (r) => r.status === 200 });
    sleep(1);

    // 3. Visit Course Detail (Simulate checking a popular course)
    // Need a valid ID, here we assume one exists or just check 404 handling if not
    // res = http.get(`${BASE_URL}/courses/some-uuid`);

    // 4. API Health check (if exists)
}
