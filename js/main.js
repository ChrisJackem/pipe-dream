import { AppendSvg, UpdateEvent, Tile, Card, N, S, E, W } from "./tile.js";
import { EventMaster } from "./event_master.js";

const GUI_TANK_ICON = 'img/GUI/tank_icon_flow.svg'
const GUI_TANK_ICON_BADGE = 'img/GUI/tank_icon_badge.svg'

export const WinEvent = new CustomEvent("winlevel");
const flow_swatches = document.getElementById('flow-swatches')

// Keeps track of flows
// and the icons in the sidebar
class FlowPath{
    source = null
    goals = []
    tank_icons = []
    constructor(name){
        this.name = name
    }
    /** The tanks in the GUI
        bg is set in css. These are the flows and badges */
    AddTank = (card) => {
        this.goals.push(card)
        const tank_div = document.createElement('div')
        tank_div.classList.add('tank-swatch')
        tank_div.style.setProperty('--badge-color', `${this.name}`)
        tank_div.style.setProperty('--flow-color', `${this.name}`)
        AppendSvg(tank_div, GUI_TANK_ICON)
        AppendSvg(tank_div, GUI_TANK_ICON_BADGE)
        flow_swatches.appendChild(tank_div)
        this.tank_icons.push(tank_div)
    }
    UpdateTankIcons = n => {
        for (const i in this.tank_icons){
            if (i < n) {
                this.tank_icons[i].classList.add('filled')
            }else{
                this.tank_icons[i].classList.remove('filled')
            }
        }
    }
}

export class Main{
    constructor(){
        this.board = document.getElementById('board-content')
        this.flow_swatches = document.getElementById('flow-swatches')
        this.tile_info = document.getElementById('tile-info')
        this.level_title = document.getElementById('level-title')
        this.level_text = document.getElementById('level-text')
        this.level_win_text = document.getElementById('complete-text')     
        this.config = {}
        this.tiles = []
        this.cards = []
        this.flows = {}
        this.goals = []
        this.event_master = new EventMaster()        
    }
    
    FetchConfig = () => {
        return new Promise((res, rej) =>{
            fetch('config.json')
            .then(response => response.json())
            .then(data => {
                this.config = data
                res(data)         
            })
            .catch( err => rej(err) );
        })
    }

    InitLevel = (level_index, level=null) =>{
        const lvl = level ? level : this.config.levels[level_index]
        // DOM elements
        this.level_title.innerHTML = lvl['name']
        this.level_text.innerHTML = lvl['text']
        this.flow_swatches.innerHTML = ''
        this.tile_info.innerHTML = ''
        
        //this.board.style.setProperty('--level-bg-img', `url(${lvl['bg-img']})`)// old way FIX THIS in original!
        this.board.style.setProperty('background-image', `url(${lvl['bg-img']})`)
        
        this.board.style.setProperty('--rows', lvl.tiles.length)
        this.board.style.setProperty('--cols', lvl.tiles[0].length)
        this.board.innerHTML = ''
        const tw = lvl['text_win']
        this.level_win_text.innerHTML = tw ? tw : 'You can now proceed.'
        
        this.BuildLevel(lvl)
    }
    PurgeLevel = () =>{
        this.event_master.PurgeListeners()
        for ( let r=0; r<this.tiles.length; r++ ){
            for( let c=0; c<this.tiles[0].length; c++ ){
                const tile = this.tiles[r][c]
                tile.div.remove()
            }
        }
        this.tiles = []
        this.cards = []
        this.flows = {}
        this.goals = []
        this.board.innerHTML = ''
    }

    LevelUpdate = (e) =>{
        for (let card of this.cards){
            card.powered = false
        }        
        // Win Level        
        let all_flows_complete = true

        for ( let [key, flow_path] of Object.entries(this.flows) ){            
            const flow_source = flow_path['source']
            const flow_goals = flow_path['goals']            
            const flowed = this.Flow(flow_source, key)
            let flow_complete = true
            let full_tanks = 0
            // Check if Flow() returned a tank from this color
            for (const tank of flow_goals){
                if (flowed.has(tank)){
                    full_tanks++
                    //break
                }else{
                    // Show tank in GUI
                }
            }
            flow_path.UpdateTankIcons(full_tanks)
            if ( full_tanks < flow_goals.length) all_flows_complete = false            
        }
        // Win Level
        if (all_flows_complete){            
            this.event_master.PurgeListeners()
            this.board.dispatchEvent(WinEvent)
        }
    }
    
    Flow = (source, color) =>{
        let process = [source]
        let processed = new Set()  
        while ( process.length ){
            let tile = process.shift()
            if  (!tile) continue;
            processed.add(tile)
            //tile.powered = true
            if(tile.card) tile.card.SendPower(color)
    
            let NT = tile.adjacent[N]?.card ? tile.adjacent[N] : null
            let ST = tile.adjacent[S]?.card ? tile.adjacent[S] : null
            let ET = tile.adjacent[E]?.card ? tile.adjacent[E] : null
            let WT = tile.adjacent[W]?.card ? tile.adjacent[W] : null
    
            // If corresponding card's (io[i] == 1)
            if (tile.card.io[N] && NT && NT.card.io[S] && !processed.has(NT)) process.push(NT)
            if (tile.card.io[S] && ST && ST.card.io[N] && !processed.has(ST)) process.push(ST)
            if (tile.card.io[E] && ET && ET.card.io[W] && !processed.has(ET)) process.push(ET)
            if (tile.card.io[W] && WT && WT.card.io[E] && !processed.has(WT)) process.push(WT)
        }
        //console.log(Array.from(processed))
        return processed
    }
    BuildLevel = level_data => {
        //this.title.innerHTML = level_data.name
        
        this.tiles = [] ; this.cards = [] ; this.flows = {} ;
        let id_tile = 0 ; let id_card = 0
    
        // Build tiles        
        const tile_types = this.config['tile-types']
        for ( let r=0; r<level_data.tiles.length; r++ ){
            this.tiles.push([])
            for( let c=0; c<level_data.tiles[0].length; c++ ){
    
                // Init tile
                const tile_div = document.createElement("div");
                tile_div.classList.add('tile', 'bg')
                this.board.appendChild(tile_div)
    
                // Make sure it exists in the 'file-types' obj in the json
                const tile_string = level_data.tiles[r][c]
                let card_type = tile_types[tile_string]

                // Check level types if not found
                // set tile_types object in level obj
                // needs 'base' type in main tile-types
                // will overwrite the new data
                if (!card_type){
                    const t = level_data['tile_types']
                    if ( t && t[tile_string] ){                        
                        const _type = t[tile_string]                        
                        if (_type['base']){
                            card_type = {...this.config['tile-types'][_type['base']]}                            
                            for ( const [k, v] of Object.entries(_type) ){
                                if (k == 'base') continue
                                card_type[k] = v
                            }
                        }
                    }
                }

                if ( !tile_string || !card_type ){
                    console.error(`tile_string broken - (${tile_string}) - r:${r}, c:${c}`);            
                }else{
                    // New Tile 
                    const tile = new Tile( id_tile++, [r, c], tile_div, card_type )                    
                    this.tiles[r][c] = tile
                    // Blank tiles have no card **
                    if( card_type['blank'] ){
    
                    }else{ // New Card
                        const card_div = document.createElement("div");
                        card_div.draggable = card_type['moveable']
                        card_div.classList.add('card', 'bg')
                        tile_div.appendChild(card_div)
                        const card = new Card( id_card++, card_div, tile, card_type )
                        tile.card = card
                        this.cards.push(card)
                        
                        // Badge
                        if (card_type['badge'] ){
                            let badge_color = card_type['source'] || card_type['goal'] || 'black';
                            card_div.innerHTML += `<div class='badge-image' style="fill:${this.badge_color};"></div>`;
                        }  
    
                        // Card Events
                        if ( !card_type.hasOwnProperty('rotatable') || card_type['rotatable']){// No rotatable prop or set to false
                            this.event_master.AddEventListener(card_div, 'click', ()=>{ card.Click() })
                        }

                        // Tile info
                        this.event_master.AddEventListener(card_div, 'mouseover', e => {
                            this.tile_info.innerHTML = `Object: ${card.name}`
                        })
    
                        if ( !card_type['blank'] && card_type['moveable']){ 
                            // Drag
                            this.event_master.AddEventListener(card_div, 'dragstart', e => {            
                                e.dataTransfer.setData("text/plain", `${card.id}`)
                                e.dataTransfer.dropEffect = "move"                                      
                                e.target.classList.add('dragged')
                            })
                            this.event_master.AddEventListener(card_div, "dragend", e => {
                                e.target.classList.remove('dragged')    
                            })
                        }else{
                            // Init paths
                            // We use a FlowPath obj to store source and goal tiles
                            // this.flows holds all of them
                            if (card_type['source']){                                
                                const source_name = card_type['source'];
                                if ( !(source_name in this.flows) ){                                    
                                    this.flows[source_name] = new FlowPath(source_name) 
                                }
                                this.flows[source_name].source = tile
                            }else if (card_type['goal']){
                                const goal_name = card_type['goal'];
                                if ( !(goal_name in this.flows) ){                                    
                                    this.flows[goal_name] = new FlowPath(goal_name)                                    
                                }
                                this.flows[goal_name].AddTank(tile)
                            }
                            card_div.classList.add('static')
                        }
                        this.event_master.AddEventListener(card_div,'tileupdate', this.LevelUpdate )                    
                    }// end card               
    
                    // Tile Events
                    this.event_master.AddEventListener(tile_div, "dragover", e => {
                        if (!tile.card || tile.card.moveable){
                            e.preventDefault(); 
                        }
                    });                
    
                    this.event_master.AddEventListener(tile_div, 'drop', e => {
                        e.preventDefault();
                        const d = e.dataTransfer.getData("text/plain")    
                        const dragged = this.cards[d]
                        const dropped = tile.card
                        if (dragged == dropped || !dragged) return;
                        if (dropped){// ! empty slots
                            dragged.tile.div.appendChild(dropped.div)
                            dropped.tile = dragged.tile
                        }                        
                        tile.div.appendChild(dragged.div)
                        tile.card = dragged
                        dragged.tile.card = dropped   
                        dragged.tile = tile
                        tile.card.Changed()                        
                    });                             
                }            
            }            
        }
        // After creating all tiles find adjacent
        for ( let r=0; r<this.tiles.length; r++ ){
            for( let c=0; c<this.tiles[0].length; c++ ){
                const tile = this.tiles[r][c]
                tile.GetAdjacent(this.tiles)
            }
        }
        this.LevelUpdate()
    }
}//