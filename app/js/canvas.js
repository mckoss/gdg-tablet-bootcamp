/*
  Bobby Seidensticker
  9/21/2012

  Notebook application using HTML5 Canvas

  Note 1: Right now, there is only one html canvas element that displays the data for every single page.
  When the user scrolls
  to a new page, the canvas is saved, cleared, and the new page data (if any) is put in the canvas.
  Every single page object in the array pages has its own $canvas and ctx properties which are
  references to the same canvas and context.  This is just room for expansion if a page transition
  is desired.
*/

namespace.module('gdg.canvas', function (exports, require) {
    require('org.startpad.funcs').patch();

    $(document).ready(function () {
        setTimeout(init, 0);  // let the DOM catch up before calling init
    });

    var DEBUG = false;

    var isTouchDevice;   // boolean

    var fpsAverage = 60;
    var lastTime = new Date().getTime();

    var downEventStr;  // holds name of events for touch or mouse events
    var moveEventStr;
    var upEventStr;
    var leaveEventStr;

    var touchQueue = [];

    var HEADER_HEIGHT;

    var pages = [];
    var iPage;

    var $globalCanvas;
    var globalCtx;

    var offline = false;

    function init() {

        isTouchDevice = Modernizr.touch;

        downEventStr  = isTouchDevice ? 'touchstart'  : 'mousedown';
        moveEventStr  = isTouchDevice ? 'touchmove'   : 'mousemove';
        upEventStr    = isTouchDevice ? 'touchend'    : 'mouseup';
        leaveEventStr = isTouchDevice ? 'touchcancel' : 'mouseleave';

        if (isTouchDevice) {
            $(document).on('touchmove', function (event) {
                event.preventDefault();
            });
        }
        // get the height of the toolbar
        HEADER_HEIGHT = parseInt($('#control').css('height'), 10);

        $.ajax({
            url: '/data/canvas',
            error: bindEvents,
            success: bindEvents
        });
    }

    function bindEvents(results, message) {
        var result;

        if (message === 'error') {
            results = [];
            setOffline(true);
        }

        // set change and keyup events on the color and line width inputs
        //$('#color').on('change keyup', changeColor);
        $('#line-width').on('change keyup', changeLineWidth);

        $('#next').on(downEventStr, function() {
            changePage({ i: iPage + 1, save: true });
        });
        $('#prev').on(downEventStr, function() {
            changePage({ i: iPage - 1, save: true });
        });

        $('.color').colorpicker().on('changeColor', changeColor);

        // grab the canvas from the dom, note it is jQuery wrapped
        $globalCanvas = $('#main');

        // get the drawing context from the canvas
        globalCtx = $globalCanvas[0].getContext('2d');

        iPage = 0;
        if (results.length === 0) {  // if no stored canvases for this user

            pages[iPage] = {
                $canvas: $globalCanvas, // see note 1 at top
                ctx: globalCtx,
                size: getCanvasSize(),
                clean: true,
                empty: true
            };
        } else {
            // if there are stored canvases for the user, initialize them
            for (var i = 0; i < results.length; i++) {
                result = results[i];

                pages[i] = {
                    $canvas: $globalCanvas, // see note 1 at top
                    ctx: globalCtx,
                    size: [result.width, result.height],
                    data: result.data,
                    id: result.id,
                    clean: true,
                    empty: false
                };
            }
            changePage({ i: results.length - 1, save: false, force: true });
        }

        resetCanvas();

        // detect user touch/mouse down events. move,up,leave dynamically added/removed
        $(document).on(downEventStr, onDown);

        $(window).on('resize', onResize);    // detect resize events
        onResize();                          // call resize to initialize some values

        $(window).on(leaveEventStr, onLeave);

        $(window).on('beforeunload', beforeUnload);

        setInterval(poll, 15000);

        if (DEBUG) {
            debugLogs();
        }

        window.scrollTo(0, 1);
        setTimeout(function () {
            window.scrollTo(0, 1);
        }, 0);
        requestAnimationFrame(render);       // render the first frame, starting a chain of renders
    }

    function beforeUnload() {
        if (saveIfDirty() === true) {
            return;
        }
        return "There is unsaved data still on this page.  Stay on this page to save it.";
    }

    function poll() {
        console.log('poll()');
        saveIfDirty();
    }

    function saveIfDirty() {
        var everythingClean = true;
        for (var i = 0; i < pages.length; i++) {
            if (pages[i].clean === false) {
                everythingClean = false;
                savePage(i);
            }
        }
        return everythingClean;
    }

    function getCanvasSize() {
        var size = [],
            pxRatio = window.devicePixelRatio || 1;

        size[0] = Math.floor(window.innerWidth * pxRatio);
        size[1] = Math.floor((window.innerHeight - HEADER_HEIGHT) * pxRatio);

        return size;
    }

    function checkIfAnyDataEqual() {
        for (var i = 0; i < pages.length; i++) {
            for (var j = 0; j < pages.length; j++) {
                if (j === i) {
                    continue;
                }
                if (pages[i].data === pages[j].data) {
                    console.log('data of page ' + i + ' is equal to data of page ' + j);
                }
            }
        }
    }

    function changePage(args) {
        checkIfAnyDataEqual();
        var i = args.i,
                save = args.save,
                force = args.force;

        console.log('changing page to page i = ' + i);

        var page = pages[iPage];

        if (save) {
            saveIfDirty();
        }

        // if not forcing, check to see if this changePage is unnecessary/unwanted
        if (!force) {
            if (i < 0 || i > pages.length ||
                (pages[iPage].empty === true && i === pages.length)) {
                console.log('returning out of changePage early');
                return;
            }
        }

        console.log('actually changing the page');

        if (i === pages.length) {
            // HACK since we are only using one canvas, might as well be
            // a global var, so take the one and only canvas and ctx vars from pages[0]
            pages[i] = {
                $canvas: $globalCanvas,
                ctx: globalCtx,
                size: getCanvasSize(),
                clean: true,
                empty: true
            };
        }

        page = pages[i];

        resetCanvas(page);
        sizeCanvas(page);

        if (page.data) {
            console.log('canvas with i = ' + i + ' has some page data, drawing it');
            var img = new Image();
            $(img).on('load', function () {
                page.ctx.drawImage(img, 0, 0);
            });
            img.src = page.data;
        }

        iPage = i;
        updatePageNum();
    }

    function savePage(i) {
        console.log('saving page ' + i);

        var page = pages[i];
        if (!page) {
            console.log('ERROR: savePage(' + i + '), pages[' + i + '] is undefined');
            return;
        }
        if (page.clean === true) {
            console.log('page i = ' + i + ' is clean so it is not being saved');
            return;
        }

        page.data = page.$canvas[0].toDataURL();

        var saveData = JSON.stringify({
            data: page.data,
            width: page.size[0],
            height: page.size[1]
        });

        page.locked = true;  // lock the page so it cannot be saved twice
                             // page is unlocked on ajax callback

        if (page.id !== undefined) { // if this page had been loaded from server before
            console.log('page has an id, doing a put to page.id = ' + page.id);
            console.log('sending a PUT out for page i = ' + i);
            $.ajax({
                type: 'PUT',
                url: '/data/canvas/' + page.id,
                data: saveData,
                error: onError.curry(i),
                success: onPutSuccess.curry(i)
            });
        } else {
            console.log('page id is undefined, posting...');
            console.log('sending a POST out for page i = ' + i);
            $.ajax({
                type: 'POST',
                url: '/data/canvas',
                data: saveData,
                error: onError.curry(i),
                success: onPostSuccess.curry(i)
            });
        }
        pages[i].clean = true;
    }

    function updatePageNum() {
        $('#page-number')[0].innerHTML = iPage + 1;
    }

    function onError(i) {
        pages[i].locked = false;
        pages[i].clean = false;
        setOffline(true);
        console.log('Unable to save page number ' + i + '. Please try again later');
        console.log('PUT/POST error arguments:', arguments);
    }

    function onPutSuccess(i, savedData) {
        console.log('PUT success i = ' + i);
        pages[i].locked = false;
        setOffline(false);
    }

    function onPostSuccess(i, savedData) {
        console.log('POST success i = ' + i);
        pages[i].locked = false;
        // set the model id given back from the server, so a PUT is used next time it is saved
        pages[i].id = savedData.id;
        setOffline(false);
    }

    function setOffline(which) {
        if (which) {
            offline = true;
            $('body').addClass('offline');
        } else {
            offline = false;
            $('body').removeClass('offline');
        }
    }

    function changeColor(event) {
        var rbg, color;
        rgb = event.color.toRGB();
        color = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
        pages[iPage].ctx.strokeStyle = color;
    }

    function changeLineWidth() {
        pages[iPage].ctx.lineWidth = parseFloat($(this).val());
    }

    function onResize() {
        var page = pages[iPage];
        sizeCanvas(page);
    }

    function resetCanvas(page) {
        if (page === undefined) {
            page = pages[iPage];
        }
        var canvas = page.$canvas[0],
            ctx = page.ctx,
            size = page.size;

        canvas.width = size[0];
        canvas.height = size[1];

        // set the canvas line width and stroke style
        ctx.lineWidth = $('#line-width').val();
        ctx.strokeStyle = '#' + $('#color').val();
    }

    function sizeCanvas(page) {
        var size = page.size;
        var space = [window.innerWidth, window.innerHeight - HEADER_HEIGHT];
        var marginTop = 0;

        // if the window is more landscape than the canvas is, vertical letterboxes
        if (space[0] / space[1] > size[0] / size[1]) {
            // margin auto on left and right will center it
            scale = space[1] / size[1];
        } else {
            // horizontal letterboxes
            // set margin top so it will be centered
            scale = space[0] / size[0];
            marginTop = (space[1] - size[1] * scale) / 2;
        }
        $('#canvas-holder').css({
            'margin-top': marginTop,
            'margin-bottom': marginTop + 100,
            'width': size[0] * scale,
            'height': size[1] * scale
        });
        page.scale = scale;
    }

    function render(time) {
        var touch, x, y;
        var ctx = pages[iPage].ctx;
        var scale = pages[iPage].scale;

        $('#fps').empty().append(getFps(time, lastTime));
        lastTime = time;

        if (touchQueue.length === 0) {
            requestAnimationFrame(render);
            return;
        }

        while (touchQueue.length > 0) {
            touch = touchQueue.shift();
            x = touch.x / scale;
            y = touch.y / scale;

            if (pages[iPage].clean === true) {
                pages[iPage].clean = false;
                pages[iPage].empty = false;
            }

            if (touch.type === 'down') {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineTo(x, y + 0.001);
                ctx.stroke();
            } else {
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        }
        if (touch.type !== 'up') {
            touch.type = 'down';
            touchQueue.push(touch);
        }

        requestAnimationFrame(render);
    }

    function onDown(event) {
        if (event.target.nodeName !== 'CANVAS') {
            return;
        }
        $(document).on(moveEventStr, onMove);
        $(document).on(upEventStr, onUp);
        $(document).on(leaveEventStr, onLeave);

        event.preventDefault();
        enqueueTouch('down', event);
    }

    function onMove(event) {
        event.preventDefault();
        enqueueTouch('move', event);
    }

    function onUp(event) {
        onLeave();
        enqueueTouch('up', event);
    }

    function onLeave() {
        $(document).off(moveEventStr, onMove);
        $(document).off(upEventStr, onUp);
        $(document).off(leaveEventStr, onLeave);
    }

    function enqueueTouch(type, event) {
        var canvas = pages[iPage].$canvas[0];
        exposeTouchEvent(event);
        touchQueue.push({
            type: type,
            x: event.pageX - canvas.offsetLeft,
            y: event.pageY - canvas.offsetTop
        });
    }

    // Calculate approximate frames per second based on time between raf calls
    // takes a digits integer to indicate level of truncation
    function getFps(time, lastTime) {
        fpsAverage = 1000 / (time - lastTime) * 0.03 + fpsAverage * 0.97;
        return Math.round(fpsAverage);
    }


    // if is a touch event, expose the real touch event (to get at pageX/Y)
    function exposeTouchEvent(e) {
        if (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length > 0) {
            $.extend(e, e.originalEvent.touches[0]);
        }
    }

    function debugLogs() {
        setTimeout(function () {
            alert('[' + window.innerWidth + ', ' + window.innerHeight + '], pixelRatio:' +
                  window.devicePixelRatio + ', ' + $globalCanvas.css('width') + ', ' + $globalCanvas.css('height') +
                  ', ' + HEADER_HEIGHT + ', ' + $globalCanvas[0].offsetTop);
        }, 2000);

        /*var everyMouseTouchEvent = 'mousedown mouseup mouseover mousemove mouseleave ' + 
            'touchstart touchend touchcancel touchleave touchmove';
        $(window).on(everyMouseTouchEvent, function (event) {
            console.log('type: ' + event.type.replace('mouse', '').replace('touch', '') +
            ', target: ' + event.target.nodeName.toLowerCase());
            });*/
        /*
        setTimeout(function () {
            alert('[' + window.innerWidth + ', ' + window.innerHeight + '], pixelRatio:' +
                  window.devicePixelRatio + ', ' + $globalCanvas.css('width') + ', ' + $globalCanvas.css('height') +
                  ', ' + HEADER_HEIGHT + ', ' + $globalCanvas[0].offsetTop);
        }, 3000);
        
        setTimeout(function () {
            var suf = ['top', 'right', 'bottom', 'left'];
            for (var i = 0; i < suf.length; i++) {
                console.log($('#color').css('padding-' + suf[i]))
            }
        }, 3000);
*/
    }

});

(function($) {
    $.fn.extend({
        enable: function (which) {
            this.each(function () {
                if (which === undefined) {
                    this.disabled = !this.disabled;
                } else {
                    this.disabled = !which;
                }
            });
        }
    });
})(jQuery);

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
            || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
    
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
                                       timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

