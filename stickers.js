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
            this.imageTest()
            this.listenNavSelect()
            this.videoTest()
        },
        imageTest() {
            const star = document.querySelector('#star')
            star.onclick = e => {
                window.eventHub.emit('createStickerAndBindEvent', {
                    html:  ` <img src="./heart.png" alt="" width="60px" height="60px">`,
                    selector: '#canvas-wrapper'
                })
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
            const videoTest = document.querySelector('.videoTest')
            videoTest.onclick = e => {
                e.preventDefault()
                window.eventHub.emit('createStickerAndBindEvent', {
                    html:  `<video src="./vvv.mp4"  id="video111"  autoplay muted width="100px" height="180px"></video>`,
                    selector: '#video-container'
                })
            }
        },

    }
    controller.init(view,model)
}