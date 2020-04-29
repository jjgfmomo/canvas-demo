{
    let view = {
        el: '#operations',
        template: `
            <button id="recordButton">开始录制</button>
            <button id="finishButton">结束录制</button>
            <button id="re-recordButton">重新录制</button>
            <button id="clearButton">清屏</button>
            <button id="playButton">播放</button>
        `,
        render() {
            document.querySelector(this.el).innerHTML = this.template
        }
    }
    let model = {
        data: {}
    }
    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render()
            this.addListener()
        },
        addListener() {
            this.listenElementAndEmitEvent('#recordButton', 'switchRecordState')
            this.listenElementAndEmitEvent('#clearButton', 'clearCanvas')
            this.listenElementAndEmitEvent('#finishButton', 'finishRecord')
            this.listenElementAndEmitEvent('#playButton', 'play')
            this.listenElementAndEmitEvent('#re-recordButton', 're-record')
        },
        // 监听 selector 元素点击事件 => 触发 event 事件
        listenElementAndEmitEvent(selector, event) {
            document.querySelector(selector).onclick = e => {
                window.eventHub.emit(event)
            }
        }

    }
    controller.init(view,model)
}