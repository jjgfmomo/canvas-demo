{
    let view = {
        el: '#canvas',
        template: `
        `,
        render(data){
            document.querySelector(this.el).insertAdjacentHTML('beforebegin',this.template)
        },
        getThisElement() {
          return document.querySelector(this.el)
        },
    }
    let model = {
        data: {
            currentData: null,
            position: {
                x: undefined,
                y: undefined
            },
            stroke: [],
            using: false,
            usingEraser: false,
            recordState: false,
            recordData: {},
            recordStartTime: '',
        },
        convertPosition(canvasRect, position) {
            return {
                x: position.x - canvasRect.x,
                y: position.y - canvasRect.y
            }
        },
        setPosition(position) {
            this.data.position = position
        },
        getPosition() {
            return this.data.position
        },
        switchRecordState() {
            this.data.recordState = ! this.data.recordState
        },

    }
    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.data)
            this.addListener()
            this.canvas = this.initCanvas(this.view.getThisElement())
            window.eventHub.on('updatedCanvasSetting', e => {
                this.model.data.currentData = e
                this.updateCanvasColor(e.color)
            })
        },
        updateCanvasColor(color) {
            this.canvas.strokeStyle = color
        },
        addListener() {
            this.listenCanvasOnmousedown()
            this.listenCanvasOnmousemove()
            this.listenCanvasOnmouseup()
            this.listenRecordButtonOnclick()
            this.listenClearButtonOnclick()
            this.listenPlayButtonOnclick()
        },
        listenRecordButtonOnclick() {
            document.querySelector('#recordButton').onclick = e => {
                this.model.switchRecordState()
                if (this.model.data.recordState){
                    this.model.data.recordData.track = []
                    this.model.data.recordStartTime = new Date().getTime()
                }else {
                }
            }
        },
        listenClearButtonOnclick() {
            document.querySelector('#clearButton').onclick = e => {
                this.canvas.clearRect(0, 0, this.view.getThisElement().getClientRects()[0].width, this.view.getThisElement().getClientRects()[0].height)
            }
        },
        clearCanvas() {
            document.querySelector('#clearButton').click()
        },
        listenPlayButtonOnclick() {
            document.querySelector('#playButton').onclick = e => {
                this.clearCanvas()
                if (this.model.data.recordData.track) {
                    this.model.data.recordData.track.forEach(stroke => {
                        let previousPosition = stroke[0].position
                        stroke.forEach( track => {
                            setTimeout(()=>{
                                this.drawLine(previousPosition, track.position)
                                previousPosition = track.position
                            }, track.time)
                        })
                    })
                }else console.log('没有进行录制')
            }
        },
        listenCanvasOnmousedown() {
            document.querySelector('#canvas').onmousedown = e => {
                if (this.model.data.currentData.pointer == 'eraser') {
                    this.model.data.using = false
                    this.model.data.usingEraser = true
                }else {
                    this.model.data.using = true
                    this.model.data.usingEraser = false
                    let position = this.model.convertPosition(this.view.getThisElement().getClientRects()[0],{x: e.clientX, y: e.clientY})
                    this.model.setPosition(position)
                }
            }
        },
        listenCanvasOnmousemove() {
            document.querySelector('#canvas').onmousemove = e => {
                let newPosition = {
                    x: e.clientX,
                    y: e.clientY
                }
                newPosition = this.model.convertPosition(this.view.getThisElement().getClientRects()[0], newPosition)
                if (this.model.data.using){
                    this.drawLine(this.model.data.position, newPosition)
                    this.model.setPosition(newPosition)
                    if (this.model.data.recordState) {
                        const trackData = {
                            time: new Date().getTime() - this.model.data.recordStartTime,
                            position: this.model.getPosition()
                        }
                        this.model.data.stroke.push(trackData)
                    }
                }else {
                    if (this.model.data.usingEraser){
                        console.log(e.clientX)
                        this.canvas.clearRect(newPosition.x, newPosition.y, 15, 15)
                    }
                }
            }
        },
        listenCanvasOnmouseup() {
            document.querySelector('#canvas').onmouseup = e => {
                this.model.data.using = false
                this.model.data.usingEraser = false
                if (this.model.data.recordState){
                    this.model.data.recordData.track.push(this.model.data.stroke)
                    this.model.data.stroke = []
                }
            }
        },
        initCanvas(element) {
            element.width = '500'
            element.height = '624'
            element.style.backgroundImage = `url("./1.JPG")`
            element.style.backgroundSize = 'contain'
            return element.getContext('2d')
        },
        drawLine(start,end){
            this.canvas.beginPath()
            this.canvas.moveTo(start.x,start.y)
            this.canvas.lineTo(end.x,end.y)
            this.canvas.lineWidth = 3
            this.canvas.stroke()
            this.canvas.closePath()
        }
    }
    controller.init(view,model)
}
