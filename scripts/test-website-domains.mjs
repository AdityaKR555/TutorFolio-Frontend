import assert from 'node:assert/strict';
import { resolveWebsiteHost, getTutorWebsiteUrl, USERNAME_PATTERN } from '../src/utils/websiteUrls.js';
const config = {platformDomains:['tutorfolio.site','alpha.tutorfolio.site','beta.tutorfolio.site','www.tutorfolio.site'], reservedSubdomains:['alpha','beta','www','docs','api']};
for (const baseDomain of config.platformDomains) {
 assert.equal(resolveWebsiteHost(baseDomain,config).kind,'platform');
 assert.deepEqual(resolveWebsiteHost(`rahul.${baseDomain}`,config), {kind:'tutor',username:'rahul',baseDomain});
 for(const reserved of ['api','docs']) assert.equal(resolveWebsiteHost(`${reserved}.${baseDomain}`,config).kind,'protected');
 const location={hostname:baseDomain,origin:`https://${baseDomain}`,protocol:'https:',port:''};
 assert.equal(getTutorWebsiteUrl('Rahul',location,config),`https://rahul.${baseDomain}`);
}
for(const hostname of ['tutorfolio.site.evil.com','rahul.evil.com','foo.rahul.tutorfolio.site','-rahul.tutorfolio.site','rahul_.tutorfolio.site']) assert.equal(resolveWebsiteHost(hostname,config).kind,'unknown');
assert.equal(resolveWebsiteHost('RAHUL.ALPHA.TUTORFOLIO.SITE.',config).username,'rahul');
assert.equal(getTutorWebsiteUrl('docs',{hostname:'alpha.tutorfolio.site'},config),'');
assert.equal(getTutorWebsiteUrl('rahul',{hostname:'rahul.alpha.tutorfolio.site', protocol:'https:',port:''},config),'https://rahul.alpha.tutorfolio.site');
assert.equal(getTutorWebsiteUrl('rahul',{hostname:'localhost',origin:'http://localhost:5173'},config),'http://rahul.localhost:5173');
assert.equal(resolveWebsiteHost('rahul.localhost',config).username,'rahul');
for(const username of ['a.b','a_b','-abc','abc-','ab','xn--tutor','tutor/abc','a'.repeat(31)]) assert.equal(USERNAME_PATTERN.test(username),false,username);
const custom={platformDomains:['academy.example.co.uk','beta.academy.example.co.uk'],reservedSubdomains:['api','beta']};
assert.deepEqual(resolveWebsiteHost('rahul.beta.academy.example.co.uk',custom),{kind:'tutor',username:'rahul',baseDomain:'beta.academy.example.co.uk'});
console.log('Website domain checks passed: platform/tenant/protected hosts, custom roots, environment URLs, local fallback and DNS labels.');
