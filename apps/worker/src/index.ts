import WebSocket from "ws";
import { profile,resources } from "./profiler.js";
import { execute } from "./executor.js";
import {encodeProtocolMessage,parseCoordinatorMessage,type CoordinatorMessage} from "@c-optiforge/contracts";

function argument(name:string){const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:undefined;}
const coordinator=argument("--coordinator")??process.env.COORDINATOR_URL;
const credential=argument("--credential")??process.env.WORKER_CREDENTIAL;
if(!coordinator||!credential){console.error("Usage: grid-x-worker --coordinator http://host:4100 --credential <scoped-worker-credential>");process.exit(2);}

let nodeId:string|undefined;
let socket:WebSocket|undefined;
let heartbeat:NodeJS.Timeout|undefined;
let reconnectTimer:NodeJS.Timeout|undefined;
let busy=false;
let leaving=false;
const send=(value:object)=>{if(socket?.readyState===WebSocket.OPEN)socket.send(encodeProtocolMessage(value));};

function connect(){
  // Socket loss does not stop native execution. Do not advertise availability
  // on a new connection until the old executor has actually settled.
  if(busy){reconnectTimer=setTimeout(connect,250);return;}
  if(leaving)return;
  const url=new URL("/ws/worker",coordinator);url.protocol=url.protocol==="https:"?"wss:":"ws:";
  socket=new WebSocket(url,{headers:{Authorization:`Bearer ${credential}`}});
  socket.on("open",async()=>{
    console.log(`Connected to ${url.host}${nodeId?` as ${nodeId}`:"; registering scoped native worker..."}`);
    send({type:"register",profile:await profile()});
  });
  socket.on("message",async raw=>{
    let message:CoordinatorMessage;
    try{message=parseCoordinatorMessage(JSON.parse(raw.toString()));}catch{console.error("Coordinator message rejected: incompatible or invalid protocol.");socket?.close(1008,"Protocol incompatible");return;}
    if(message.type==="registered"){
      nodeId=message.nodeId;
      if(heartbeat)clearInterval(heartbeat);
      console.log(`Active as ${message.nodeId}`);send({type:"heartbeat",resources:resources()});
      heartbeat=setInterval(()=>send({type:"heartbeat",resources:resources()}),message.heartbeatIntervalMs);
    }else if(message.type==="task_assignment"){
      if(busy){send({type:"task_state",taskId:message.taskId,attempt:message.attempt,status:"FAILED",error:"Worker is already busy"});return;}
      busy=true;console.log(`Executing ${message.taskId} attempt ${message.attempt}`);send({type:"task_state",taskId:message.taskId,attempt:message.attempt,status:"RUNNING"});
      try{const completed=await execute(message.payload);send({type:"task_result",taskId:message.taskId,attempt:message.attempt,...completed,resources:resources()});console.log(`Completed ${message.taskId} in ${completed.executionTimeMs.toFixed(2)} ms`);}
      catch(error){const diagnostics=(error as {diagnostics?:Array<{severity:"error"|"warning";message:string;line?:number|null;column?:number|null}>})?.diagnostics;send({type:"task_state",taskId:message.taskId,attempt:message.attempt,status:"FAILED",error:(error instanceof Error?error.message:"Execution failed").slice(0,2000),...(Array.isArray(diagnostics)?{diagnostics:diagnostics.slice(0,100).map(item=>({severity:item.severity,message:item.message.slice(0,2000),line:item.line??null,column:item.column??null}))}:{})});}
      finally{busy=false;}
    }else if(message.type==="error")console.error(`${message.code}: ${message.message}`);
  });
  socket.on("close",(code,reason)=>{
    if(heartbeat){clearInterval(heartbeat);heartbeat=undefined;}
    console.log(`Disconnected (${code}) ${reason.toString()}`);
    if(leaving||code===1000||code===1008){process.exit(code===1008?2:0);return;}
    if(!leaving){console.log("Coordinator connection lost; reconnecting in 2 seconds...");reconnectTimer=setTimeout(connect,2_000);}
  });
  socket.on("error",error=>console.error("Worker connection error:",error.message));
}

connect();
for(const signal of ["SIGINT","SIGTERM"] as const)process.on(signal,()=>{leaving=true;if(reconnectTimer)clearTimeout(reconnectTimer);if(socket?.readyState===WebSocket.OPEN)send({type:"disconnect"});setTimeout(()=>process.exit(0),250).unref();});
