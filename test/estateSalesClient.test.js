import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractSaleId,
  fetchSaleData,
  normalizePictureUrls,
} from '../src/estateSalesClient.js';

test('extractSaleId accepts sale IDs and listing URLs', () => {
  assert.equal(extractSaleId('135336'), '135336');
  assert.equal(
    extractSaleId('https://www.estatesales.net/TN/Memphis/38119/135336'),
    '135336',
  );
  assert.equal(
    extractSaleId('https://www.estatesales.net/TN/Memphis/38119/135336?foo=bar'),
    '135336',
  );
});

test('extractSaleId rejects non-listing input', () => {
  assert.throws(() => extractSaleId('https://www.estatesales.net/TN/Memphis/38119'));
});

test('normalizePictureUrls preserves order and removes duplicates', () => {
  assert.deepEqual(
    normalizePictureUrls([
      { url: 'https://pictures.example/a.jpg' },
      { url: 'https://pictures.example/b.jpg' },
      { url: 'https://pictures.example/a.jpg' },
      null,
    ]),
    ['https://pictures.example/a.jpg', 'https://pictures.example/b.jpg'],
  );
});

test('fetchSaleData normalizes the legacy sale response', async () => {
  const fakeFetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        sale: {
          typeName: 'Estate Sale',
          title: 'Calibration House',
          pictures: [
            { url: 'https://pictures.example/1.jpg' },
            { url: 'https://pictures.example/2.jpg' },
            { url: 'https://pictures.example/1.jpg' },
          ],
        },
      };
    },
  });

  const result = await fetchSaleData('135336', { fetchImpl: fakeFetch });
  assert.equal(result.saleId, '135336');
  assert.equal(result.rawPictureCount, 3);
  assert.equal(result.uniquePictureCount, 2);
  assert.equal(result.extractionMethod, 'legacy-sale-endpoint');
});
