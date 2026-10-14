export class WorkerConnections{
  private readonly pending=new Map<string,Promise<void>>();
  async run<T>(identity:string,operation:()=>Promise<T>):Promise<T>{
    const previous=this.pending.get(identity)??Promise.resolve();let release!:()=>void;
    const current=new Promise<void>(resolve=>{release=resolve;});this.pending.set(identity,current);
    await previous;
    try{return await operation();}finally{release();if(this.pending.get(identity)===current)this.pending.delete(identity);}
  }
}
