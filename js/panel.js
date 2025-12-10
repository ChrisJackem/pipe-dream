import { CreateElement } from "./util.js"

export class Panel{
    constructor(container, name, disabled=false){
        this.container = null 
        this.div = this.CreateContainer(name, disabled)      
        container.appendChild( this.div )
        this.container = this.div.querySelector('.edit-panel-inner')        
    }
    CreateContainer = (name, disabled) => {
        const name_pretty = name.split('_').join(' ')
        const div = document.createElement('div')
        div.classList.add('edit-panel')        
        div.innerHTML = `
            <div class='edit-nav'>
                <h3 style='margin-right:auto'>${name_pretty}</h3>
                <p>Hide</p>                
                <input type='checkbox' ${disabled ? 'checked' : ''} class='container-chkbox' name='${name}'>
            </div>
            <div class='edit-panel-inner flex-row'></div>
        `;        
        return div
    }
}