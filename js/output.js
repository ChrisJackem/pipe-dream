
const SHOW_TIME = 3000
export class OutputPanel{
    timeout = null
    constructor(){
        this.div = document.getElementById('output')
        //this.div.classList.add('show')
        //this.ShowOutput('Loading...')
    }
    ShowOutput = txt => {
        if (this.timeout){
            clearTimeout(this.timeout)
        }    
        if (this.div.classList.contains('show')){
            // already shown
            this.div.innerHTML += `<p>${txt}</p>`
        }else{
            this.div.innerHTML = `<p>${txt}</p>`
            this.div.classList.add('show')
        }
        this.timeout = window.setTimeout(()=>{
            this.timeout = null
            this.div.classList.remove('show')
        }, SHOW_TIME )
    }
}