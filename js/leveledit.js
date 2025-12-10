import { EventMaster } from "./event_master.js"
import { Modal } from "./modal.js"
import { AppendSvg } from "./tile.js"
import { COLORS } from "./colors.js"
import { EditControl, EditTile } from "./edit_tile.js"
import { CreateRow, CreateElement, ParseJSON } from "./util.js"
import { CustomLevel, CustomLevelControl } from "./custom_level.js"
import { Panel } from "./panel.js"


export class LevelEdit{
    constructor(game, config){
        this.game = game
        this.config = {}
        this.json = {}
        this.working_config = {}
        Object.assign(this.config, config)
        Object.assign(this.working_config, config)
        this.event_master = new EventMaster()
        this.panels = {}
        this.loaded_level = null
        this.new_level = null
        this.custom_level_control = null
        this.custom_level_control_panel = null
        this.editor_container = document.getElementById('level-editor')
        this.editor_grid = document.getElementById('editor-grid')
        this.editor_side = document.getElementById('editor-side')
        this.button_load = document.getElementById('edit-load')
        this.button_new = document.getElementById('edit-new')
        this.button_test = document.getElementById('edit-test')
        this.button_save = document.getElementById('edit-save')
        this.modal_load_id = 'load-level-modal'
        this.modal_new_id = 'new-level-modal'
        this.modal_new_div = document.getElementById(this.modal_new_id)
        this.modal = new Modal(document.getElementById('modal'))
        this.modal_content = document.getElementById('modal-content')
        //this.confirm_modal = new Modal(document.getElementById('inform-modal'))
        this.selected_panel = new Panel(this.editor_side, 'Selected')
    }

    CreateBoard = (level, data=null) => {
        if (level instanceof CustomLevel ){
            //console.log('init level: ', level)
        }else{
            console.error('level broke :', level)
            return
        }
        // Grid
        level.CreateBoard(this.editor_grid, data)
        this.loaded_level = level
        level.UpdateGridJson()
        this.button_test.disabled = false
        this.button_save.disabled = false

        // Control
        if (this.custom_level_control) this.custom_level_control.KYS()
        this.custom_level_control = new CustomLevelControl(this.custom_level_control_panel.container)
        this.custom_level_control.BindLevel(level)
    }

    InitEditor = () =>{
        this.editor_grid.innerHTML = `
            <div>
                <h2>Please load or create a new level</h2>
            </div>
        `
        ///////////////////////////////////////////////////////////////////////////////// Load
        const level_list_container = document.getElementById('load-level-content')
        const load_modal_funcs = []
        for (const lvl in this.config['levels']){
            const level = this.config['levels'][lvl]
            const name = level['name']            
            level_list_container.innerHTML += `<button id=${name} class='level-btns'>${name}</button>`
            // click func
            load_modal_funcs.push(()=>{                
                this.new_level = new CustomLevel(this, level)
                this.CreateBoard(this.new_level, level)
                
                this.button_test.disabled = false
            })
        }
        // Cancel button is last !
        load_modal_funcs.push(()=>{
            //console.log('cancel')
        })        
        // Load button consumes load_modal_funcs
        this.event_master.AddEventListener(this.button_load, 'click', ()=>{            
            this.modal.CreateButtonModal(this.modal_load_id, 'Choose level to load', load_modal_funcs)
        })

        ///////////////////////////////////////////////////////////////////////////////// New
        // New Modal
        this.new_level = new CustomLevel(this)

        const new_inputs = [
            ...this.modal_new_div.querySelectorAll('.input-container'),
            ...this.modal_new_div.querySelectorAll('.input-container-range')
        ]

        // Submit - New Level button
        const new_level_btn = document.getElementById('new-level-button')// Should be disabled !
        this.event_master.AddEventListener(new_level_btn, 'click', ()=>{
            this.modal.HideModal()
            this.CreateBoard(this.new_level)
        })
        const new_level_cancel_btn = document.getElementById('new-level-cancel')
        this.event_master.AddEventListener(new_level_cancel_btn, 'click', ()=>{
            this.modal.HideModal()            
        })
        
        // The inputs connect right to attributes of CustomLevel
        // via data-prop in the html
        // * input events
        for ( const input_container of new_inputs ){
            const label = input_container.querySelector('label')
            const input = input_container.querySelector('.input-input')             
            const prop = input.dataset.prop            
            if (prop && input && this.new_level && this.new_level.hasOwnProperty(prop)){
                // Text Input
                this.event_master.AddEventListener(input, 'input', e =>{
                    const val = e.currentTarget.value
                    this.new_level[prop] = val
                    //this.new_level.control[prop] = val                
                    if (input.type == 'range') label.innerHTML = input.value// Range sliders
                    new_level_btn.disabled = false
                })
            }
        }
        // New button
        this.event_master.AddEventListener(this.button_new, 'click', ()=>{
            this.modal.CreateButtonModal(this.modal_new_id, 'HELL YEAH', null)
        })

        // Test
        this.event_master.AddEventListener(this.button_test, 'click', ()=>{
            this.json = this.loaded_level.UpdateGridJson()
            //console.log(JSON.stringify(this.json, null, 2))
            console.log(ParseJSON(this.json).join(''))
            this.game.GameState('test')
            this.button_save.disabled = false
        })

        // Save
        // Save test level to main game levels        
        this.event_master.AddEventListener(this.button_save, 'click', ()=>{
            const old_levels = this.game.config.levels.filter( l => !l['custom'])
            const config = {
                ...this.game.config,
                ...{'levels':[
                    this.new_level.json,
                    ...old_levels
                ]}
            }
            // set both !!
            this.game.main.config = config
            this.game.config = config
            this.button_save.disabled = true

            this.modal.CreateButtonModal('inform-modal', 'Level saved to main configuration.<br/>Access through the main menu.', [()=>{console.log('OK')}])  
        })

        /////////////////////////////// Side Panel ////////////////////////////////////

        //----------------- Block Types --------------------------
        const block_types = this.config['tile-types']
        const block_panel = new Panel(this.editor_side, 'Block_Types')

        // Adding tile toolbar
        // This will add all top-level blocks (not level blocks)
        for ( const [key, value] of Object.entries(block_types) ){
            if ( key == 'BLK' ) continue; // skip blanks
            const block = new EditTile(this, key, block_panel.container, true, value)
        }
        
        // Level text panel gets filled at CreateBoard
        this.custom_level_control_panel = new Panel(this.editor_side, 'Level_Text', true)
    }

}// class
