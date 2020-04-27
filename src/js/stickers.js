{
    let view = {
        el: '#stickers',
        template: `
            <div class="stickers-navigation">
                __navTitle__ 
            </div>
            __navContent__
        `,
        navTitleTemplate: `
            <div class="navigation-item" id="__navId__">__navName__</div>
        `,
        navContentTemplate: `
            <div class="__navId__ stickers-unshow">__contentItem__</div>
        `,
        imageTemplate: `
            <img id="__itemId__" src="__itemUrl__" class="stickers-image">
        `,
        videoTemplate: `
            <div class="stickers-video" id="__itemId__" >__itemId__</div>
        `,
        render(data) {
            let html =  this.template
            let navTitle = ''
            let navContent = ''
            data.stickerData.map(item => {
                let newTitle = this.navTitleTemplate.replace('__navId__', item.navId).replace('__navName__', item.navName)
                navTitle += newTitle
                let newContentItem = ''
                item.list.map( listItem => {
                    if (item.type === 'image') newContentItem += this.imageTemplate.replace('__itemId__', listItem.id).replace('__itemUrl__', listItem.url)
                    if (item.type === 'video') newContentItem += this.videoTemplate.split('__itemId__').join(listItem.id)
                })
                navContent += this.navContentTemplate.replace('__navId__', item.navId).replace('__contentItem__', newContentItem)
            })
            html = html.replace('__navTitle__', navTitle).replace('__navContent__', navContent).replace(data.currentNav + ' stickers-unshow', data.currentNav)
            document.querySelector(this.el).innerHTML = html
        }
    }
    let model = {
        data: {
            currentNav: 'static',
            stickerData: [
                {
                    navName: '静态图',
                    navId: 'static',
                    type: 'image',
                    list: [
                        {
                            id: 'heart',
                            url: './img/heart.png',
                        },
                        {
                            id: 'star',
                            url: './img/star.png',
                        }
                    ]
                },
                {
                    navName: '动态图',
                    navId: 'dynamic',
                    type: 'image',
                    list: [
                        {
                            id: 'starD',
                            url: './img/star.gif',
                        }
                    ]
                },
                {
                    navName: '视频',
                    navId: 'video',
                    type: 'video',
                    list: [
                        {
                            id: '话',
                            url: './img/话.mp4',
                        }
                    ]
                }
            ]
        },
        setCurrentNav(value) {
            this.data.currentNav = value
        }
    }
    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.data)
            this.listenNavSelect()
        },
        listenNavSelect(){
            this.model.data.stickerData.map( item => {
                document.querySelector('#' + item.navId).onclick = e => {
                    this.model.setCurrentNav(item.navId)
                    this.init(this.view,this.model)
                }
                item.list.map(listItem => {
                    let html
                    if (item.type === 'image') html = `<img src=${listItem.url} width="60px" height="60px">`
                    if (item.type === 'video') html = `<video src=${listItem.url} autoplay muted width="100px" height="180px"></video>`
                    document.querySelector('#' + listItem.id).onclick = e =>{
                        window.eventHub.emit('createStickerAndBindEvent', {
                            html:  html,
                            selector: '#canvas-wrapper'
                        })
                    }
                })
            })
        },
        imageTest() {
            const star = document.querySelector('#star')
            star.onclick = e => {
                window.eventHub.emit('createStickerAndBindEvent', {
                    html:  ` <img src="./img/heart.png" alt="" width="60px" height="60px">`,
                    selector: '#canvas-wrapper'
                })
            }
        },
        videoTest(){
            const videoTest = document.querySelector('.videoTest')
            videoTest.onclick = e => {
                e.preventDefault()
                window.eventHub.emit('createStickerAndBindEvent', {
                    html:  `<video src="./img/话.mp4"  id="video111"  autoplay muted width="100px" height="180px"></video>`,
                    selector: '#canvas-wrapper'
                })
            }
        },

    }
    controller.init(view,model)
}