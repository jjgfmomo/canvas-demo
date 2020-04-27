{
    let view = {
        el: '#canvas-wrapper',
        template: `
            <canvas id="canvas"></canvas>
        `,
        render(){
            document.querySelector(this.el).innerHTML =  this.template
        },
    }
    let model = {
        data: {
            drawingBoardData: null,                   // 画板数据
            stroke: null,                             // 当前笔画
            position: null,                           // 当前 position
            strokeState: null,                        // 画板状态
            recordState: null,                        // 录制状态 || true：正在录制， false：暂停录制
            recordData: null,                         // 录制数据 || recordData.tracks 存储绘制数据，recordData.strikes 存储贴图数据
            recordStartTime: null,                    // 录制开始时间
            recordPauseTime: null,                    // 最近的一次暂停录制时间
        },
        // 计算鼠标坐标与 canvas 之间的距离
        convertPosition(canvasRect, position) {
            return {
                x: position.x - canvasRect.x,
                y: position.y - canvasRect.y
            }
        },
        setDrawingBoardData(data) { this.data.drawingBoardData = data },
        getDrawingBoardData() { return this.data.drawingBoardData },
        setRecordPauseTime(time) { this.data.recordPauseTime = time },
        getRecordPauseTime() { return this.data.recordPauseTime },
        setRecordData(tracks, strikes) { this.data.recordData  = { tracks: tracks, strikes: strikes } },
        getRecordData() { return this.data.recordData },
        setStroke(data) { this.data.stroke = data },
        getStroke() { return this.data.stroke },
        setRecordStartTime(time) { this.data.recordStartTime = time },
        getRecordStartTime() { return this.data.recordStartTime },
        setStrokeState(state) { this.data.strokeState = state },
        getStrokeState() { return this.data.strokeState },
        setRecordState(state) { this.data.recordState = state },
        getRecordState() { return this.data.recordState },
        setPosition(position) { this.data.position = position },
        getPosition() { return this.data.position },
        init() {
            this.data.stroke = []
            this.data.strokeState = false
            this.data.recordState = false
            this.data.recordData = {
                tracks: [],
                strikes: []
            }
            this.data.position = {
                x: null,
                y: null
            }
        }
    }
    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.model.init()
            this.view.render(this.model.data)
            this.canvasContext = this.getCanvasContext('500', '624', 'url(./img/1.JPG)  ')
            this.addListener()
            // 更新画板数据
            window.eventHub.on('updateDrawingBoardData', data => {
                this.model.setDrawingBoardData(data)
            })
            window.eventHub.on('createStickerAndBindEvent', data => {
                this.createStickerAndBindEvent(data.html, data.selector)
            })
            window.eventHub.on('switchRecordState',() => {
                if (!this.model.getRecordState()){
                    this.startRecord()
                }else {
                    this.pauseRecord()
                }
            })
            window.eventHub.on('clearCanvas', () => {
                const canvas = this.getCanvasElement()
                this.canvasContext.clearRect(0, 0, canvas.width, canvas.height)
            })
            window.eventHub.on('play', () => {
                if (!this.model.getRecordState()) {
                    window.eventHub.emit('clearCanvas')
                    let tracks = this.model.getRecordData().tracks
                    if (tracks.length) {
                        tracks.forEach(stroke => {
                            let previousPosition = stroke[0].position
                            stroke.forEach( track => {
                                setTimeout(()=>{
                                    this.drawLine(previousPosition, track.position, track.color)
                                    previousPosition = track.position
                                }, track.time)
                            })
                        })
                    } else alert('没有进行录制')
                }else alert('请先结束录制')
            })
            window.eventHub.on('finishRecord', () => {
                if (this.model.getRecordPauseTime() || this.model.getRecordState()) {
                    document.querySelector('#recordButton').innerHTML = '开始录制'
                    console.log(JSON.stringify(this.model.getRecordData()))
                    this.model.setRecordPauseTime(null)
                    this.model.setRecordState(false)
                    alert('录制完成')
                }else alert('您没有开始录制')
            })
            window.eventHub.on('re-record', () => {
                window.eventHub.emit('clearCanvas')
                this.model.setRecordState(false)
                document.querySelector('#recordButton').innerHTML = '开始录制'
                this.model.setRecordData([], [])
                this.model.setRecordPauseTime(null)
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
                // 判断鼠标坐标超出范围
                if (e.x < canvasRect.x || e.x > canvasRect.x + canvasRect.width || e.y < canvasRect.y || e.y > canvasRect.y + canvasRect.height) {
                    this.model.setStrokeState(false)
                }else {
                    const position = { x: e.clientX, y: e.clientY }
                    const newPosition = this.model.convertPosition(canvasRect, position)
                    // 判断当前是否在画
                    if (this.model.getStrokeState()) {
                        // 画板为 pen 模式
                        if (this.model.getDrawingBoardData().pointer === 'pen') {
                            // 画
                            this.drawLine(this.model.getPosition(), newPosition, this.model.getDrawingBoardData().color)
                            this.model.setPosition(newPosition)
                            // 判断是否录制
                            if (this.model.getRecordState()) {
                                //记录数据
                                const strokeData = {
                                    time: new Date().getTime() - this.model.getRecordStartTime(),
                                    position: this.model.getPosition(),
                                    color: this.model.getDrawingBoardData().color
                                }
                                this.model.getStroke().push(strokeData)
                            }
                        }
                        // 画板为 eraser 模式
                        if (this.model.getDrawingBoardData().pointer === 'eraser') {
                            // 擦除
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
                    this.model.data.recordData.tracks.push(this.model.data.stroke) // 数据结构优化
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
        startRecord() {
            this.model.setRecordState(true)
            document.querySelector('#recordButton').innerHTML = '暂停录制'
            if (this.model.getRecordPauseTime()) {
                this.model.setRecordStartTime(new Date().getTime() - this.model.getRecordPauseTime() + this.model.getRecordStartTime())
            }else {
                this.model.setRecordStartTime(new Date().getTime())
            }
        },
        pauseRecord() {
            this.model.setRecordState(false)
            document.querySelector('#recordButton').innerHTML = '开始录制'
            this.model.setRecordPauseTime(new Date().getTime())
        }
    }
    controller.init(view,model)
}
