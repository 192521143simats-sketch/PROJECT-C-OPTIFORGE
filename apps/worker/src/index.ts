import WebSocket from "ws";
import { profile,resources } from "./profiler.js";
import { execute } from "./executor.js";
import type { CoordinatorMessage } from "@c-optiforge/contracts";

function argument(name:string){const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:undefined;}
const coordinator=argument("--coordinator")??process.env.COORDINATOR_URL;
const enrollment=argument("--enrollment")??process.env.ENROLLMENT_TOKEN;
if(!coordinator||!enrollment){console.error("Usage: npm run worker -- --coordinator http://host:4100 --enrollment <token>");process.exit(2);}

let workerToken:string|undefined;
let nodeId:string|undefined;
let socket:WebSocket|undefined;
let heartbeat:NodeJS.Timeout|undefined;
let reconnectTimer:NodeJS.Timeout|undefined;
let busy=false;
let leaving=false;
const send=(value:unknown)=>{if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(value));};

function connect(){
  const url=new URL("/ws/worker",coordinator);url.protocol=url.protocol==="https:"?"wss:":"ws:";
  url.searchParams.set(workerToken?"workerToken":"enrollment",workerToken??enrollment!);
  socket=new WebSocket(url);
  socket.on("open",async()=>{
    console.log(`${workerToken?"Reconnected":"Connected"} to ${url.host}${workerToken?` as ${nodeId}`:"; registering after explicit enrollment acceptance..."}`);
    if(!workerToken)send({type:"register",profile:await profile()});
  });
  socket.on("message",async raw=>{
    const message=JSON.parse(raw.toString()) as CoordinatorMessage;
    if(message.type==="registered"){
      nodeId=message.nodeId;workerToken=message.workerToken;
      if(heartbeat)clearInterval(heartbeat);
      console.log(`Active as ${message.nodeId}`);send({type:"heartbeat",resources:resources()});
      heartbeat=setInterval(()=>send({type:"heartbeat",resources:resources()}),message.heartbeatIntervalMs);
    }else if(message.type==="task_assignment"){
      if(busy){send({type:"task_state",taskId:message.taskId,attempt:message.attempt,status:"FAILED",error:"Worker is already busy"});return;}
      busy=true;console.log(`Executing ${message.taskId} attempt ${message.attempt}`);send({type:"task_state",taskId:message.taskId,attempt:message.attempt,status:"RUNNING"});
      try{const completed=await execute(message.payload);send({type:"task_result",taskId:message.taskId,attempt:message.attempt,...completed,resources:resources()});console.log(`Completed ${message.taskId} in ${completed.executionTimeMs.toFixed(2)} ms`);}
      catch(error){send({type:"task_state",taskId:message.taskId,attempt:message.attempt,status:"FAILED",error:error instanceof Error?error.message:"Execution failed"});}
      finally{busy=false;}
    }else if(message.type==="error")console.error(`${message.code}: ${message.message}`);
  });
  socket.on("close",(code,reason)=>{
    if(heartbeat){clearInterval(heartbeat);heartbeat=undefined;}
    console.log(`Disconnected (${code}) ${reason.toString()}`);
    if(leaving||code===1000){process.exit(0);return;}
    if(workerToken){console.log("Coordinator connection lost; reconnecting in 2 seconds...");reconnectTimer=setTimeout(connect,2_000);}
    else process.exit(1);
  });
  socket.on("error",error=>console.error("Worker connection error:",error.message));
}

connect();
for(const signal of ["SIGINT","SIGTERM"] as const)process.on(signal,()=>{leaving=true;if(reconnectTimer)clearTimeout(reconnectTimer);if(socket?.readyState===WebSocket.OPEN)send({type:"disconnect"});setTimeout(()=>process.exit(0),250).unref();});
