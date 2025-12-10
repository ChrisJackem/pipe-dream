import { Panel } from "./panel.js"
import { CreateElement, CreateRow } from "./util.js"
import { LevelEdit } from "./leveledit.js"
import { EditTile, EditControl } from "./edit_tile.js"
import { EventMaster } from "./event_master.js"

const DIRT_BLOCK = "img/tiles/dirt_block.png"

export class CustomLevelControl{
    custom_level = null
    level_props = ['name', 'text', 'text_win']

    constructor(container){
        for (const prop of this.level_props) this[prop] = null
        this.event_master = new EventMaster()
        this.table = CreateElement('table', {'className':'selected-table'}, container)
        this.inputs = null
    }

    BindLevel = level => {
        // ** 2 way **
        this.custom_level = level
        this.custom_level.control = this

        for ( const prop of this.level_props ){
            if (!level.hasOwnProperty(prop)){
                console.error(`Level ${prop} is missing`)
                continue
            }else{
                for (const prop of this.level_props)
                    this[prop] = level[prop]
            }

            let input = CreateElement( 'input', 
                {'name':prop, 'className':'select_text', 'type':'text', 'value':level[prop]} )
            
            // Text Input
            this.event_master.AddEventListener(input, 'change', event => {
                const nme = event.currentTarget.name
                this[nme] = event.currentTarget.value
                this.custom_level[nme] = event.currentTarget.value
                this.custom_level.UpdateGridJson()
            })

            CreateRow(this.table, [document.createTextNode(prop), input])
        }
    }

    KYS = ()=>{
        //console.log('ack')
        this.event_master.PurgeListeners()
        this.table.innerHTML = ''
    }
}

export class CustomLevel{
    rows = 3
    cols = 3
    name = 'name'
    text = 'text'
    text_win = 'win'
    div = null
    control = null
    constructor(level_edit, level_data=null){
        if (!level_edit instanceof LevelEdit) console.error(`not levelEdit : ${level_edit}`)
        this.level_edit = level_edit
        this.event_master = level_edit.event_master
        this.custom_types = {}
        this.custom_types_count = {}
        this.grid = []
        this.tiles = []

        if (level_data){
            this.name = level_data['name']
            this.text = level_data['text']
            this.text_win = level_data['text_win']
            this.rows = level_data.tiles.length
            this.cols = level_data.tiles[0].length
            for (const [k,v] of Object.entries(level_data)){
                if (this.hasOwnProperty('k')) this[k]=v
            }
        }
        this.json = {
            "bg-img": DIRT_BLOCK,
            "custom":true
        } 
        if (level_data){
            const level_types = level_data['tile_types']
            this.custom_types = level_types ? level_types : {}
        }else{
            this.custom_types = {} 
        }
        
    }
    IsViable = ()=>  this.rows && this.cols && this.name && this.text && this.text_win

    AddCustomType = (name, data)=>{        
        this.custom_types[name] = data
        this.CountTypes()
    }
    CountTypes = ()=>{
        this.custom_types_count = {}
        for (const [type, _] of Object.entries(this.custom_types)){
            if (!this.custom_types_count[type]) this.custom_types_count[type] = 0
            this.custom_types_count[type]++ 
        }
    }
    RemoveCustomType = name =>{
        this.CountTypes()
        const count = this.custom_types_count[name]
        if (count <= 1){
            delete this.custom_types[name]
        }else{
            this.custom_types_count[name]--
        }
    }


    UpdateTextJson = (obj) => {
        for (const [k, v] of Object.entries(obj)){
            if (this.json.hasOwnProperty(k))
                this.json[k] = v
        }
    }

    UpdateGridJson = () =>{
        if (this.control){
            const overwrite_control = {
                'name': this.name,
                'text': this.text,
                'text_win': this.text_win
            }
            for (const [k,v] of Object.entries(overwrite_control)) this[k] = v
            this.json = {...this.json, ...overwrite_control}
        }
        // Tiles
        const [rows, cols] = [this.grid.length, this.grid[0].length]
        const new_tiles = []
        const tiles_names = new Set()
        
        for ( let r=0; r<rows; r++ ){
            new_tiles.push([])            
            for( let c=0; c<cols; c++ ){
                const tile = this.grid[r][c]
                new_tiles[r][c] = tile.data.label
                tiles_names.add(tile.data.label)
            }
        }
        this.json['tiles'] = new_tiles
        this.json['tile_types'] = {}
        // Types
        for ( const [name, obj] of Object.entries(this.custom_types) ){
            if (!tiles_names.has(name)) continue // if not added to tiles ^^ (clean up dead)
            const base_obj = obj['base']               
            const base_config = this.level_edit.config['tile-types'][base_obj] // base lookup  
            this.json['tile_types'][name] = {}           
            const ignore = new Set(['div', 'card_img_url', 'label', 'id'])
            for (const [key, val] of Object.entries(obj)){
                // Exclude 
                if (val == null || ignore.has(key)) continue
                const base_val = base_config ? base_config[key] : null
                if ( base_val != val ) 
                    this.json['tile_types'][name][key] = val
            }
        }
        return {...this.json}
    }

    CreateBoard = (container, data=null)=>{
        this.div = document.createElement('div')
        this.div.classList.add('editor-board')
        this.div.style.setProperty('--rows', `${this.rows}`);
        this.div.style.setProperty('--cols', `${this.cols}`);
        this.active_tile = null
        this.grid = []
        let id = 0
        for ( let r=0; r<this.rows; r++ ){
            this.grid.push([])
            for( let c=0; c<this.cols; c++ ){
                let tile = null
                if (data){
                    // The string in the grid
                    const tile_label = data.tiles[r][c]
                    // Any custom [tile_types] level props
                    let tile_custom = data.tile_types[tile_label] ? data.tile_types[tile_label] : {}
                    // Lookup in main config - either from base or grid string
                    let tile_config = 
                        Object.keys(tile_custom).length ? 
                        this.level_edit.config['tile-types'][tile_custom['base']] : // Custom
                        this.level_edit.config['tile-types'][tile_label]                         
                    // Compile with custom overwriting
                    const tile_data = { ...tile_config,...tile_custom }
                    tile = new EditTile( this.level_edit, tile_label, this.div, false, tile_data )
                }else{
                    tile = new EditTile( this.level_edit, 'BLK', this.div )
                }
                
                const control =  new EditControl(tile, this.level_edit.selected_panel.container )
                tile.div.classList.add('editor-board-tile')
                this.grid[r][c] = tile
            }
        }
        container.innerHTML = ''
        container.appendChild(this.div)
    }       
}//class