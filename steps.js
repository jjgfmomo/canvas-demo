{
    let view = {
        el: '#steps',
        template: `STEPS 1`,
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