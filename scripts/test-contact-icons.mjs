import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { contactIconSettings, getContactActions } from '../src/utils/contactIcons.js';

const numbers = { mobileNo: 919876543210, whatsappNo: 919876543211, alternateNo: 919876543212 };
const enabled = { ...numbers, showMobileIcon: true, showWhatsappIcon: true, showAlternateIcon: true };
assert.deepEqual(getContactActions(numbers), []);
assert.deepEqual(getContactActions({ mobileNo: '0000000000', showMobileIcon: true }), []);
assert.equal(getContactActions(enabled).length, 2);
assert.deepEqual(getContactActions({ ...enabled, whatsappNo: null }).map(({ field }) => field), ['mobileNo']);
assert.equal(contactIconSettings({ ...enabled, mobileNo: '   ' }).showMobileIcon, false);
assert.equal(contactIconSettings({ ...enabled, showWhatsappIcon: 'false' }).showWhatsappIcon, false);
assert.equal(getContactActions({ whatsappNo: '+919876543211', showWhatsappIcon: true })[0].href, 'https://wa.me/919876543211');
assert.deepEqual(getContactActions({ showWhatsappIcon: true, socialMedia: { whatsapp: 'https://wa.me/919876543211' } }), []);

const server = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true }, appType: 'custom' });
let renders = 0;
try {
  for (const theme of ['Classic', 'Minimal', 'Glass', 'Luminary', 'Aurora', 'Five']) {
    const { default: Component } = await server.ssrLoadModule(`/src/components/themes/Theme${theme}.jsx`);
    for (const page of ['home', 'about']) {
      for (const [profile, expected] of [
        [enabled, 2],
        [numbers, 0],
        [{ ...enabled, showMobileIcon: false, showAlternateIcon: false }, 1],
        [{ ...enabled, mobileNo: '', whatsappNo: '', alternateNo: '', socialMedia: { whatsapp: 'https://wa.me/1234567890' } }, 0],
      ]) {
        const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Component, { profile, currentPage: page, username: 'test' })));
        const floating = html.match(/<aside aria-label="Contact tutor"[\s\S]*?<\/aside>/)?.[0] || '';
        assert.equal((floating.match(/<a /g) || []).length, expected, `${theme}/${page}: expected ${expected} icons`);
        if (expected === 2) {
          assert.ok(floating.includes(`tel:${numbers.mobileNo}`), theme);
          assert.ok(!floating.includes(`tel:${numbers.alternateNo}`), theme);
          assert.ok(floating.includes(`https://wa.me/${numbers.whatsappNo}`), theme);
        }
        renders++;
      }
    }
  }
  console.log(`Contact icon checks passed: shared rules and ${renders} theme/page/state renders.`);
} finally {
  await server.close();
}
