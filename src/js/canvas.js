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
            recordData: null,                         // 录制数据 || recordData.tracks 存储绘制数据，recordData.stickers 存储贴图数据
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
        setRecordData(key, value) { this.data.recordData[key] = value },
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
            this.data.recordData = { tracks: [], stickers: [] }
            this.data.position = { x: null, y: null }
        }
    }
    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.data)
            this.canvasContext = this.getCanvasContext('500', '624', 'url(./img/1.JPG)  ')
            this.addListener()
            // 更新画板数据
            window.eventHub.on('updateDrawingBoardData', data => {
                this.model.setDrawingBoardData(data)
            })
            // 切换录制状态 || 开始录制，暂停录制
            window.eventHub.on('switchRecordState',() => {
                if (!this.model.getRecordState()) this.startRecord()
                else this.pauseRecord()
            })
            // 画板清屏
            window.eventHub.on('clearCanvas', () => {
                const canvas = this.getCanvasElement()
                this.canvasContext.clearRect(0, 0, canvas.width, canvas.height)
                document.querySelectorAll('.stickers-item').forEach(element => {
                    element.remove()
                })
                window.eventHub.emit('updatedOperationLog', '画板清屏')
            })
            // 播放录制数据
            window.eventHub.on('play', () => {
                if (!this.model.getRecordState()) {
                    let tracks = this.model.getRecordData().tracks
                    let stickers = this.model.getRecordData().stickers
                    if (tracks.length || stickers.length) {
                        window.eventHub.emit('clearCanvas')
                        tracks.map(stroke => {
                            let previousPosition = stroke[0] ? stroke[0].position : null
                            stroke.forEach( track => {
                                setTimeout(()=>{
                                    this.drawLine(previousPosition, track.position, track.color)
                                    previousPosition = track.position
                                }, track.time)
                            })
                        })
                        stickers.map(sticker => {
                            setTimeout( () => {
                                this.createSticker(sticker.html, sticker.id, sticker.position)
                            }, sticker.time)
                        })
                        window.eventHub.emit('updatedOperationLog', '播放')
                    } else alert('没有进行录制')
                } else alert('请先结束录制')
            })
            // 结束录制
            window.eventHub.on('finishRecord', () => {
                if (this.model.getRecordPauseTime() || this.model.getRecordState()) {
                    document.querySelector('#recordButton').innerHTML = '开始录制'
                    console.log(JSON.stringify(this.model.getRecordData()))
                    this.model.setRecordPauseTime(null)
                    this.model.setRecordState(false)
                    window.eventHub.emit('updatedOperationLog', '录制完成')
                }else alert('您没有开始录制')
            })
            // 重新录制
            window.eventHub.on('re-record', () => {
                window.eventHub.emit('clearCanvas')
                this.model.setRecordState(false)
                document.querySelector('#recordButton').innerHTML = '开始录制'
                this.model.setRecordData('tracks', [])
                this.model.setRecordData('stickers', [])
                this.model.setRecordPauseTime(null)
                window.eventHub.emit('updatedOperationLog', '重新录制')
            })
            //
            window.eventHub.on('createStickerAndBindEvent', data => {
                this.createStickerAndBindEvent(data.html, data.id, data.url)
            })
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
                if (e.x < canvasRect.x || e.x > canvasRect.x + canvasRect.width || e.y < canvasRect.y || e.y > canvasRect.y + canvasRect.height)
                    this.model.setStrokeState(false)
                else {
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
                            this.eraseReact(newPosition, 15)
                        }
                    }
                }
            }
        },
        listenCanvasOnmouseup() {
            this.getCanvasElement().onmouseup = e => {
                // 打印 log
                if (this.model.getStrokeState()) {
                    let log
                    if (this.model.getDrawingBoardData().pointer === 'pen') log = `用 ${this.model.getDrawingBoardData().color} pen 画了一笔`
                    if (this.model.getDrawingBoardData().pointer === 'eraser') log = `用 eraser 擦了一笔`
                    window.eventHub.emit('updatedOperationLog', log)

                }

                this.model.setStrokeState(false)
                // 记录当前笔画
                if (this.model.getRecordState()){
                    let tracks =  this.model.getRecordData().tracks
                    tracks.push(this.model.getStroke())
                    this.model.setRecordData('tracks', tracks)
                    this.model.setStroke([])
                }
            }
        },
        createSticker(html, id, position) {
            let canvasWrapper = document.querySelector('#canvas-wrapper')

            let stickerItem = document.createElement('div')
            stickerItem.insertAdjacentHTML('beforeend', html)
            stickerItem.setAttribute('class', 'stickers-item')
            stickerItem.setAttribute('id', id)

            stickerItem.style.left =  position.x + 'px'
            stickerItem.style.top =  position.y + 'px'

            canvasWrapper.append(stickerItem)
        },
        createStickerAndBindEvent(html, id, url) {

            let canvasWrapper = document.querySelector('#canvas-wrapper')

            let stickerItem = document.createElement('div')
            stickerItem.insertAdjacentHTML('beforeend', html)
            stickerItem.setAttribute('class', 'stickers-item unplaced')

            let placeButton = document.createElement('div')
            placeButton.setAttribute('class', 'placeButton')
            placeButton.innerText = 'V'

            stickerItem.append(placeButton)
            canvasWrapper.append(stickerItem)

            let pointerX,  pointerY
            let state = false
            placeButton.onclick = e => {
                state = false
                if (this.model.getRecordState()){
                    let stickers = this.model.getRecordData().stickers
                    stickers.push({
                        time: new Date().getTime() - this.model.getRecordStartTime(),
                        url: url,
                        type: '',
                        id: id,
                        html: html,
                        position: {
                            x: stickerItem.offsetLeft,
                            y: stickerItem.offsetTop
                        }
                    })
                    this.model.setRecordData('stickers', stickers)
                }
                placeButton.remove()
                stickerItem.classList.remove('unplaced')
                stickerItem.onmousedown = e => {}

                window.eventHub.emit('updatedOperationLog', `在 x: ${stickerItem.offsetLeft}, y: ${stickerItem.offsetTop} 处放置 id 为 ${id} 的贴图`)
            }
            stickerItem.onmousedown = e => {
                this.model.setStrokeState(false)
                state = true
                pointerX = e.clientX
                pointerY = e.clientY
                document.querySelector('body').onmousemove = e => {
                    if ( stickerItem.offsetLeft < 0 || stickerItem.offsetTop < 0 || (stickerItem.offsetLeft + stickerItem.offsetWidth) > canvasWrapper.clientWidth || (stickerItem.offsetTop + stickerItem.offsetWidth) > canvasWrapper.clientHeight ) {
                        state = false
                        if (stickerItem.offsetTop < 0) stickerItem.style.top = '0px'
                        if (stickerItem.offsetLeft < 0) stickerItem.style.left = '0px'
                        if (stickerItem.offsetLeft > canvasWrapper.clientWidth - stickerItem.offsetWidth) stickerItem.style.left = canvasWrapper.clientWidth - stickerItem.offsetWidth + 'px'
                        if (stickerItem.offsetTop  > canvasWrapper.clientHeight - stickerItem.offsetHeight) stickerItem.style.top = canvasWrapper.clientHeight - stickerItem.offsetHeight + 'px'
                    }
                    else {
                        e.preventDefault()
                        if (state){
                            let dX =  e.clientX - pointerX
                            let dY =  e.clientY - pointerY
                            stickerItem.style.left =  stickerItem.offsetLeft + dX + 'px'
                            stickerItem.style.top =  stickerItem.offsetTop + dY + 'px'
                            pointerX = e.clientX
                            pointerY = e.clientY
                        }
                    }
                }
            }
            stickerItem.onmouseup = e => {
                state = false
            }
        },
        startRecord() {
            this.model.setRecordState(true)
            document.querySelector('#recordButton').innerHTML = '暂停录制'
            if (this.model.getRecordPauseTime()) {
                this.model.setRecordStartTime(new Date().getTime() - this.model.getRecordPauseTime() + this.model.getRecordStartTime())
            }else {
                this.model.setRecordStartTime(new Date().getTime())
            }
            window.eventHub.emit('updatedOperationLog', '开始录制')
        },
        pauseRecord() {
            this.model.setRecordState(false)
            document.querySelector('#recordButton').innerHTML = '开始录制'
            this.model.setRecordPauseTime(new Date().getTime())
            window.eventHub.emit('updatedOperationLog', '暂停录制')
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
        eraseReact(position, radius) {
            this.canvasContext.clearRect(position.x, position.y, radius, radius)
        },
        getCanvasElement() {
            return document.querySelector('#canvas')
        },
        getCanvasContext(width, height, backgroundUrl) {
            const canvas = this.getCanvasElement()
            canvas.width = width
            canvas.height = height
            canvas.style.backgroundImage = backgroundUrl
            return canvas.getContext('2d')
        }
    }
    model.init()
    controller.init(view,model)
}
