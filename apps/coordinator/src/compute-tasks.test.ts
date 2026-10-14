import {describe,it,expect} from 'vitest';
describe('compute task admission',()=>{
  it('admits bounded portable input without allowing client ownership or network overrides',async()=>{
    const module=await import('./compute-tasks.js').catch(()=>null);
    expect(module?.computeSubmissionSchema.safeParse({payload:{operation:'prime_count',limit:20}}).success??false).toBe(true);
    expect(module?.computeSubmissionSchema.safeParse({payload:{operation:'prime_count',limit:20},networkId:'foreign'}).success??true).toBe(false);
    expect(module?.computeSubmissionSchema.safeParse({payload:{operation:'python_compile',source:'print(1)'}}).success??true).toBe(false);
    expect(module?.computeSubmissionSchema.safeParse({payload:{operation:'prime_count',limit:2000001}}).success??true).toBe(false);
  });
  it('fixes history at ten per page and rejects invalid offsets',async()=>{
    const module=await import('./compute-tasks.js').catch(()=>null);
    expect(module?.computePageSchema.safeParse({page:'2'}).data).toEqual({page:2});
    expect(module?.computePageSchema.safeParse({pageSize:100}).success??true).toBe(false);
    expect(module?.computePageSchema.safeParse({page:'1.5'}).success??true).toBe(false);
  });
});
