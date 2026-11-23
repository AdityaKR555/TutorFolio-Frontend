import assert from 'node:assert/strict';
import { getTutorWebsiteUrl, getTutorNavigationBase, USERNAME_PATTERN } from '../src/utils/websiteUrls.js';

for (const origin of ['https://tutorfolio.site', 'https://alpha.tutorfolio.site', 'https://domain.com', 'http://localhost:5173', 'http://127.0.0.1:5173']) {
  const location = new URL(`${origin}/dashboard`);
  assert.equal(getTutorWebsiteUrl('Rahul', location), `${origin}/t/rahul`);
  assert.equal(getTutorWebsiteUrl('rahul_me', location), `${origin}/t/rahul_me`);
  assert.equal(getTutorWebsiteUrl('api', location), `${origin}/t/api`);
}
assert.equal(getTutorWebsiteUrl('rahul', null), '/t/rahul');
assert.equal(getTutorNavigationBase('rahul'), '/t/rahul');
for (const username of ['', '../rahul', '.', '..', 'rahul/abc', 'a'.repeat(31)]) {
  assert.equal(getTutorWebsiteUrl(username, null), '', username);
}
// Signup rules are independent of public website routing.
for (const username of ['a.b', 'a_b', '-abc', 'abc-', 'ab', 'xn--tutor', 'tutor/abc', 'a'.repeat(31)]) {
  assert.equal(USERNAME_PATTERN.test(username), false, username);
}
console.log('Website URL checks passed: same-origin paths, local development, existing usernames and signup rules.');
