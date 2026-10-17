import {describe,expect,it} from "vitest";
import {applyMigrations,migrationChecksum,validateMigrationPlan,validateCompletedMigrations} from "./migrations.js";
import type {Pool} from 'mysql2/promise';

describe("migration startup safety",()=>{
  const one={id:'0001_baseline',definition:'baseline',run:async()=>{}},two={id:'0002_invitations',definition:'invitations',run:async()=>{}};
  it('check mode performs no DDL or migration callbacks, even with pending history',async()=>{
    let callbacks=0,released=false;const statements:string[]=[];
    const pool={getConnection:async()=>({execute:async(sql:string)=>{statements.push(sql);return[[{acquired:1}],[]];},query:async(sql:string)=>{statements.push(sql);if(!sql.startsWith('SELECT id,checksum'))throw new Error('Unexpected mutation');return[[{id:one.id,checksum:migrationChecksum(one.definition)}],[]];},release:()=>{released=true;}})} as unknown as Pool;
    await expect(applyMigrations(pool,'isolated',[one,{...two,run:async()=>{callbacks++;}}],'check')).rejects.toThrow(/pending/);
    expect(callbacks).toBe(0);expect(released).toBe(true);expect(statements.every(sql=>sql.startsWith('SELECT'))).toBe(true);
  });
  it('check-only startup refuses pending migrations and accepts an exact frozen ledger',()=>{expect(()=>validateCompletedMigrations([one,two],[{id:one.id,checksum:migrationChecksum(one.definition)}])).toThrow(/pending/);expect(()=>validateCompletedMigrations([one],[{id:one.id,checksum:migrationChecksum(one.definition)}])).not.toThrow();expect(()=>validateCompletedMigrations([one],[{id:one.id,checksum:'changed'}])).toThrow(/changed/);});
  it("rejects duplicate or unordered migrations before any schema modification",()=>{
    expect(()=>validateMigrationPlan([one,two])).not.toThrow();
    expect(()=>validateMigrationPlan([one,one])).toThrow(/unique|order/);
    expect(()=>validateMigrationPlan([two,one])).toThrow(/order/);
  });
  it("refuses a newer database or changed applied definition instead of blindly migrating",()=>{
    expect(()=>validateMigrationPlan([one],[{id:'9999_future',checksum:'unknown'}])).toThrow(/newer|unknown/);
    expect(()=>validateMigrationPlan([one],[{id:one.id,checksum:'changed'}])).toThrow(/changed/);
  });
  it('rejects holes in applied history and accepts a valid immutable prefix',()=>{
    expect(()=>validateMigrationPlan([one,two],[{id:two.id,checksum:migrationChecksum(two.definition)}])).toThrow(/gap/);
    expect(()=>validateMigrationPlan([one,two],[{id:one.id,checksum:migrationChecksum(one.definition)}])).not.toThrow();
  });
});
