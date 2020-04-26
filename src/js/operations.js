{
    let view = {
        el: '#operations',
        template: `
            <button id = "recordButton">开始录制</button>
            <button id = "pauseButton">暂停录制</button>
            <button id = "finishButton">完成录制</button>
            <button id = "re-recordButton">重新录制</button>
            <button id = "clearButton">清屏</button>
            <button id = "playButton">播放</button>
        `,
        render(data) {
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
            this.view.render(this.model.data)
            this.addListener()
        },
        addListener() {
            this.listenRecordButtonOnclick()
            this.listenClearButtonOnclick()
            this.listenPlayButtonOnclick()
        },
        listenRecordButtonOnclick() {
            recordButton.onclick = e => {
                window.eventHub.emit('switchRecordState')
            }
        },
        listenClearButtonOnclick() {
            clearButton.onclick = e => {
                window.eventHub.emit('clearCanvas')
            }
        },
        listenPlayButtonOnclick() {
            playButton.onclick = e => {
                window.eventHub.emit('clearCanvas')
                window.eventHub.emit('play')
            }
        },
    }
    controller.init(view,model)
}