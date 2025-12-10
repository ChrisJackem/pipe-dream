import { EventMaster } from "./event_master.js"
import { AppendSvg } from './tile.js'

export const LevelSelectEvent = new CustomEvent("levelselect");

export class LevelSelect{
    constructor(config){
        this.config = config
        this.container = document.getElementById('level-select')
        this.event_master = new EventMaster()
        this.clicked_level = null // index in config.levels[]
        this.menu_items = []
    }
    OnBack = () =>{
        this.event_master.PurgeListeners()
        for (const div of this.menu_items){
            div.remove()
        }
        this.menu_items = []
    }
    BuildMenu = ()=>{
        this.container.innerHTML = ''

        for (const i in this.config['levels']){
            const level = this.config['levels'][i]
            const div = document.createElement('div')            
            
            div.classList.add('level-select-level')
            
            const fake_level = this.MakeLevel(level, this.config['tile-types'])
            const title_text = document.createElement('div')
            title_text.innerHTML = 
            `<h2>${level['name']}</h2>
            <p>${level['text']}</p>`

            div.appendChild(title_text)            
            div.appendChild(fake_level)
            this.container.appendChild(div)

            // Click 
            this.event_master.AddEventListener(div, 'click', e =>{
                this.clicked_level = i
                this.container.dispatchEvent(LevelSelectEvent)
            })
            this.menu_items.push(div)
        }
    }
    MakeLevel = (level, tipes) =>{
        const tiles = level['tiles']
        const bg_img = level['bg-img']
         // Fake board container
        const container = document.createElement('div')
        container.style.backgroundImage = `url(${bg_img})`
        container.classList.add('fake-level')
        container.style.setProperty('--rows', `${tiles.length}`);
        container.style.setProperty('--cols', `${tiles[0].length}`)        

        for ( let r=0; r<tiles.length; r++ ){
            for( let c=0; c<tiles[0].length; c++ ){
                const tile = tiles[r][c]
                const tile_div = document.createElement('div')
                tile_div.classList.add('fake-tile')
               
                let tile_type = tipes[tile]
                if (!tile_type){
                    const level_type = level['tile_types'][tile]
                    const base_type = tipes[level_type['base']]
                    tile_type = {...base_type, ...level_type}
                }
                
                // BG image
                const tile_img = tile_type['card_img']
                if (tile_img){
                    const tile_img_url = `img/${tile_img}/${tile_img}.svg`
                    const tile_img_flow_url = `img/${tile_img}/${tile_img}_flow.svg`

                    tile_div.style.setProperty('background-image', `url(${tile_img_url})`)
                    
                    // Decals                    
                    if (tile_type['badge']){
                        AppendSvg(tile_div, `${tile_type['badge']}`)
                        tile_div.style.setProperty('--flow-color', `${tile_type['badge_color']}`)
                    }

                    // Tap flow
                    if (tile_type['source']){
                        AppendSvg(tile_div, `${tile_img_flow_url}`)                        
                        tile_div.style.setProperty('--flow-color', tile_type['source'] )
                    }
                }

                // Rotation
                const tile_i_rotate = tile_type['i_rotate']
                if (tile_i_rotate){
                    tile_div.style.setProperty('transform', `rotate(${90 * tile_i_rotate}deg)`)
                }

                tile_div.innerHTML = ``
                container.appendChild(tile_div)
            }
        }
        return container
    }
}