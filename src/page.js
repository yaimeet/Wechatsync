console.log('page.js', ReaderArticleFinderJS)
function initPageFetch(isForceShow) {
  if ($('#syncd-pannel').length == 0)
    $('body').append(`
<div id="syncd-pannel" style="background:#111;position: fixed;
user-select: none;
bottom: 30px;
right: 12px;
left: initial;
width: 306px;
height: 45px;
border: 0px;
z-index: 2147483646;
clip: auto;
color: white;
font-size: 14px;
display: none;">
<div>
  <div style="position: absolute;
  left: 10px;
  width: 240px;
  height: 20px;
  line-height: 20px;
  text-align:left;
  overflow: hidden;
  cursor: pointer;
  top: 12px;" id="syncd-title">正在查找文章...</div>
  <div id="closebtn" style="position: absolute;
  cursor: pointer;
  right: 10px;
  top: 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#f4f4f4" xmlns:xlink="http://www.w3.org/1999/xlink">
  <path d="M5.69999 5L5 5.70004L11.3 12.0001L5 18.3L5.69999 19L12 12.7L18.3 19L19 18.3L12.7 12.0001L19 5.70004L18.3 5.00012L12 11.3L5.69999 5Z"></path>
</svg></div>
</div>
</div>
`)

  $('#closebtn').click(function () {
    $('#syncd-pannel').remove()
  })

  var READER_VIEW_PAGE_SRC = chrome.runtime.getURL('view.html')
  var isChrome = navigator.userAgent.match(/Chrome\/(\d+)/),
    ChromeVersion = (isChrome && parseInt(isChrome[1], 10)) || 0

  var isInDom = $('.wechatsync-viewer').length
  if (!isInDom) {
    console.log('add viwer')
    var widgetDom = document.createElement('div'),
      widgetRoot = widgetDom.createShadowRoot
        ? widgetDom.createShadowRoot()
        : widgetDom.webkitCreateShadowRoot
        ? widgetDom.webkitCreateShadowRoot()
        : widgetDom
    var widgetWrap = document.createElement(
        ChromeVersion >= 37 ? 'dialog' : 'div'
      ),
      $widgetPage = $(
        '<iframe src="' +
          READER_VIEW_PAGE_SRC +
          '" name="' +
          window.location.href +
          '"></iframe>'
      )

    $widgetPage.css({
      width: '100%',
      height: '100%',
      border: 'none',
    })

    $(widgetWrap)
      .css({
        position: 'fixed',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        background: 'rgb(251, 251, 251)',
        zIndex: '2147483647',
        display: 'block',
        padding: 0,
        border: 'none',
        margin: 0,
      })
      .append($widgetPage)

    var widgetDomMain = $(widgetWrap)
    widgetDomMain.css('display', 'none')
    $(widgetRoot).append($(widgetWrap))
    $('body').append(widgetDomMain)

    $(widgetWrap).addClass('wechatsync-viewer')
  } else {
    var widgetDomMain = $('.wechatsync-viewer')
    var $widgetPage = $('.wechatsync-viewer iframe')
  }

  function showArticle() {
    adoptableArticle()
    widgetDomMain.css('display', 'block')
    $widgetPage[0].contentWindow.postMessage(
      JSON.stringify({ method: 'openPannel' }),
      '*'
    )
  }

  $('#syncd-title').click(function () {
    // $("#syncd-pannel").remove();
    showArticle()
  })

  function adoptableArticle() {
    var $article = $(ReaderArticleFinderJS.adoptableArticle().outerHTML)
    /*补全绝对路径链接*/
    $article.find('a').each(function (idx, a) {
      a.setAttribute('href', a.href)
      if (a.target == '' || a.target.toLowerCase() == '_self') {
        a.setAttribute('target', '_top')
      }
    })
    $article.find('img').each(function (idx, img) {
      console.log('img.src', img.src, img)
      img.setAttribute('src', img.src)
      var imageSrc = img.getAttribute('src')
      if (!imageSrc) {
        if (img.getAttribute('data-actualsrc') != null) {
          img.setAttribute('src', img.getAttribute('data-actualsrc'))
        }
        if (img.getAttribute('_src') != null) {
          console.log('use _src')
          img.setAttribute('src', img.getAttribute('_src'))
        }
      } else {
        if (imageSrc.indexOf('data:image/svg+xml') > -1) {
          if (img.getAttribute('data-actualsrc') != null) {
            img.setAttribute('src', img.getAttribute('data-actualsrc'))
          }
        }
      }
      console.log('after', img)
    })

    function getImageUrl(node) {
      if (!node) return null
      var link = node.src
      var $node = $(node)
      if ($node.attr('data-src')) {
        link = $node.attr('data-src')
      }
      if (link.indexOf('data:image') > -1) link = null
      return link
    }

    var pageData = {
      article: $article[0].outerHTML,
      url: window.location.href,
      leadingImage: getImageUrl(ReaderArticleFinderJS.leadingImage),
      mainImage: getImageUrl(ReaderArticleFinderJS.mainImageNode()),
      pageNumber: ReaderArticleFinderJS.pageNumber,
      description: ReaderArticleFinderJS.pageDescription(),
      nextPage: ReaderArticleFinderJS.nextPageURL(),
      title: ReaderArticleFinderJS.articleTitle(),
      rtl: !ReaderArticleFinderJS.articleIsLTR(),
    }

    console.log(
      '',
      $widgetPage,
      $widgetPage[0],
      ReaderArticleFinderJS.adoptableArticle(),
      pageData
    )
    $widgetPage[0].contentWindow.postMessage(JSON.stringify(pageData), '*')
  }

  function findAndShow(timeout, found) {
    var count = 0
    var tid = setInterval(function () {
      if (count > 20) {
        timeout && timeout()
        return clearInterval(tid)
      }
      if (ReaderArticleFinderJS.isReaderModeAvailable()) {
        clearInterval(tid)
        found && found()
      }
      count++
    }, 1000)
  }

  if (isForceShow) {
    if (ReaderArticleFinderJS.isReaderModeAvailable()) {
      // showArticle();
      findAndShow(
        function () {},
        function () {
          showArticle()
        }
      )
    } else {
      alert('无法识别到文章')
    }
  } else {
    $('#syncd-pannel').show()
    findAndShow(
      function () {
        $('#syncd-title').html('未找到')
        setTimeout(function () {
          $('#syncd-pannel').remove()
        }, 2000)
      },
      function () {
        $('#syncd-title').html(ReaderArticleFinderJS.articleTitle())
      }
    )
  }

  window.addEventListener('message', function (evt) {
    try {
      var data = JSON.parse(evt.data)
      if (data.method == 'closeMe') {
        widgetDomMain.css('display', 'none')
      }
    } catch (e) {}
  })

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponseA
  ) {
    console.log('page.js revice', request)
    $widgetPage[0].contentWindow.postMessage(JSON.stringify(request), '*')
  })
}

var isEditorPage =
  window.location.href.indexOf('mp.weixin.qq.com/cgi-bin/appmsg') > -1

if (!isEditorPage) {
  // initPageFetch();
} else {
  window.addEventListener('message', function (evt) {
    try {
      var data = JSON.parse(evt.data)
      if (data.method == 'GoTemplateCenter') {
        // chrome.tabs.create({
        //   url: chrome.runtime.getURL("editor.html")
        // });
        window.open(chrome.runtime.getURL('templates.html'))
      }
    } catch (e) {
      console.log('page listner', e)
    }
  })
}

var methodManager = {
  fetchArticle: function (request, sender, sendResponse) {
    initPageFetch(true)
  },
}

chrome.extension.onRequest.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.method) {
    methodManager[request.method](request, sender, sendResponse)
  }
})
