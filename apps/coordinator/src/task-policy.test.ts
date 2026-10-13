import {it,expect} from 'vitest';
import {retryDelayMs,verifyArtifactIntegrity} from './task-policy.js';
import {createHash} from 'node:crypto';
it('uses stable bounded exponential retry delay across restarts',()=>{
  expect(retryDelayMs('TASK-A',1)).toBeGreaterThanOrEqual(500);
  expect(retryDelayMs('TASK-A',2)).toBeGreaterThan(retryDelayMs('TASK-A',1));
  expect(retryDelayMs('TASK-A',20)).toBeLessThanOrEqual(30000);
  expect(retryDelayMs('TASK-A',7)).toBe(30000); // same cap as persisted MySQL expression
  expect(retryDelayMs('TASK-A',2)).toBe(retryDelayMs('TASK-A',2));
});
it('rejects corrupted or truncated artifact bytes rather than downloading them',()=>{
  const bytes=Buffer.from('real generated output'),digest=createHash('sha256').update(bytes).digest('hex');
  expect(verifyArtifactIntegrity(bytes,bytes.length,digest)).toBe(true);
  expect(verifyArtifactIntegrity(Buffer.from('altered generated output'),bytes.length,digest)).toBe(false);
  expect(verifyArtifactIntegrity(bytes,bytes.length+1,digest)).toBe(false);
  expect(verifyArtifactIntegrity(bytes,bytes.length,null)).toBe(false);
});
