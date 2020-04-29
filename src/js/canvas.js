{
    let rec

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
            recordData: null,                         // 录制数据
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
        setRecordData(data) { this.data.recordData = data },
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
            this.data.recordData = []
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
                if (!this.model.getRecordData().length) {
                    this.recOpen(this.recStart)
                }
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
                    let recordData = this.model.getRecordData()
                    if (recordData) {
                        window.eventHub.emit('clearCanvas')
                        console.log(recordData)
                        recordData.map(res => {
                            // 绘制 stroke 数据
                            if (res.type === 'stroke') {
                                let previousPosition = res.data[0] ? res.data[0].position : null
                                res.data.map(stroke => {
                                    setTimeout(() => {
                                        this.drawLine(previousPosition, stroke.position, stroke.color)
                                        previousPosition = stroke.position
                                    }, stroke.time)
                                })
                            }
                            // 绘制 text ||  sticker 数据
                            if (res.type === 'text' || res.type === 'sticker') {
                                const data = res.data
                                setTimeout(() => {
                                    console.log(1)
                                    this.createSticker(data.html, data.id, data.position)
                                }, data.time)
                            }
                        })
                        window.eventHub.emit('updatedOperationLog', '播放')
                    } else alert('没有进行录制')
                } else alert('请先结束录制')
            })
            // 结束录制
            window.eventHub.on('finishRecord', () => {
                this.recStop()
                if (this.model.getRecordPauseTime() || this.model.getRecordState()) {
                    document.querySelector('#recordButton').innerHTML = '开始录制'
                    console.log(this.model.getRecordData())
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
                this.model.setRecordData([])
                this.model.setRecordPauseTime(null)
                window.eventHub.emit('updatedOperationLog', '重新录制')
            })
            //
            window.eventHub.on('createStickerAndBindEvent', data => {
                this.createStickerAndBindEvent(data.html, data.id, data.url)
            })
            window.eventHub.on('createText', data => {
                this.model.setStrokeState(false)
                let canvasWrapper = document.querySelector('#canvas-wrapper')
                let stickerItem = document.createElement('div')
                let canvasWrapperRect = canvasWrapper.getClientRects()[0]
                canvasWrapper.onclick = e => {
                    stickerItem.insertAdjacentHTML('beforeend', data.html)
                    stickerItem.setAttribute('class', 'stickers-item')
                    stickerItem.style.left =  e.x - canvasWrapperRect.x + 'px'
                    stickerItem.style.top =  e.y - canvasWrapperRect.y + 'px'
                    canvasWrapper.append(stickerItem)
                    canvasWrapper.onclick = e => {}

                    let textElement = stickerItem.firstChild
                    let value= null

                    textElement.focus()

                    textElement.onblur = e => {
                        value = textElement.value
                        if (this.model.getRecordState()) {
                            let html = data.html.replace('input', `input value = ${value}`)
                            this.model.getRecordData().push({
                                type: 'text',
                                data: {
                                    time: new Date().getTime() - this.model.getRecordStartTime(),
                                    value: value,
                                    position: {
                                        x: stickerItem.offsetLeft,
                                        y: stickerItem.offsetTop
                                    },
                                    id: data.id,
                                    html: html
                                }
                            })
                        }
                        window.eventHub.emit('updatedOperationLog', `在 x: ${stickerItem.offsetLeft}, y: ${stickerItem.offsetTop} 插入 value 为 ${value} 的文本`)
                    }
                }
            })
            // 撤销
            window.eventHub.on('backout',() => {

                const canvas = this.getCanvasElement()
                this.canvasContext.clearRect(0, 0, canvas.width, canvas.height)

                document.querySelectorAll('.stickers-item').forEach(element => {
                    element.remove()
                })

                let recordData = this.model.getRecordData()
                recordData.pop()
                console.log(recordData)
                recordData.map(res => {
                    // 绘制 stroke 数据
                    if (res.type === 'stroke') {
                        let previousPosition = res.data[0] ? res.data[0].position : null
                        res.data.map(stroke => {
                            this.drawLine(previousPosition, stroke.position, stroke.color)
                            previousPosition = stroke.position
                        })
                    }
                    // 绘制 text ||  sticker 数据
                    if (res.type === 'text' || res.type === 'sticker') {
                        const data = res.data
                        this.createSticker(data.html, data.id, data.position)
                    }
                })
            })
        },
        recOpen(success) {
            rec=Recorder({
                type:"mp3",sampleRate:16000,bitRate:16 //mp3格式，指定采样率hz、比特率kbps，其他参数使用默认配置；注意：是数字的参数必须提供数字，不要用字符串；需要使用的type类型，需提前把格式支持文件加载进来，比如使用wav格式需要提前加载wav.js编码引擎
                ,onProcess:function(buffers,powerLevel,bufferDuration,bufferSampleRate,newBufferIdx,asyncEnd){
                    //录音实时回调，大约1秒调用12次本回调
                    //可利用extensions/waveview.js扩展实时绘制波形
                    //可利用extensions/sonic.js扩展实时变速变调，此扩展计算量巨大，onProcess需要返回true开启异步模式
                }
            });

            //var dialog=createDelayDialog(); 我们可以选择性的弹一个对话框：为了防止移动端浏览器存在第三种情况：用户忽略，并且（或者国产系统UC系）浏览器没有任何回调，此处demo省略了弹窗的代码
            rec.open(function(){//打开麦克风授权获得相关资源
                //dialog&&dialog.Cancel(); 如果开启了弹框，此处需要取消
                //rec.start() 此处可以立即开始录音，但不建议这样编写，因为open是一个延迟漫长的操作，通过两次用户操作来分别调用open和start是推荐的最佳流程

                success&&success();
            },function(msg,isUserNotAllow){//用户拒绝未授权或不支持
                //dialog&&dialog.Cancel(); 如果开启了弹框，此处需要取消
                console.log((isUserNotAllow?"UserNotAllow，":"")+"无法录音:"+msg);
            });
        },
        recStart(){//打开了录音后才能进行start、stop调用
            rec.start();
        },
        recStop(){
            rec.stop(function(blob,duration){
                console.log(blob,(window.URL||webkitURL).createObjectURL(blob),"时长:"+duration+"ms");
                rec.close();//释放录音资源，当然可以不释放，后面可以连续调用start；但不释放时系统或浏览器会一直提示在录音，最佳操作是录完就close掉
                rec=null;

                //已经拿到blob文件对象想干嘛就干嘛：立即播放、上传

                /*** 【立即播放例子】 ***/
                var audio=document.createElement("audio");
                audio.controls=true;
                document.body.appendChild(audio);
                //简单利用URL生成播放地址，注意不用了时需要revokeObjectURL，否则霸占内存
                audio.src=(window.URL||webkitURL).createObjectURL(blob);
                audio.play();

            },function(msg){
                console.log("录音失败:"+msg);
                rec.close();//可以通过stop方法的第3个参数来自动调用close
                rec=null;
            });
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
                    let stroke = this.model.getStroke()
                    let newData = {
                        type: 'stroke',
                        data: stroke,
                    }
                    this.model.getRecordData().push(newData)
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
            let canvasWrapperRect = canvasWrapper.getClientRects()[0]
            canvasWrapper.onclick = e => {
                stickerItem.insertAdjacentHTML('beforeend', html)
                stickerItem.setAttribute('class', 'stickers-item')
                stickerItem.style.left =  e.x - canvasWrapperRect.x + 'px'
                stickerItem.style.top =  e.y - canvasWrapperRect.y + 'px'
                canvasWrapper.append(stickerItem)
                canvasWrapper.onclick = e => {}

                if (this.model.getRecordState()) {
                    this.model.getRecordData().push({
                        type: 'sticker',
                        data: {
                            time: new Date().getTime() - this.model.getRecordStartTime(),
                            url: url,
                            position: {
                                x: stickerItem.offsetLeft,
                                y: stickerItem.offsetTop
                            },
                            id: id,
                            html: html
                        }
                    })
                }

                window.eventHub.emit('updatedOperationLog', `在 x: ${stickerItem.offsetLeft}, y: ${stickerItem.offsetTop} 处放置 id 为 ${id} 的贴图`)
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
