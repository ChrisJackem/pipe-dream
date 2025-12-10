import { EventMaster } from "./event_master.js"

const HIDE_CLASS = 'hide'

export class Modal{
    constructor(modal){
        this.div = modal
        this.div.classList.add(HIDE_CLASS)
        this.event_master = new EventMaster()
        this.inner_divs = [...document.getElementsByClassName('modal-inner')]
        //this.text_div = document.getElementById('modal-text')
        //this.text_div.innerHTML = ''
        this.HideInners()
    }

    HideInners = (exclude) => {
        this.inner_divs.forEach( d => {
            if (d.id != exclude) {
                d.classList.add(HIDE_CLASS)
            }else{
                d.classList.remove(HIDE_CLASS)
            }
        })
    };

    HideModal = () =>{
        this.HideInners('')
        this.event_master.PurgeListeners()
        this.div.classList.add(HIDE_CLASS)
    }

    CreateButtonModal = (id, txt, funcs=[]) => {   
        const d = this.div.getElementsByClassName('modal-text')[0]
        d.innerHTML = txt
        this.div.classList.remove(HIDE_CLASS)

        this.HideInners(id)        
        const modal_div = document.getElementById(id)
        const modal_text = modal_div.querySelector('.modal-text')
        if (modal_text && txt) modal_text.innerHTML = txt

        // Button funks
        const buttons = [...modal_div.getElementsByTagName('button')]
        for (let b in buttons){
            const button = buttons[b]
            const func = () => {
                this.HideModal()
                try{
                    if ( funcs && funcs[b] ) funcs[b]()
                }catch(E){console.error('modal error', `${E}`)}
            }
            this.event_master.AddEventListener(button, 'click', func)  
        }        
    } 
}