{
    let view = {
        el: '#tips',
        template: `
            <div id="operationLog">
                log
                __logData__
            </div>
            <div id="stepHint">提示</div>
        `,
        logTemplate: `
            <div class="logData">__logContent__</div>
        `,
        render(data) {
            let html = this.template
            let logData = ''
            data.logData.map( log => {
                logData += this.logTemplate.replace('__logContent__', log)
            })
            html = html.replace('__logData__', logData)
            document.querySelector(this.el).innerHTML = html
        }
    }
    let model = {
        data: {
            logData: null
        },
        init() {
            this.data.logData = []
        },
        getLogData() {
            return this.data.logData
        },
        setLogData(value) {
            this.data.logData = value
        }
    }
    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.data)
            // 更新 log 数据
            window.eventHub.on('updatedOperationLog', log => {
                const logData = this.model.getLogData()
                logData.push(log)
                this.model.setLogData(logData)
                this.view.render(this.model.data)
                const operationLogElement = document.querySelector('#operationLog')
                operationLogElement.scrollTop = operationLogElement.scrollHeight;
            })
        }
    }
    model.init()
    controller.init(view, model)
}