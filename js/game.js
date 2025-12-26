
import { Main, WinEvent} from './main.js';
import { LevelSelect, LevelSelectEvent } from './levelselect.js';
import { LevelEdit } from './leveledit.js';
import { AppendSvg } from './tile.js';
import { Modal } from "./modal.js";
import { COLORS } from './colors.js';
//import { OutputPanel } from './output.js';

export class Game{
    config = null
    main = new Main()
    current_level = 0
    modal = null
    level_select = null
    level_editor = null
    setups_divs = [...document.getElementsByClassName('setup')]
    game_state = ''    
    // Logo
    main_menu_container = document.getElementById('main-menu')
    logo = document.getElementById('logo')
    logo_interval = null
    
    constructor(){
        //this.output_panel = new OutputPanel()
        
        // Logo - remove image and replace to embed
        AppendSvg(this.main_menu_container, this.logo.src)
        this.logo.remove()

        // Play
        const btn_play = document.getElementById('play-btn')
        btn_play.addEventListener('click', ()=>{ this.GameState('play') })

        // Editor
        const btn_editor = document.getElementById('editor-btn')
        btn_editor.addEventListener('click', ()=>{ this.GameState('edit') })
        // Editor - back to menu
        const btn_editor_back = document.getElementById('edit-back')
        btn_editor_back.addEventListener('click', ()=>{
            this.modal.CreateButtonModal('confirm-modal','Are you sure you want to quit the editor?', [
                ()=>{
                    this.GameState('menu')
                }, ()=>{

                }])
        });

        /////////////////////////////////////////////////// Menu ///////////////////////////////
        // Level Select
        const btn_select = document.getElementById('select-btn')
        btn_select.addEventListener('click', ()=>{ this.GameState('level_select') })
            // Back btn prompt
            const btn_back = document.getElementById('back-btn')
            btn_back.addEventListener('click', ()=>{ 
                if (this.game_state=='test'){

                }
                this.level_select.OnBack()
                this.GameState('menu') 
            })
        // Help 
        const btn_help = document.getElementById('help-btn')
        btn_help.addEventListener('click', ()=>{ 
            this.modal.CreateButtonModal('help-modal','This is the text', [()=>{

            }])
        })
        // Game quit menu
        const btn_main = document.getElementById('game-menu-main')
        btn_main.addEventListener('click', ()=>{
            this.modal.CreateButtonModal('confirm-modal','Are you sure you want to quit the level?', [
                ()=>{
                    if (this.game_state=='test'){
                        this.GameState('edit')
                    }else{
                        this.GameState('back-main') 
                    }
                },
                ()=>{
                    
                }])            
        })

        //////////////////////////////// Init - fetch config //////////////////////////////////////
        this.modal = new Modal(document.getElementById('modal'))
        this.GameState('init')    
        this.main.FetchConfig()
            .then( _config => {
                this.main.board.addEventListener('winlevel', this.WinLevelHandler )
                this.config = {..._config}          
                this.GameState('menu')            
            })
        
    }// const

    ShowSetup = (classLookup) => {
        for ( let su of this.setups_divs ){        
            if (su.classList.contains(classLookup)){            
                su.classList.remove('hide')
            }else{
                su.classList.add('hide')
            }
        }
    }

    GameState = (state) =>{
        // Logo kill
        if (this.logo_interval) {
            window.clearInterval(this.logo_interval);
            this.logo_interval = null
        }
        switch(state){ 
            case 'init':
                this.ShowSetup('')
                //main.InitLevel(1)
            break;

            case 'back-main':
                this.main.PurgeLevel()
                this.current_level = 0
            case 'menu':
                this.ShowSetup('menu')             
                this.logo_interval = window.setInterval(()=>{
                    this.main_menu_container.style.setProperty('--logo-color', 
                        COLORS ? `${COLORS[Math.floor(Math.random()*(COLORS.length-1))]}` : 'grey')
                }, 3000)   
            break; 

            case 'level_select':            
                this.ShowSetup('select')
                if (!this.level_select){
                    this.level_select = new LevelSelect(this.config);
                    // When level selected
                    this.level_select.container.addEventListener('levelselect', e => {
                        this.current_level = this.level_select.clicked_level
                        this.GameState('play')
                    })
                } 
                this.level_select.BuildMenu()
            break;

            case 'edit':
                if (!this.level_editor){
                    this.level_editor = new LevelEdit(this, this.config)
                    this.level_editor.InitEditor()
                } 
                this.ShowSetup('edit')
            break; 

            case 'test':
                this.ShowSetup('game')
                this.main.InitLevel(null, this.level_editor.json)
            break; 

            case 'play':
                this.ShowSetup('game')
                this.main.InitLevel(this.current_level)
            break;
            
            default:
                console.error(`Game State not fouund: ${state}`)
            break;  
        }
        this.game_state = state
    }

    WinLevelHandler = e => {
        if ( this.current_level < this.config['levels'].length-1 ){
            this.current_level++            
            this.modal.CreateButtonModal('win-level-modal', null, [()=>{
                this.main.PurgeLevel()                
                if (this.game_state == 'test'){
                    // If we are testing, go back to editor
                    this.current_level = 0
                    this.GameState('edit')
                }
                this.main.InitLevel(this.current_level)         
                //modal.HideModal()     
            }])
        }else{
            this.modal.CreateButtonModal('win-game-modal','You won the game!', [()=>{
                this.main.PurgeLevel()
                this.GameState('menu')        
                //modal.HideModal()
                this.current_level = 0    
            }])
        }
    }

}// cls
const game = new Game()