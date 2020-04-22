{
    let view = {
        el: '#stickers',
        template: `
            <div class="stickers-navigation">
                <div class="navigation-item" id="static">静态图</div>
                <div class="navigation-item" id="dynamic">动态图</div>
                <div class="navigation-item" id="strokes">笔画图</div>
                <div class="navigation-item" id="video">视频</div>
            </div>
            <div class="static stickers-show">
                <img id="star" src="./heart.png" alt="" width="60px" height="60px">
                <img id="star1" src="./star.png" alt="" width="60px" height="60px">
            </div>
            <div class="dynamic stickers-show">
                <img id="star1" src="./2.gif" alt="" width="60px" height="60px">
            </div>
            <div class="strokes stickers-show">
                <img id="star" src="./heart.png" alt="" width="60px" height="60px">
                <img id="star1" src="./2.gif" alt="" width="60px" height="60px">
                <img id="star1" src="./star.png" alt="" width="60px" height="60px">
            </div>
            <div class="video stickers-show">
                <div class="videoTest" style="width:60px;height=60px;line-height: 60px;text-align: center;font-size: 35px;background-color: hotpink;">话</div>
            </div>
`,
        render(data) {
            let html =  this.template
            html = html.replace(data.currentNav + ' stickers-show', data.currentNav)
            document.querySelector(this.el).innerHTML = html
        }
    }
    let model = {
        data: {
            navLists: ['static', 'dynamic', 'strokes', 'video'],
            currentNav: 'static',
            videoLists: './vvv.mp4'
        }
    }
    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.data)
            this.test()
            this.listenNavSelect()
            this.videoTest()
        },
        test() {
            let star = document.querySelector('#star')
            const canvas = document.querySelector('#canvas-wrapper')
            let pointerX, pointerY
            let state = false
            star.onclick = e => {
                e.preventDefault()
                let newNode = star.cloneNode(true)
                newNode.style.position = 'absolute'
                canvas.appendChild(newNode)
                newNode.onmousedown = e => {
                    pointerX = e.clientX
                    pointerY = e.clientY
                    state = true
                }
                canvas.onmousemove = e => {
                    e.preventDefault()
                    if (newNode.offsetLeft >= 0 && newNode.offsetTop >= 0 && (newNode.offsetTop + newNode.offsetHeight) <= canvas.offsetHeight && (newNode.offsetLeft + newNode.offsetWidth) <= canvas.offsetWidth) {
                        if (state) {
                            let dX =  e.clientX - pointerX
                            let dY =  e.clientY - pointerY
                            newNode.style.left = newNode.offsetLeft + dX + 'px'
                            newNode.style.top = newNode.offsetTop + dY + 'px'
                            pointerX = e.clientX
                            pointerY = e.clientY
                        }
                    }else {
                        state = false
                        if (newNode.offsetLeft < 0) newNode.style.left = '0px'
                        if (newNode.offsetTop < 0) newNode.style.top = '0px'
                        if ((newNode.offsetTop + newNode.offsetHeight) > canvas.offsetHeight) newNode.style.top = canvas.offsetHeight - newNode.offsetHeight + 'px'
                        if ((newNode.offsetLeft + newNode.offsetWidth) > canvas.offsetWidth) newNode.style.left = canvas.offsetWidth - newNode.offsetWidth + 'px'
                    }
                }
                newNode.onmouseup = e => {
                    state = false
                }
            }
        },
        listenNavSelect(){
            this.model.data.navLists.map( nav => {
                document.querySelector('#' + nav).onclick = e => {
                    this.model.data.currentNav = nav
                    this.init(this.view,this.model)
                }
            })
        },
        videoTest(){
            const canvas = document.querySelector('#canvas-wrapper')
            const videoTest = document.querySelector('.videoTest')
            const videoHtml = `<video src="./vvv.mp4" id="video111"  autoplay muted width="100px" height="180px"></video>`
            videoTest.onclick = e => {
                canvas.insertAdjacentHTML('beforeend', videoHtml)
                document.querySelector('#video111')
            }
        }
    }
    controller.init(view,model)
}