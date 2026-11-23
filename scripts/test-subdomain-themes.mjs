import assert from 'node:assert/strict';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
const server=await createServer({configFile:false,plugins:[react()],server:{middlewareMode:true,hmr:false,ws:false}, optimizeDeps:{noDiscovery:true},appType:'custom'});
let count=0;
try {
 for(const theme of ['Classic','Minimal','Glass','Luminary','Aurora','Five']) {
  const {default:Component}=await server.ssrLoadModule(`/src/components/themes/Theme${theme}.jsx`);
  for(const base of [undefined,'/t/rahul','/theme-preview/glass/13']) {
   for(const currentPage of ['home','about','classes','batches','gallery','achievements','experience']) {
    const expectedBase=base || '/t/rahul';
    const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(Component,{username:'rahul',previewBasePath:base,currentPage,profile:{firstName:'Rahul'}, tuition:{}})));
    assert.ok(html.includes(`href="${expectedBase}/about"`),`${theme}: About remains on ${base}`);
    assert.ok(html.includes(`href="${expectedBase}"`),`${theme}: Home remains on ${base}`);
    assert.ok(!html.includes('/tutor/rahul'),`${theme}: no legacy paths`);
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
     if (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
      assert.ok(href === expectedBase || href.startsWith(`${expectedBase}/`), `${theme}/${currentPage}: ${href} stays under ${expectedBase}`);
     }
    }
    count++;
   }
  }
 }
 console.log(`Path-based theme checks passed: ${count} theme/page/environment renders.`);
} finally {await server.close();}
