

{
    let view = {
        el: '#canvas',
        template: ``,
        render(data){
            document.querySelector(this.el).insertAdjacentHTML('afterbegin',this.template)
        },
        getThisElement() {
          return document.querySelector(this.el)
        },
    }
    let model = {
        data: {
            position: {
                x: undefined,
                y: undefined
            },
            using: false
        },
        convertPosition(canvasRect, position) {
            return {
                x: position.x - canvasRect.x,
                y: position.y - canvasRect.y
            }
        },
        setPosition(position) {
            this.data.position = position
            console.log(this.data.position)
        },
        init() {
        }
    }
    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.data)
            this.canvas = this.initCanvas(this.view.getThisElement())
            this.addListener()
        },
        addListener() {
            document.querySelector('#canvas').onmousedown = e => {
                this.model.data.using = true
                let position = this.model.convertPosition(this.view.getThisElement().getClientRects()[0],{x: e.clientX, y: e.clientY})
                this.model.setPosition(position)
            }
            document.querySelector('#canvas').onmousemove = e => {
                let newPosition = {
                    x: e.clientX,
                    y: e.clientY
                }
                newPosition = this.model.convertPosition(this.view.getThisElement().getClientRects()[0], newPosition)
                if (this.model.data.using){
                    this.drawLine(this.model.data.position, newPosition)
                    this.model.setPosition(newPosition)
                }
            }
            document.querySelector('#canvas').onmouseup = e => {
                this.model.data.using = false
            }
        },
        initCanvas(element) {
            element.width = '540'
            element.height = '770'
            element.style.backgroundImage = `url("./1.JPG")`
            element.style.backgroundSize = 'contain'
            return element.getContext('2d')
        },
        drawLine(start,end){
            this.canvas.beginPath()
            this.canvas.strokeStyle  = 'red'
            this.canvas.moveTo(start.x,start.y)
            this.canvas.lineTo(end.x,end.y)
            this.canvas.lineWidth = 3
            this.canvas.stroke()
            this.canvas.closePath()
        }
    }
    controller.init(view,model)
}
