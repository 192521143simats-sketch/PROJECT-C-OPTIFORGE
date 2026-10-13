import React from "react";

export function Notice({error,message}:{error?:string;message?:string}){
  return <>{error&&<div className="error" role="alert">{error}</div>}{message&&<div className="notice" role="status">{message}</div>}</>;
}
