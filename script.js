import colors from "./COLORS.js"




document.oncontextmenu = function() {
    return false
}
const ContextMenu = {
    elem: document.createElement('ul'),
    init: function(parent) {
        parent.append(this.elem)
    },
    show: function(contextX, contextY) {
    
        this.elem.style.top = contextY
        this.elem.style.left = contextX
        this.elem.classList.add('contextMenu','active')
        return this.elem
    },
    hide: function() {
        this.elem.classList.remove("active")
    },
    addItem: function({value, onclickHandler}) {
        const createNote = document.createElement('li')
        createNote.textContent = value
        createNote.addEventListener('click', onclickHandler)
        createNote.classList.add('contextmenu__item')
        this.elem.append(createNote)
        return this
    }
}

const notes = []

const main = document.querySelector(".main")
ContextMenu.init(main)

ContextMenu.addItem({
    value: "Создать Новую заметку",
    onclickHandler: function(e) {
        let win = new Win({
            posx : e.pageX + 'px',
            posy: e.pageY + 'px'
        })
        notes.push(win)
        win.init(document.body)
    }
})





main.addEventListener('mousedown', function(e)  {
    e.preventDefault()
    let contextX = e.clientX + "px"
    let contextY = e.clientY + "px"
    if(e.button == 2) {

        this.append(ContextMenu.show(contextX, contextY))
    }
    if(e.button == 0) {
        setTimeout(() => {
            ContextMenu.hide()   
        }, 200);
        
    }
})



function Win(options) {
    this.posX = options.posx
    this.posY = options.posy

    this.dx = 0
    this.dy = 0

    
    this.init = function(parent) {
        this.elem = document.createElement("div")
        this.elem.style.top = this.posY
        this.elem.style.left = this.posX
        parent.append(this.elem)
        this.elem.classList.add("window")
        this.elem
        this._isDrag = false

        const header = document.createElement('div')
        header.classList.add('window__header')
        header.setAttribute('draggable', "true")
        this.elem.append(header)
        
        const textArea = document.createElement('textarea')
        textArea.classList.add('window__textarea')
        textArea.removeAttribute("draggable", "false")
        this.elem.append(textArea)

        this.elem.onclick = (function() {
            removeOverClass()
            this.elem.classList.add("over")
        }).bind(this)

        header.addEventListener("dragstart", dragStart.bind(this))

        header.addEventListener('dragend', dragEnd.bind(this))
    }
}




function dragEnd(e) {
    this.posX = e.pageX - this.dx
    this.posY = e.pageY - this.dy
    this.elem.style.top = this.posY + 'px'
    this.elem.style.left = this.posX + 'px'
    this.elem.classList.add("over")
}

function dragStart(e) {
    this.dx = e.offsetX
    this.dy = e.offsetY
}

function removeOverClass() {
    notes.map( item => {
        item.elem.classList.remove("over")
        // console.log(item);
    })
}