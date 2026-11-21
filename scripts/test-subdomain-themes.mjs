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
  for(const base of ['https://rahul.tutorfolio.site','https://rahul.alpha.tutorfolio.site','/theme-preview/glass/13']) {
   for(const currentPage of ['home','about']) {
    const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(Component,{username:'rahul',previewBasePath:base,currentPage,profile:{firstName:'Rahul'}, tuition:{}})));
    assert.ok(html.includes(`href="${base}/about"`),`${theme}: About remains on ${base}`);
    assert.ok(html.includes(`href="${base}"`),`${theme}: Home remains on ${base}`);
    assert.ok(!html.includes('/tutor/rahul'),`${theme}: no legacy paths`);
    count++;
   }
  }
 }
 console.log(`Subdomain theme checks passed: ${count} theme/page/environment renders.`);
} finally {await server.close();}
