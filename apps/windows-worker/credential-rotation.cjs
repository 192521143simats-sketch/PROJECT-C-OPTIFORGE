function enrollmentIdentity(identity,origin,enrolled,settings){
  if(typeof enrolled?.workerCredential!=='string'||enrolled.workerCredential.length<20||enrolled.workerCredential.length>2048||typeof enrolled.networkId!=='string'||!enrolled.networkId||typeof enrolled.enrollmentId!=='string'||!enrolled.enrollmentId)throw new Error('Invalid enrollment response.');
  return {...identity,origin,credential:enrolled.workerCredential,networkId:enrolled.networkId,enrollmentId:enrolled.enrollmentId,settings};
}
class CredentialRotation {
  #pending;
  get pending(){return Boolean(this.#pending);}
  async import(identity,credential,enrollmentId,nodeId,inspect,save){
    if(!identity?.credential||this.#pending)throw new Error('Finish pending credential rotation first.');
    if(!identity.enrollmentId&&!nodeId)throw new Error('Original worker identity cannot be verified. Leave and enroll again instead.');
    if(typeof credential!=='string'||credential.length<20||credential.length>2048||!enrollmentId)throw new Error('Provide the replacement credential and original enrollment ID.');
    const scope=await inspect(credential);
    if(scope?.networkId!==identity.networkId||scope?.enrollmentId!==enrollmentId||(identity.enrollmentId&&scope.enrollmentId!==identity.enrollmentId)||(nodeId&&scope.nodeId!==nodeId)||scope.workerType&&scope.workerType!=='NATIVE')throw new Error('Replacement does not belong to this worker enrollment.');
    const updated={...identity,credential,enrollmentId};await save(updated);return updated;
  }
  async rotate(identity,request,save){
    if(!identity?.credential)throw new Error('No active enrollment.');
    if(!this.#pending){const result=await request();if(typeof result?.workerCredential!=='string'||result.workerCredential.length<20||result.workerCredential.length>2048)throw new Error('Invalid replacement credential response.');this.#pending={...identity,credential:result.workerCredential};}
    try{await save(this.#pending);}catch{throw new Error('Credential changed at the coordinator but protected saving failed. Retry credential rotation before closing this app. Contribution remains stopped. If the app closes, ask the administrator to revoke this enrollment and join again.');}
    const updated=this.#pending;this.#pending=undefined;return updated;
  }
}
module.exports={CredentialRotation,enrollmentIdentity};
