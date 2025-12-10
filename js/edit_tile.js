import { EventMaster } from "./event_master.js"
import { AppendSvg } from "./tile.js"
import { COLORS } from "./colors.js"
import { CreateRow, CreateElement } from "./util.js"
import { CustomLevel } from "./custom_level.js"

const BLANK_TILE = {'label': 'BLK', 'name': 'Blank Tile', 'blank': true}
var selected_tile = null
var selected_control = null

/////////////////////////////////////////////////////////////////////////////////////////////////// EditControl
export class EditControl{
    constructor(edit_tile, container){
        this.event_master = new EventMaster()        
        this.tile = edit_tile
        edit_tile.control = this
        this.container = container
        this.div = CreateElement('div', {'className':'hide', 'style':'width:100%;'}, container )        
        this.UpdateControls()
        this.selected_color = null
        this.controls = {}        
    }

    get loaded_level(){ return this.tile.level_edit.loaded_level }

    //-------------------------------------- Color Picker
    CreateOption = (par, col, data) => {
        const op = CreateElement('option', {
            'className': 'editor-option',
            'value': col,
            'className': 'editor-option',
            'innerHTML': col,
            ...data
        }, par)
        op.style.backgroundColor = col
        return op
    }
    BuildColorPicker = () =>{
        const DATA = this.tile.data
        const sel = CreateElement('select')
        let option = this.CreateOption(sel, 'None', {'selected': this.selected_color==null} )
        for ( const col of COLORS ){
            option = this.CreateOption(sel, col, { 'selected' : this.selected_color && col==this.selected_color} )
        }
        this.event_master.AddEventListener( sel, 'change', event =>{
            const val = event.currentTarget.value
            this.selected_color = val
            sel.style.backgroundColor = val

            // Tile
            let obj = {}
            if (DATA['badge_color']) obj['badge_color'] = val
            if (DATA['goal']) obj['goal'] = val
            if (DATA['source']) obj['source'] = val
            if (DATA['goal']) obj['goal'] = val

            this.tile.unique = true
            this.tile.UpdateData(obj)
            if (this.tile.control){
                this.tile.control.UpdateControls()
            }
            this.loaded_level.UpdateGridJson()
        })
        return sel
    }

    //////////////////////////////////////////////////////////// GUI ////////////////////////////////////////////

    // Update controls[name].value to have the value as tile[name]
    UpdateControlValue = (name) =>{
        if (!this.controls[name]) return // ? this is needed
        const node = this.controls[name][1]
        node.value = this.tile.data[name]
    }
    UpdateControls = () => {
        const DATA = this.tile.data
        this.event_master.PurgeListeners()
        this.controls = {}
        this.div.innerHTML = ''//JSON.stringify(this.tile.data)
        let color = null
        const excludes = new Set(['div', 'source', 'badge_color', 'goal', 'id', 'blank', 'base', 'card_img', 'card_img_url'])// not shown 
        const no_edit = new Set(['i_rotate'])       
        const includes = new Set(['tile_img'])// explicitly editable        
        const tbl = CreateElement('table', {'className':'selected-table'}, this.div )

        //-------------------------------- Table Cells -----------------------------------
        for ( let [key, val] of Object.entries(DATA) ){
            if (key=='badge_color' || key=='goal' || key=='source' || key=='goal'){ if (val) color = val }
            if ( excludes.has(key) ||  (val == null && !includes.has(key)) ) continue            
            
            // Default text input
            let input = CreateElement( 'input',
                {'name':key, 'className':'select_text', 'type':'text', 'value':val} )
            
            // Special i_rotate values
            if ( key == 'i_rotate') input.value = `${(val == 4 ? 0 : val) * 90}°`

            // Non editable fields
            if ( Array.isArray(val) || no_edit.has(key) ){               
                input.disabled = true
            
            // Checkboxes
            }else if(typeof val === 'boolean'){
                input.type = 'checkbox'
                input.checked = val

                // Checkbox clicks
                this.event_master.AddEventListener( input, 'change', event => {
                    const nme = event.currentTarget.name
                    this.tile.UpdateData({key:event.currentTarget.checked})
                    
                    this.tile.unique = true
                    this.UpdateControlValue('label')
                    console.log(this.tile.data)

                    this.loaded_level.UpdateGridJson()
                })

            }else{
                // Text input
                this.event_master.AddEventListener( input, 'focusout', event => {
                    this.tile.unique = true
                    const value = event.currentTarget.value

                    // When we update the label we need to change CustomLevel data and the tile
                    if (key == 'label'){
                        const current_label = this.tile.data['label']
                        const base = this.tile.data['base'] ? this.tile.data['base'] : this.tile.data.label                        
                        // Update level
                        this.loaded_level.RemoveCustomType(current_label)
                        this.loaded_level.AddCustomType( value, this.tile.data )
                        // update tile
                        this.tile.UpdateData({ 'label' : value, 'base': base })                    
                    
                    }else{
                        // Normal text change, Its weird bc need to cast key as string
                        const obj = {} ; obj[key] = value
                        this.tile.UpdateData(obj)
                    }
                    if (this.tile.control) this.tile.control.UpdateControls()
                    this.loaded_level.UpdateGridJson()
                })
            }
            // Save to Controls
            const txt = document.createTextNode(key)
            this.controls[key] = [txt, input]            
            // Adding input to table
            CreateRow(tbl, [txt, input])            
        }

        // Color
        if (color){
            this.selected_color = color
            const picker = this.BuildColorPicker()
            picker.style.backgroundColor = color
            const txt = document.createTextNode('Color')
            this.controls['color'] = [txt, picker]
            CreateRow(tbl, [txt, picker])
        }

        //----------------------------- Buttons -------------------------------
        const btn_container = CreateElement('div', {'className':'edit-btn-container'}, this.div)        
        
        // Rotate Button
        const btn_rotate = CreateElement('button', {'innerHTML':`Rotate`}, btn_container )
        this.event_master.AddEventListener( btn_rotate, 'click', event => {
            let rot = DATA['i_rotate']            
            rot = rot < 4 ? rot + 1 : 1
            this.tile.UpdateData({'i_rotate': rot}, true)
            
            // Rotate actual io values
            let cpy = [...DATA['io']]
            cpy.unshift(cpy.pop())
            this.tile.UpdateData({'io': cpy})
            this.UpdateControlValue('io')

            // Update incase we made new i_rotate property
            this.tile.unique = true
            if (this.tile.control) {
                this.UpdateControls()
            }
            this.loaded_level.UpdateGridJson()
        })

        // Delete Button
        const btn_delete = CreateElement('button', {'innerHTML':`Delete`}, btn_container )
        this.event_master.AddEventListener( btn_delete, 'click', event => {
            this.tile.ClearTile()
            this.loaded_level.RemoveCustomType(this.tile.data['label'])
            this.loaded_level.UpdateGridJson()
        })
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////// EditTile
export class EditTile{
    constructor(level_edit, label, container, drag_only=false, data=null){
        this.level_edit = level_edit        
        this._unique = false // change when any value changes
        this.control = null
        this.event_master = new EventMaster()
        this.container = container
        this.data = data ? data : {}
        if (!data) data = {...BLANK_TILE}
        data.label = label       
        
        // DOM
        this.div = CreateElement( 'div', {'className':'edit-panel-block editor-vars', 'draggable': true}, container )
        this.UpdateData({...data})

        //-------------------------------- Events -----------------------------------
        this.event_master.AddEventListener(this.div, 'dragstart', event =>{
            event.dataTransfer.setData( 'text/plain', JSON.stringify(this.data) )
        })

        this.event_master.AddEventListener(this.div, 'click', event =>{
            // Old
            if (selected_tile){
                selected_tile.div.classList.remove('active')                
            }            
            if (selected_control){
                selected_control.div.classList.remove('active')
                selected_control.div.classList.add('hide')
            }
            // New
            selected_tile = this
            this.div.classList.add('active')            
            selected_control = this.control ? this.control : null
            if ( this.control ){
                //selected_control.div.classList.add('active')                
                this.control.div.classList.remove('hide')                
            }
        })

        if ( !drag_only ){
            this.event_master.AddEventListener( this.div, 'dragover', event => event.preventDefault() )
            this.event_master.AddEventListener(this.div, 'drop', event =>{
                event.preventDefault()                            
                const dropped_data = JSON.parse(event.dataTransfer.getData('text/plain'))
                this.data =  {}
                this.UpdateData(dropped_data)
                // Get base from dropped and store for later when we change something
                if (dropped_data['base']) {
                    this.data['base'] = dropped_data['base']
                }
                this.div.click()
                if (this.control) this.control.UpdateControls()
                this.loaded_level.UpdateGridJson()
            })
        }
    }
    //---------- Gettters Setters ---------------------------
    get loaded_level(){ return this.level_edit.loaded_level }
    get unique() { return this._unique }
    set unique(val){
        if ( val && !this._unique){
            this._unique = true
            let new_label = Math.random().toString(36).slice(2, 5)        
            this.UpdateData({
                'base': this.data['base'] ? this.data['base'] : this.data.label,
                'label': new_label
            })
            if (this.control) this.control.UpdateControls()            
            // Add myself to CustomLevel prop
            this.loaded_level.AddCustomType(this.data.label, this.data)
        }
    }

    //-------------------- Methods --------------------------
    UpdateData = (obj, skip_css=false)=>{ 
        for ( const [k, v] of Object.entries(obj) ){            
            this.data[k] = v
        }
        this.div.innerHTML = ''     
        if (!skip_css) this.UpdateCSS()
        //if (this.control) this.control.UpdateControls()
    }

    ClearTile = ()=>{
        this.data = {}
        this.UpdateData(BLANK_TILE)
        if (this.control) this.control.UpdateControls()
    }

    UpdateCSS = ()=>{
        this.div.innerHTML = ''
        let div_inline_style = ''        
        if (this.data['card_img']) {
            const card_url = `url(../img/${this.data['card_img']}/${this.data['card_img']}.svg)`
            div_inline_style += this.data['tile_img'] ? `--bg-img: ${card_url}, url(${this.data['tile_img']});` : `--bg-img: ${card_url};`
        }
        if (this.data['source']){
            const flow_url = `img/${this.data['card_img']}/${this.data['card_img']}_flow.svg`
            AppendSvg(this.div, flow_url)
            div_inline_style += `--flow-color: ${this.data['source']}; `
        }
        if (this.data['badge']){
            AppendSvg(this.div, this.data['badge'])
            div_inline_style += `--badge-color: ${this.data['badge_color']};`
        }
        if (this.data['i_rotate']) div_inline_style += `--rotation: ${this.data['i_rotate']*90}deg;`
        this.div.style = div_inline_style
    }
}