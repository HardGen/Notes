

const NOTES_STORAGE_NAME = 'notes'
const VERSION = 1
const DBNAME = 'mydb'

const DB = {
    openRequest: null,
    open: function (name, version, cb) {
        openRequest = indexedDB.open(name, version)

        openRequest.onupgradeneeded = function () {
            let db = openRequest.result
            if (!db.objectStoreNames.contains(NOTES_STORAGE_NAME)) {
                const notesStore = db.createObjectStore(NOTES_STORAGE_NAME, { keyPath: 'id', autoIncrement: true })

                notesStore.createIndex('color', 'color', { unique: false })
                notesStore.createIndex('content', 'content', { unique: false })
                notesStore.createIndex('created', 'created', { unique: false })
                notesStore.createIndex('dateUpdate', 'dateUpdate', { unique: false })
                notesStore.createIndex('posX', 'posX', { unique: false })
                notesStore.createIndex('posY', 'posY', { unique: false })
                console.log('a');
            }
        }

        openRequest.onerror = function () {
            console.error("Error", openRequest.error)
        }

        openRequest.onsuccess = function () {
            let db = openRequest.result
            db.onversionchange = function () {
                db.close();
                alert("База данных устарела, пожалуйста, перезагрузите страницу.")
            };
            cb(db)
        }
    },

    createNote: function (posX, posY, cb) {

        this.open(DBNAME, VERSION, function (db) {
            const transaction = db.transaction(NOTES_STORAGE_NAME, 'readwrite')
            const notes = transaction.objectStore(NOTES_STORAGE_NAME)

            let note = {
                color: '#f6930e',
                content: '',
                created: Date.now(),
                dateUpdate: null,
                posX: posX,
                posY: posY
            }
            let request = notes.add(note)
            request.onsuccess = function () {
                console.log('Заметка добавлена в БД', request.result)
                cb(null, request.result)
            }
            request.onerror = function () {
                cb(request.error)
            }
        })
    },

    getAll: function(cb) {
        this.open(DBNAME, VERSION, function(db) { 
            const transaction = db.transaction(NOTES_STORAGE_NAME, 'readonly')
            const notes = transaction.objectStore(NOTES_STORAGE_NAME)
            const request = notes.getAll()

            request.onerror = function() {
                cb(request.error)
            }

            request.onsuccess = function() {
                cb(null, request.result)
            }
        })
    },


    updateNode: function(note, cb) {
        this.open(DBNAME, VERSION, function(db) {
            const transaction = db.transaction(NOTES_STORAGE_NAME, 'readwrite')
            const notes = transaction.objectStore(NOTES_STORAGE_NAME)

            const data = {
                id: note.id,
                color: note.color,
                content: note.content,
                created: note.created,
                dateUpdate: Date.now(),
                posX: note.posX,
                posY: note.posY
            }

            const request = notes.put(data)

            request.onerror = function() {
                cb(err)
            }

            request.onsuccess = function() {
                cb(null, request)
            }

        })
    },

    deleteNode: function(id, cb) {
        this.open(DBNAME, VERSION, function(db) {
            const transaction = db.transaction(NOTES_STORAGE_NAME, 'readwrite')
            const notes = transaction.objectStore(NOTES_STORAGE_NAME)

            const request = notes.delete(id)

            request.onsuccess = function() {
                cb(null, request.result)
            }

            request.onerror = function() {
                cb(request.error)
            }

        })
    }
}


document.oncontextmenu = function () {
    return false
}
const ContextMenu = {
    elem: document.createElement('ul'),
    init: function (parent) {
        parent.append(this.elem)
    },
    show: function (contextX, contextY) {

        this.elem.style.top = contextY
        this.elem.style.left = contextX
        this.elem.classList.add('contextMenu', 'active')
        return this.elem
    },
    hide: function () {
        this.elem.classList.remove("active")
    },
    addItem: function ({ value, onclickHandler }) {
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
    onclickHandler: function (e) {
        DB.createNote(e.pageX, e.pageY, function (err, id) {
            if (err) return console.error(err)
            let win = new Win({
                posx: e.pageX + 'px',
                posy: e.pageY + 'px',
                id
            })
            win.init(document.body)


        })

    }
})





main.addEventListener('mousedown', function (e) {
    e.preventDefault()
    let contextX = e.clientX + "px"
    let contextY = e.clientY + "px"
    if (e.button == 2) {

        this.append(ContextMenu.show(contextX, contextY))
    }
    if (e.button == 0) {
        setTimeout(() => {
            ContextMenu.hide()
        }, 200);

    }
})



function Win(options) {
    this.posX = options.posx
    this.posY = options.posy
    this.id = options.id
    this.dx = 0
    this.dy = 0
    this.content = options.content ?? ''
    this.color = options.color ?? 'blue'

    this.destroy = function() {
        this.elem.remove()
    }

    this.init = function (parent) {
        this.elem = document.createElement("div")
        this.elem.setAttribute('id', this.id)
        this.elem.style.top = this.posY 
        this.elem.style.left = this.posX
        parent.append(this.elem)
        this.elem.classList.add("window")
        this.elem
        this._isDrag = false

        const header = document.createElement('div')
        const header_menuDiv = document.createElement('div')
        const win_close = document.createElement('div')

        header_menuDiv.classList.add("header_menu")
        win_close.classList.add("win_close")
        win_close.addEventListener('click', deleteNodeHandler.bind(this))
        win_close.append(document.createElement('span'), document.createElement('span'))
        header_menuDiv.append(document.createElement('span'),
            document.createElement('span'),
            document.createElement('span'))

        header.append(header_menuDiv)
        header.append(win_close)

        header.classList.add('window__header')
        header.style.backgroundColor = this.color
        header.setAttribute('draggable', "true")
        this.elem.append(header)

        const textArea = document.createElement('textarea')
        textArea.value = this.content
        textArea.addEventListener('keypress', (function(e) {
            console.log(this);
            if(e.key == 'Enter') {
                this.content = e.target.value
                const note = {
                    id: this.id,
                    color: this.color,
                    content: this.content,
                    dateUpdate: Date.now(),
                    posX: parseInt(this.posX),
                    posY: parseInt(this.posY)
                }
                DB.updateNode(note, function(err, data) {
                    if(err) return consolee.error(err)
                    console.log(data)
                })
            }
        }).bind(this))
        textArea.classList.add('window__textarea')
        textArea.removeAttribute("draggable", "false")
        this.elem.append(textArea)

        this.elem.onclick = (function () {
            removeOverClass()
            this.elem.classList.add("over")
        }).bind(this)

        header.addEventListener("dragstart", dragStart.bind(this))

        header.addEventListener('dragend', dragEnd.bind(this))


        header.addEventListener('changePosition', function(event) {

        })

        header_menuDiv.addEventListener('click', function (e) {
            ColorPalate.show(e.clientX, e.clientY, header)
        })
    }
}




function dragEnd(e) {
    this.posX = e.pageX - this.dx
    this.posY = e.pageY - this.dy
    this.elem.style.top = this.posY + 'px'
    this.elem.style.left = this.posX + 'px'
    this.elem.classList.add("over")
    const note = {
        id: this.id,
        color: this.color,
        content: this.content,
        dateUpdate: Date.now(),
        posX: parseInt(this.posX),
        posY: parseInt(this.posY)
    }
    DB.updateNode(note, function(err, data) {
        if(err) {
            console.error(err);
            return 
        }

        console.log(data);
    })
}

function dragStart(e) {
    this.dx = e.offsetX
    this.dy = e.offsetY


}


function removeOverClass() {
    notes.map(item => {
        item.elem.classList.remove("over")
        // console.log(item);
    })
}

function deleteNodeHandler(e) {
    DB.deleteNode(this.id, (err, data) => {
        if (err) {
            console.error(err);
            return 
        }
        this.destroy()
    })
}


var ColorPalate = {
    colors: {
        ORAGE: "#f6930e",
        red: "#f62a0e",
        pink: "#f10ef6",
        purple: "#860ef6",
        darkblue: "#0e55f6",
        blue: "#0ebaf6",
        green: "#40f60e",
        yellow: "#dff60e",
    },

    dispatcher: null,

    domElem: document.createElement('div'),

    init: function () {
        this.domElem.classList.add('color_palate')
        for (let [key, value] of Object.entries(this.colors)) {
            const itemElem = document.createElement('div')
            itemElem.classList.add("circle")
            itemElem.dataset.color = `${value}`
            itemElem.style.backgroundColor = value
            itemElem.addEventListener('click', (function (e) {
                this.dispatcher.dispatchEvent(new CustomEvent('changeColor', {
                    detail: {
                        color: itemElem.dataset.color
                    }
                }))
                this.hide()
            }).bind(this))

            this.domElem.append(itemElem)
        }
    },

    hide: function () {
        this.domElem.style.display = 'none'
    },

    show: function (x, y, elem) {
        this.dispatcher = elem
        this.domElem.style.left = x - 30 + "px"
        this.domElem.style.top = y - 65 + "px"
        this.domElem.style.display = 'flex'
    }
}

ColorPalate.init()

document.body.append(ColorPalate.domElem)

window.onload = function() {
    DB.getAll(function(err, data)  {
        if (err) {
            console.error(err)
            return 
        }

        data.forEach(note => {
            const win = new  Win({
                posx: note.posX + 'px',
                posy: note.posY + 'px',
                id: note.id,
                content: note.content,
                color: note.color
            })
            win.init(document.body)
        });

    })
}


