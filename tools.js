{
    let view = {
        el: '#tools',
        template: `
            <svg class="icon tools-item" aria-hidden="true">
                <use xlink:href="#icon-pencil"></use>
            </svg>
            <svg class="icon tools-item" aria-hidden="true">
                <use xlink:href="#icon-earser"></use>
            </svg>
            <div class="tools-item black"></div>
            <div class="tools-item blue"></div>
            <div class="tools-item red"></div>
            <svg class="icon tools-item" aria-hidden="true">
                <use xlink:href="#icon-back"></use>
            </svg>
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