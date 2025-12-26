export const N = 0 ; export const E = 1 ; export const S = 2 ; export const W = 3 ;
const FLOW_OFF = `none`

var timeout = null

// Call this to emit the UpdateEvent
export const UpdateTimerInit = (init_div) => {
    if (timeout) window.clearTimeout(timeout);
    timeout = window.setTimeout(()=>{init_div.dispatchEvent(UpdateEvent)}, 500)
}
export const UpdateEvent = new CustomEvent("tileupdate");

export const AppendSvg = (div, url) =>{
    fetch(url)
        .then(response => response.text())
        .then(svg => div.insertAdjacentHTML("beforeend", svg) )
        .catch( err => console.error(`AppendSvg() broke at ${url} : ${err}`) )
}

export class Card{
    constructor(id, div, tile, data){
        this.id = id
        this.div = div

        Object.assign(this, data)        
        this.rotation = data['i_rotate'] ? data['i_rotate'] : 0
        this.tile = tile
        this.flow_color = null
        this.powered = data['source'] ? data['source'] : false
        this.badge = data['badge'] ? data['badge'] : null
        
        
        if ( this.card_img ) {
            // Card image structure:
            // /img/name/
            //  - name.svg
            //  - name_flow.svg
            const file_card_img = `img/${this.card_img}/${this.card_img}.svg`
            const flow_image = `img/${this.card_img}/${this.card_img}_flow.svg`
            
            //this.div.style.setProperty('--bg-url', `url(${file_card_img})`);
            this.div.style.setProperty('--bg-url', `url(../${file_card_img})`);
            
            // Flow Image fetches svg data into the div
            // * set the class in the .svg ! (class="card-image")
            if (flow_image){
                AppendSvg(div, flow_image)
            }

            // Badge 
            if (this.badge){
                if (this.badge_color) this.div.style.setProperty('--badge-color', this.badge_color)
                AppendSvg(div, this.badge)
            }
            this.UpdateCss()
        }        
    }
    
    // Watch the loop
    Changed = () => {        
        UpdateTimerInit(this.div);
    }

    get powered(){
        return this._powered;
    }

    SendPower = (color)=>{
        this.flow_color = color
        this.div.style.setProperty('--flow-color', color)
        this.powered = true
    }

    set powered(b){                
        if (b){
            
            this.div.classList.add('powered')
        }else{
            //this.flow_color = null            
            //this.div.style.setProperty('--flow-color', FLOW_OFF)            
            this.div.classList.remove('powered')
        }
        this._powered = b
    }

    Click = () =>{
        this.Rotate()
        this.UpdateCss()
        this.Changed()
        //this.div.innerHTML = '';//`${this.io} ${this.rotation}`;
    }    
    Rotate = () =>{
        // rotate io - this bugged when using directly
        let cpy = [...this.io]
        cpy.unshift(cpy.pop())    
        this.io = cpy

        // Set i_rotate to rotate the image initially
        // * make sure the rotated image matches io 
        this.rotation += 1
        let rot = this.i_rotate ? this.i_rotate : 0
        if ( (this.rotation - rot) > 3 ) {
            this.rotation = rot;            
        }        
        this.UpdateCss()        
    }
    UpdateCss = ()=>{                  
        this.div.style.setProperty('--rotation', `${this.rotation * 90}deg`)
        if (this.flow_color){
            this.div.style.setProperty('--flow-color', `${this.flow_color}`)
        }
    }
}// end card

export class Tile{
    constructor(id, pos, div, data){
        this.id = id
        this.pos = pos
        this.div = div      
        this.adjacent = new Array(4).fill(null);
        this.card = null
        this._powered = data['source'] ? data['source'] : false
        if (data.tile_img) div.style.setProperty('--bg-url', `url(../${data.tile_img})`);
    }
    get powered(){
        return this._powered;
    }
    set powered(b){
        this._powered = b        
        if (this.card){
            this.card.powered = b
        } 
    }
    GetAdjacent = map =>{
        const [R,C] = this.pos
        if ( R > 0 )                this.adjacent[N] = map[R-1][C] // North
        if ( C < map[0].length-1 )  this.adjacent[E] = map[R][C+1] // East
        if ( R < map.length-1 )     this.adjacent[S] = map[R+1][C] // South
        if ( C > 0 )                this.adjacent[W] = map[R][C-1] // West
    }
}