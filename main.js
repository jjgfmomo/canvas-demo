{
    let view = {
        el: '#canvas',
        template: `
            <button id = "recordButton">开始录制</button>
            <button id = "clearButton">清屏</button>
            <button id = "playButton">播放</button>
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
            position: {
                x: undefined,
                y: undefined
            },
            stroke: [],
            using: false,
            recordState: false,
            recordData: {
                track: [],
            },
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
        }
        // init() {}
    }
    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.data)
            this.canvas = this.initCanvas(this.view.getThisElement())
            this.addListener()
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
                    this.model.data.recordStartTime = new Date().getTime()
                }else {
                    console.log(this.model.data.recordData)
                }
            }
        },
        listenClearButtonOnclick() {
            document.querySelector('#clearButton').onclick = e => {
                this.canvas.clearRect(0, 0, this.view.getThisElement().getClientRects()[0].width, this.view.getThisElement().getClientRects()[0].height)
            }
        },
        listenPlayButtonOnclick() {
            document.querySelector('#playButton').onclick = e => {
                document.querySelector('#clearButton').click()
                this.model.data.recordData.track.forEach(stroke => {
                    let previousPosition = stroke[0].position
                    stroke.forEach( track => {
                        setTimeout(()=>{
                            this.drawLine(previousPosition, track.position)
                            previousPosition = track.position
                        }, track.time)
                    })
                })
            }

        },
        listenCanvasOnmousedown() {
            document.querySelector('#canvas').onmousedown = e => {
                this.model.data.using = true
                let position = this.model.convertPosition(this.view.getThisElement().getClientRects()[0],{x: e.clientX, y: e.clientY})
                this.model.setPosition(position)
            }
        },
        listenCanvasOnmousemove() {
            document.querySelector('#canvas').onmousemove = e => {
                if (this.model.data.using){
                    let newPosition = {
                        x: e.clientX,
                        y: e.clientY
                    }
                    newPosition = this.model.convertPosition(this.view.getThisElement().getClientRects()[0], newPosition)
                    this.drawLine(this.model.data.position, newPosition)
                    this.model.setPosition(newPosition)
                    if (this.model.data.recordState) {
                        const trackData = {
                            time: new Date().getTime() - this.model.data.recordStartTime,
                            position: JSON.parse(JSON.stringify(this.model.getPosition()))
                        }
                        this.model.data.stroke.push(trackData)
                    }
                }
            }
        },
        listenCanvasOnmouseup() {
            document.querySelector('#canvas').onmouseup = e => {
                this.model.data.using = false
                this.model.data.recordData.track.push(this.model.data.stroke)
                this.model.data.stroke = []
            }
        },
        initCanvas(element) {
            element.width = '540'
            element.height = '770'
            element.style.backgroundImage = `url("./1.JPG")`
            element.style.backgroundSize = 'contain'
            return element.getContext('2d')
        },
        drawLine(start,end){
            this.canvas.beginPath()
            this.canvas.strokeStyle  = 'red'
            this.canvas.moveTo(start.x,start.y)
            this.canvas.lineTo(end.x,end.y)
            this.canvas.lineWidth = 3
            this.canvas.stroke()
            this.canvas.closePath()
        }
    }
    controller.init(view,model)
}
