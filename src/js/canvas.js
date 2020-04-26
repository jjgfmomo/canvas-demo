{
    let view = {
        el: '#canvas-wrapper',
        template: `
            <canvas id="canvas"></canvas>
        `,
        render(data){
            document.querySelector(this.el).innerHTML =  this.template
        },
    }
    let model = {
        data: {
            drawingBoardData: null, //画板数据
            stroke: [],             //当前笔画

            position: {             //当前position
                x: undefined,
                y: undefined
            },
            strokeState: false,
            usingEraser: false,

            recordState: false,
            recordData: {},
            recordStartTime: '',
        },
        setRecordData(tracks, strikes) {
            this.data.recordData.tracks = tracks
            this.data.recordData.strikes = strikes
        },
        convertPosition(canvasRect, position) {
            return {
                x: position.x - canvasRect.x,
                y: position.y - canvasRect.y
            }
        },
        setStroke(data) {
            this.data.stroke = data
        },
        getStroke() {
            return this.data.stroke
        },
        setRecordStartTime(time) {
            this.data.recordStartTime = time
        },
        getRecordStartTime() {
            return this.data.recordStartTime
        },
        setDrawingBoardData(data) {
            this.data.drawingBoardData = data
        },
        getDrawingBoardData() {
          return this.data.drawingBoardData
        },
        setStrokeState(state) {
            this.data.strokeState = state
        },
        getStrokeState() {
            return this.data.strokeState
        },
        setRecordState(state) {
            this.data.recordState = state
        },
        getRecordState(state) {
            return this.data.recordState
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
            this.canvasContext = this.getCanvasContext('500', '624', 'url(./img/1.JPG)  ')
            this.addListener()
            window.eventHub.on('updatedCanvasSetting', data => {
                this.model.setDrawingBoardData(data)
            })
            window.eventHub.on('createStickerAndBindEvent', data => {
                this.createStickerAndBindEvent(data.html, data.selector)
            })
            window.eventHub.on('switchRecordState',() => {
                this.model.switchRecordState()
                if (this.model.data.recordState){
                    this.model.setRecordData([], [])
                    this.model.setRecordStartTime(new Date().getTime())
                }else {
                    console.log(JSON.stringify(this.model.data.recordData))
                }
            } )
            window.eventHub.on('clearCanvas', () => {
                const canvas = this.getCanvasElement()
                this.canvasContext.clearRect(0, 0, canvas.width, canvas.height)
            })
            window.eventHub.on('play', () => {
                if (this.model.data.recordData.tracks) {
                    this.model.data.recordData.tracks.forEach(stroke => {
                        let previousPosition = stroke[0].position
                        stroke.forEach( track => {
                            setTimeout(()=>{
                                this.drawLine(previousPosition, track.position, track.color)
                                previousPosition = track.position
                            }, track.time)
                        })
                    })
                } else console.log('没有进行录制')
            })
            this.addListener()
        },
        addListener() {
            this.listenCanvasOnmousedown()
            this.listenCanvasOnmousemove()
            this.listenCanvasOnmouseup()
        },
        listenCanvasOnmousedown() {
            this.getCanvasElement().onmousedown = e => {
                this.model.setStrokeState(true)
                const position = this.model.convertPosition(this.getCanvasElement().getClientRects()[0],{x: e.clientX, y: e.clientY})
                this.model.setPosition(position)
            }
        },
        listenCanvasOnmousemove() {
            const canvas = this.getCanvasElement()
            const canvasRect = canvas.getClientRects()[0]
            document.querySelector('html').onmousemove = e => {
                e.preventDefault()
                if (e.x < canvasRect.x || e.x > canvasRect.x + canvasRect.width || e.y < canvasRect.y || e.y > canvasRect.y + canvasRect.height) {
                    this.model.setStrokeState(false)
                }else {
                    const position = { x: e.clientX, y: e.clientY }
                    const newPosition = this.model.convertPosition(canvasRect, position)
                    if (this.model.getStrokeState()) {
                        if (this.model.getDrawingBoardData().pointer === 'pen') {
                            this.drawLine(this.model.getPosition(), newPosition, this.model.getDrawingBoardData().color)
                            this.model.setPosition(newPosition)
                            if (this.model.getRecordState()) {
                                const strokeData = {
                                    time: new Date().getTime() - this.model.getRecordStartTime(),
                                    position: this.model.getPosition(),
                                    color: this.model.getDrawingBoardData().color
                                }
                                this.model.getStroke().push(strokeData)
                            }
                        }
                        if (this.model.getDrawingBoardData().pointer === 'eraser') {
                            this.useEraser(newPosition, 15)
                        }
                    }
                }
            }
        },
        listenCanvasOnmouseup() {
            this.getCanvasElement().onmouseup = e => {
                this.model.setStrokeState(false)
                if (this.model.getRecordState()){
                    this.model.data.recordData.tracks.push(this.model.data.stroke) //数据结构优化
                    this.model.setStroke([])
                }
            }
        },
        useEraser(position, radius) {
            this.canvasContext.clearRect(position.x, position.y, radius, radius)
        },
        getCanvasContext(width, height, backgroundUrl) {
            const canvas = this.getCanvasElement()
            canvas.width = width
            canvas.height = height
            canvas.style.backgroundImage = backgroundUrl
            return canvas.getContext('2d')
        },
        createStickerAndBindEvent(html, selector) {
            let wrapperElement = document.querySelector(selector)
            let posDiv = document.createElement('div')
            posDiv.insertAdjacentHTML('beforeend', html)
            posDiv.style.position = 'absolute'
            posDiv.style.left = '0px'
            posDiv.style.top = '0px'
            posDiv.style.border = '3px dotted black'
            posDiv.setAttribute('class', 'pos')
            let v = document.createElement('div')
            v.setAttribute('class','v')
            v.innerHTML = 'V'
            posDiv.append(v)
            wrapperElement.appendChild(posDiv)
            let newElement = posDiv
            let pointerX,  pointerY
            let state = false
            v.onclick = e => {
                state = false
                if (this.model.data.recordState){
                    this.model.data.recordData.strikes.push({
                        time: new Date().getTime() - this.model.data.recordStartTime,
                        url: 'heart.png',
                        position: {
                            x: posDiv.offsetLeft,
                            y: posDiv.offsetTop
                        }
                    })
                }
                v.remove()
                posDiv.style.border = 'none'
                posDiv.onmousedown = ev => {}
            }
            newElement.onmousedown = e => {
                state = true
                pointerX = e.clientX
                pointerY = e.clientY
                newElement.onmouseup = e => {
                    state = false
                }
                wrapperElement.onmousemove = e => {
                    e.preventDefault()
                    if (state){
                        let dX =  e.clientX - pointerX
                        let dY =  e.clientY - pointerY
                        newElement.style.left = newElement.offsetLeft + dX + 'px'
                        newElement.style.top = newElement.offsetTop + dY + 'px'
                        pointerX = e.clientX
                        pointerY = e.clientY
                    }
                }
            }
        },
        drawLine(start, end, color){
            this.canvasContext.strokeStyle = color
            this.canvasContext.beginPath()
            this.canvasContext.moveTo(start.x, start.y)
            this.canvasContext.lineTo(end.x, end.y)
            this.canvasContext.lineWidth = 3
            this.canvasContext.stroke()
            this.canvasContext.closePath()
        },
        getCanvasElement() {
            return document.querySelector('#canvas')
        },
    }
    controller.init(view,model)
}
