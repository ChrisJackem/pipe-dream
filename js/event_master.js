export class EventMaster{
    constructor(){
        this.events = []
    }
    AddEventListener = (div, event, fun) =>{
        //console.log(div,event)
        this.events.push({ div: div, event: event, fun: fun })
        div.addEventListener(event, fun)
    }
    PurgeListeners = () =>{
        for (let E of this.events ){
            E.div.removeEventListener(E.event, E.fun)
        }
        this.events = []
    }
    SuspendListeners = (suspend) =>{        
        for (let E of this.events ){
            if (suspend){            
                E.div.removeEventListener(E.event, E.fun)
            }else{
                E.div.addEventListener(E.event, E.fun)
            }
        }                    
    }
}