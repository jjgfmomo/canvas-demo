{
    let view = {
        el: '#operations',
        template: `
            <button id = "recordButton">开始录制</button>
            <button id = "pauseButton">暂停录制</button>
            <button id = "finishButton">完成录制</button>
            <button id = "re-recordButton">完成录制</button>
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
        }
    }
    controller.init(view,model)
}