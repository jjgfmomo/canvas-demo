

{
    let view = {
        el: '.canvas-wrapper',
        template: `
            <canvas id="canvas"></canvas>
        `,
        render(data){
            let html = this.template
            document.querySelector(this.el).insertAdjacentHTML('afterbegin',this.template)
        }
    }
    let model = {
        data: {
            position: {
                x: undefined,
                y: undefined
            },
            using: false
        },
        init() {

        }
    }
    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.data)
            this.canvas = this.initCanvas()
            this.addListener()
        },
        addListener() {
            document.querySelector('#canvas').onmousedown = e => {
                this.model.data.using = true
                this.setPosition({x: e.clientX, y: e.clientY})
            }
            document.querySelector('#canvas').onmousemove = e => {
                const newPosition = {
                    x: e.clientX,
                    y: e.clientY
                }
                if (this.model.data.using){
                    this.drawLine(this.canvas, this.model.data.position, this.setPosition(newPosition))
                    this.setPosition(newPosition)
                }
            }
            document.querySelector('#canvas').onmouseup = e => {
                this.model.data.using = false
            }
        },
        initCanvas() {
            const canvas = document.getElementById('canvas')
            const ctx = canvas.getContext('2d')
            canvas.width = '1080'
            canvas.height = '1440'
            canvas.style.backgroundImage = `url("./1.JPG")`
            return ctx
        },
        drawLine(ctx,start,end){
            ctx.beginPath()
            ctx.strokeStyle  = 'red'
            ctx.moveTo(start.x,start.y)
            ctx.lineTo(end.x,end.y)
            ctx.lineWidth = 3
            ctx.stroke()
            ctx.closePath()
        },
        setPosition(position){
            let canvasRect = document.querySelector('#canvas').getClientRects()[0]
            return this.model.data.position = {
                x: position.x - canvasRect.x,
                y: position.y - canvasRect.y
            }
        }
    }
    controller.init(view,model)
}
