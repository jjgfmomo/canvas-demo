{
    let view = {
        el: '#stickers',
        template: `
            <div class="stickers-navigation">
                <div class="navigation-item">笔画图</div>
                <div class="navigation-item">静态图</div>
                <div class="navigation-item">动态图</div>
                <div class="navigation-item">视频</div>
            </div>
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