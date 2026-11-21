import assert from 'node:assert/strict';
import {recoverGalleryImage} from '../src/utils/galleryDelivery.js';
const gallery=[{fileId:53,fileUrl:'https://images.example.com/gallery/photo.jpg'}];
let stopped=0;
const image={tagName:'IMG',currentSrc:gallery[0].fileUrl,src:gallery[0].fileUrl,dataset:{}};
const event={target:image,stopPropagation(){stopped++;}};
recoverGalleryImage(event,gallery,'https://api.example.com/');
assert.equal(image.src,'https://api.example.com/gallery/public/53');
assert.equal(stopped,1);
// Never loop on retry failures or interfere with existing theme failure handlers.
image.currentSrc=image.src;
recoverGalleryImage(event,gallery,'https://api.example.com');
assert.equal(stopped,1);
const external={tagName:'IMG',currentSrc:'https://other.example.com/private.jpg',dataset:{}};
recoverGalleryImage({target:external,stopPropagation(){throw Error('unexpected retry');}},gallery,'https://api.example.com');
assert.equal(external.src,undefined);
console.log('Gallery delivery checks passed: known images retry once, unrelated media stays unchanged.');
