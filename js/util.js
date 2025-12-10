//---------------- Helpers ----------------------------
export const CreateRow = (parent, content)  => {
    const row = CreateElement('tr', {}, parent)
    for ( const cont of content ){
        const td = CreateElement('td', {}, row)
        td.appendChild( cont )
    }
    return row           
}
export const SetProps = (el, props) => { for ( const [k,v] of Object.entries(props) ) el[k] = v }
export const CreateElement = (tipe, props={}, container=null) => {
    const el = document.createElement(tipe)
    SetProps(el, props)
    if ( container ) container.appendChild(el)
    return el
}

//////////////////////////////////////////////////// JSON PARSER //////////////////////////////////
const EXCLUDE = new Set(["custom"])  
const TILES = 'tiles' // The tiles matrix name 
const SPACER = '\t'

/**
 * * Make sure to join when you call this
 * @param {JSON} json - json data
 * @param {Array} arr - DO NOT SET  array to store output
 * @param {Number} indent - DO NOT SET amount to indent the strings
 * @returns {Array} arr - the parsed data strings, with newlines
 */
export const ParseJSON = (json, arr=[], indent=0) => {
    //if (!arr) arr = []
    const INDENT = SPACER.repeat(indent)
    indent += 1
    for ( const [key, val] of Object.entries(json) ) {
        if (EXCLUDE.has(key)) continue        
        
        if ( key == TILES ){
            arr.push(`${INDENT}"${TILES}" : [\n`)
            for (const r in val){
                // Add Quotes "" to the values and join
                const row = val[r].map( v => `"${v}"`).join(', ')
                const comma = r < val.length-1 ? ',' : ''
                arr.push(`${INDENT}\t[${row}]${comma}\n`)
            }
            arr.push(`${INDENT}],\n`)
        // Normal array
        }else if ( Array.isArray(val) ){
            arr.push(`${INDENT}"${key}" : [${val.join(', ')}],\n`)
        }else{
            switch(typeof val){
                case "object":                    
                    arr.push(`${INDENT}"${key}" : {\n`)
                    ParseJSON(val, arr, indent)
                    arr.push(`${INDENT}},\n`)
                break
                case "boolean":
                    arr.push(`${INDENT}"${key}" : ${val},\n`)
                break
                case "number":
                    arr.push(`${INDENT}"${key}" : ${val},\n`)
                break
                case "string":
                    arr.push(`${INDENT}"${key}" : "${val}",\n`)
                break                
            }
        }
    }

    // --- Remove last comma ---
    let last_line = arr.pop()
    const comma_search = last_line.lastIndexOf(',')
    if (comma_search > 0){
        last_line = last_line.slice(0, comma_search)
        last_line += `\n`
    }
    arr.push(last_line)

    return arr
}