import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = (await readFile(new URL('../src/api/issueReports.js', import.meta.url), 'utf8'))
  .replace('import api from "./axios";', 'const api = globalThis.reportApiMock;');
let sequence = 0;
async function service(mock, cached = []) {
  globalThis.reportApiMock = mock;
  globalThis.localStorage = { getItem: () => JSON.stringify(cached) };
  return import(`data:text/javascript;base64,${Buffer.from(source + `\n// ${sequence++}`).toString('base64')}`);
}

test('loads persisted reports from the canonical authenticated endpoint', async () => {
  const api = await service({ get: async (url, options) => {
    assert.equal(url, '/issues/my-reports');
    assert.deepEqual(options.params, { page: 1, limit: 20 });
    return { data: { status: 200, data: { total: 1, issueReports: [{ issueReportId: 42 }] } } };
  }});
  assert.equal((await api.getUserIssueReports(13)).total, 1);
});

test('request failures are never converted into zero reports', async () => {
  const api = await service({ get: async () => { throw new Error('Offline'); } });
  await assert.rejects(api.getUserIssueReports(13), /Offline/);
});

test('server error envelopes are surfaced even with HTTP 200', async () => {
  const api = await service({ get: async () => ({ data: { status: 500, message: 'Database unavailable' } }) });
  await assert.rejects(api.getUserIssueReports(13), /Database unavailable/);
});

test('only confirmed server submissions succeed', async () => {
  const api = await service({ post: async (url, payload) => {
    assert.equal(url, '/issues/report');
    assert.equal(payload.title, 'Broken page');
    return { data: { status: 201, data: { issueReportId: 42 } } };
  }});
  assert.equal((await api.createIssueReport({ issueType: 'Bug', title: ' Broken page ', description: ' Details ' })).issueReportId, 42);
});

test('offline submission fails instead of inventing a success reference', async () => {
  const api = await service({ post: async () => { throw new Error('Offline'); } });
  await assert.rejects(api.createIssueReport({ issueType: 'Bug', title: 'Test', description: 'Details' }), /Offline/);
});

test('older local-only reports are preserved and identified without leaking other users', async () => {
  const api = await service({ get: async () => ({ data: { status: 200, data: { total: 1, issueReports: [{ issueReportId: 42 }] } } }) }, [
    { issueReportId: 'local1', userId: 13, isLocal: true },
    { issueReportId: 'foreign', userId: 99, isLocal: true },
  ]);
  const reports = await api.getUserIssueReports(13);
  assert.equal(reports.localCount, 1);
  assert.equal(reports.total, 2);
  assert.equal(reports.issueReports[0].isLocal, true);
});
