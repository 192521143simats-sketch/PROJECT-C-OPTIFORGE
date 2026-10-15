const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('gridx',Object.freeze({snapshot:()=>ipcRenderer.invoke('gridx:snapshot'),act:(type,value)=>ipcRenderer.invoke('gridx:action',{type,value}),onState:callback=>{const listener=(_event,state)=>callback(state);ipcRenderer.on('gridx:state',listener);return()=>ipcRenderer.removeListener('gridx:state',listener);}}));
