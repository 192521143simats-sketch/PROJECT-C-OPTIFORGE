import type {CapabilityProfile,ResourceSnapshot} from "@c-optiforge/contracts";

export type RequiredCapability="base"|"c"|"python"|"java";
export type TaskRequirements={capability:RequiredCapability;minLogicalCores?:number;minFreeMemoryBytes?:number};
export type SchedulableNode={id:string;status:"AVAILABLE"|string;profile:CapabilityProfile;resources:ResourceSnapshot|null};
export type CandidateEvaluation={nodeId:string;eligible:boolean;score:number|null;reasons:string[]};
export type SchedulingDecision={selectedNodeId:string|null;score:number|null;explanation:string;evaluations:CandidateEvaluation[]};

function supports(profile:CapabilityProfile,capability:RequiredCapability){return capability==="base"||profile.runtimes[capability];}

export function evaluateNode(node:SchedulableNode,requirements:TaskRequirements):CandidateEvaluation{
  const reasons:string[]=[];
  if(node.status!=="AVAILABLE")reasons.push(`status is ${node.status}`);
  if(!supports(node.profile,requirements.capability))reasons.push(`${requirements.capability} capability is unavailable`);
  if(node.profile.logicalCores<(requirements.minLogicalCores??1))reasons.push(`requires at least ${requirements.minLogicalCores} logical cores`);
  if(!node.resources)reasons.push("no current resource snapshot");
  else if(node.resources.freeMemoryBytes<(requirements.minFreeMemoryBytes??0))reasons.push(`requires at least ${requirements.minFreeMemoryBytes} free memory bytes`);
  if(reasons.length)return{nodeId:node.id,eligible:false,score:null,reasons};
  const cpuHeadroom=100-node.resources!.cpuUtilizationPercent;
  const memoryHeadroom=100-node.resources!.memoryUtilizationPercent;
  const coreCapacity=Math.min(node.profile.logicalCores,32)/32*100;
  const score=Number((cpuHeadroom*.5+memoryHeadroom*.35+coreCapacity*.15).toFixed(3));
  return{nodeId:node.id,eligible:true,score,reasons:[`CPU headroom ${cpuHeadroom.toFixed(1)}%`,`memory headroom ${memoryHeadroom.toFixed(1)}%`,`${node.profile.logicalCores} logical cores`,`${requirements.capability} capability satisfied`]};
}

export function selectNode(nodes:SchedulableNode[],requirements:TaskRequirements):SchedulingDecision{
  const evaluations=nodes.map(node=>evaluateNode(node,requirements));
  const eligible=evaluations.filter((item):item is CandidateEvaluation&{score:number}=>item.eligible&&item.score!==null).sort((a,b)=>b.score-a.score||a.nodeId.localeCompare(b.nodeId));
  const selected=eligible[0];
  if(!selected)return{selectedNodeId:null,score:null,explanation:`No eligible node satisfies ${requirements.capability} capability and resource requirements.`,evaluations};
  return{selectedNodeId:selected.nodeId,score:selected.score,explanation:`Selected ${selected.nodeId} with score ${selected.score}: ${selected.reasons.join("; ")}.`,evaluations};
}
