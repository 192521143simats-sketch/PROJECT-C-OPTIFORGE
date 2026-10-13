import React,{useEffect} from "react";

export function Pagination({page,totalPages,onChange}:{page:number;totalPages:number;onChange:(page:number)=>void}){
  const last=Math.max(1,Number.isFinite(totalPages)?Math.floor(totalPages):1);
  const current=Math.min(last,Math.max(1,Number.isFinite(page)?Math.floor(page):1));
  useEffect(()=>{if(page!==current)onChange(current);},[page,current,onChange]);
  const pages=last<=7?Array.from({length:last},(_,index)=>index+1):
    [...new Set([1,last,...Array.from({length:5},(_,index)=>current-2+index).filter(value=>value>=1&&value<=last)])].sort((a,b)=>a-b);
  return <nav className="pagination" aria-label="Pagination">
    <button type="button" className="secondary" disabled={current<=1} onClick={()=>onChange(current-1)}>Previous</button>
    {pages.map((value,index)=><React.Fragment key={value}>
      {index>0&&value>pages[index-1]!+1&&<span aria-hidden="true">…</span>}
      <button type="button" className={value===current?"active":"secondary"} aria-label={`Go to page ${value}`} aria-current={value===current?"page":undefined} onClick={()=>onChange(value)}>{value}</button>
    </React.Fragment>)}
    <button type="button" className="secondary" disabled={current>=last} onClick={()=>onChange(current+1)}>Next</button>
  </nav>;
}
