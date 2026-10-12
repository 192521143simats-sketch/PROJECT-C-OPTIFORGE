import {describe,expect,it} from "vitest";
import {migrationChecksum,validateMigrationPlan} from "./migrations.js";

describe("migration startup safety",()=>{
  const one={id:'0001_baseline',definition:'baseline',run:async()=>{}},two={id:'0002_invitations',definition:'invitations',run:async()=>{}};
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
