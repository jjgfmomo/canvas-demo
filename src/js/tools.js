{
    let view = {
        el: '#tools',
        template: `
            工具
            <svg class="icon tools-item pen " aria-hidden="true">
                <use xlink:href="#icon-pencil"></use>
            </svg>
            <svg class="icon tools-item eraser" aria-hidden="true">
                <use xlink:href="#icon-eraser"></use>
            </svg>
            <div class="tools-item color black"></div>
            <div class="tools-item color blue"></div>
            <div class="tools-item color red"></div>
            <div class="tools-item color yellow"></div>
            <svg class="icon tools-item" aria-hidden="true">
                <use xlink:href="#icon-back"></use>
            </svg>
        `,
        render(data) {
            let pointer = data.currentData.pointer
            let color = data.currentData.color
            let html = this.template.replace(pointer,pointer + ' selected').replace(color,color + ' selected')
            document.querySelector(this.el).innerHTML = html
        }
    }
    let model = {
        data: {
            currentData: {
                pointer: 'pen',
                color: 'black',
            },
            pointerLists: ['pen', 'eraser'],
            colorLists: ['black', 'blue', 'red', 'yellow']
        },
        setCurrentData(key,value){
            this.data.currentData[key] = value
        },
        getCurrentData() {
            return this.data.currentData
        }
    }
    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.data)
            this.bindOnclickByLists(this.model.data.pointerLists, 'pointer')
            this.bindOnclickByLists(this.model.data.colorLists, 'color')
            window.eventHub.emit('updateDrawingBoardData', this.model.getCurrentData())
        },
        bindOnclickByLists(lists, type) {
            lists.map(item => {
                document.querySelector('.' + item).onclick = e => {
                    this.model.setCurrentData(type, item)
                    this.init(this.view, this.model)
                }
            })
        }
    }
    controller.init(view,model)
}