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

    var touchQueue = [];

    var hiddenCanvasUID = 0;

    var hiddenCanvas = _.template(
        '<canvas id=hidden-canvas-<%= id %> width=<%= width %> height=<%= height %>' +
            ' style="display: none;"></canvas>'
    );

    var HEADER_HEIGHT;
    var DEVICE_PIXEL_RATIO = 1.325;  // device pixel to css pixel ratio on a nexus 7
    //var DEVICE_PIXEL_RATIO = .1;  // device pixel to css pixel ratio on a nexus 7
    var PORTRAIT = [603, 796];  // CSS pixels available in portrait  mode in chrome on a nexus 7
    var LANDSCAPE = [965, 443]; // CSS pixels available in landscape mode in chrome on a nexus 7

    var pages = [];
    var iPage;

    function init() {
        var orientation;
        var $canvas;
        var ctx;

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
            success: bindEvents,
            error: function () {
                console.log('ERROR in ajax get call to /data/canvas');
                console.log(arguments);
            }
        });
    }

    function bindEvents(results, resultEventType, event) {
        var size, orientation, result;

        // set change and keyup events on the color and line width inputs
        //$('#color').on('change keyup', changeColor);
        $('#line-width').on('change keyup', changeLineWidth);

        $('#next').on(downEventStr, function() { changePage(iPage + 1); });
        $('#prev').on(downEventStr, function() { changePage(iPage - 1); });
        $('#save').on(downEventStr, save);

        $('.color').colorpicker().on('changeColor', changeColor);
        

        // grab the canvas from the dom, note it is jQuery wrapped
        $canvas = $('#c0');

        // get the drawing context from the canvas
        ctx = $canvas[0].getContext('2d');

        iPage = 0;
        if (results.length === 0) {  // if no stored canvases for this user

            orientation = getOrientation();
            size = getCanvasSize(orientation);

            pages[iPage] = {
                $canvas: $canvas, // see note 1 at top
                ctx: ctx,
                size: size,
                orientation: orientation,
                clean: true,
                scale: undefined            // scale set in onResize / scaleCanvas
            };
        } else {
            // if there are stored canvases for the user, initialize them
            for (var i = 0; i < results.length; i++) {
                result = results[i];
                if (!result.orientation) {
                    result.orientation = 'portrait';
                }
                size = getCanvasSize(result.orientation);

                pages[i] = {
                    $canvas: $canvas, // see note 1 at top
                    ctx: ctx,
                    size: size,
                    orientation: result.orientation,
                    data: result.data,
                    id: result.id,
                    clean: false,
                    scale: undefined            // scale set in onResize / scaleCanvas
                };
            }
            changePage(results.length - 1, true);
        }

        resetCanvas();

        // detect user touch/mouse events
        console.log('binding ondown to ' + downEventStr);
        $(document).on(downEventStr, onDown);
        //$(document).on(moveEventStr, onMove);
        //$(document).on(upEventStr,   onUp);

        $(window).on('resize', onResize);    // detect resize events
        onResize();                          // call resize to initialize some values

        $(window).on(leaveEventStr, onLeave);

        //$(window).on('unload beforeunload', save);

        if (DEBUG) {
            debugLogs();
        }

        requestAnimationFrame(render);       // render the first frame, starting a chain of renders
    }

    function getCanvasSize(orientation) {
        console.log('getCanvasSize(' + orientation + ')');
        var size = [];
        // set the canvas size based on the orientation
        if (orientation === 'portrait') {
            size[0] = PORTRAIT[0] * DEVICE_PIXEL_RATIO;
            size[1] = (PORTRAIT[1] - HEADER_HEIGHT) * DEVICE_PIXEL_RATIO;
        } else if (orientation === 'landscape') {
            size[0] = LANDSCAPE[0] * DEVICE_PIXEL_RATIO;
            size[1] = (LANDSCAPE[1] - HEADER_HEIGHT) * DEVICE_PIXEL_RATIO;
        } else {
            console.log('ERROR: you have spelled something wrong');
            return [];
        }
        return size;
    }

    function changePage(i, noSave) {
        if (i < 0 || i > pages.length || i === iPage ||
            (pages[iPage].clean === true && i === pages.length)) {
            return;
        }
        console.log('changing page to page # ' + (i + 1));

        var page = pages[iPage];

        if (!noSave) {
            page.data = page.$canvas[0].toDataURL();
        }
        if (i === pages.length) {
            // HACK since we are only using one canvas, might as well be
            // a global var, so take the one and only canvas and ctx vars from pages[0]
            var orientation = getOrientation();
            pages[i] = {
                $canvas: pages[0].$canvas,
                ctx: pages[0].ctx,
                size: getCanvasSize(orientation),
                orientation: orientation,
                clean: true
            };
        }

        page = pages[i];

        resetCanvas(page);
        sizeCanvas(page);

        if (page.data) {
            console.log('canvas has some page data, drawing it');
            var img = new Image();
            $(img).on('load', function () {
                page.ctx.drawImage(img, 0, 0);
            });
            img.src = page.data;
        }

        iPage = i;
        updatePageNum();
    }

    function updatePageNum() {
        $('#page-number')[0].innerHTML = iPage + 1;
    }

    function save() {
        var page, i, saveData;

        $('#save').enable(false);
        setTimeout(checkSaved, 500);

        page = pages[iPage];
        page.data = page.$canvas[0].toDataURL();

        for (i = 0; i < pages.length; i++) {
            console.log('beginning save of page ' + i);
            page = pages[i];
            if (page.clean === true) {
                console.log('this page is clean, continuing to the next');
                continue;
            }

            saveData = JSON.stringify({
                data: page.data,
                orientation: page.orientation
            });

            page.locked = true;  // lock the page so it cannot be saved twice
                                 // page is unlocked on ajax callback

            if (page.id !== undefined) { // if this page had been loaded from server before
                console.log('page has an id, doing a put to page.id = ' + page.id);
                $.ajax({
                    type: 'PUT',
                    url: '/data/canvas/' + page.id,
                    data: saveData,
                    error: onError.curry(i),
                    success: onPutSuccess.curry(i)
                });
            } else {
                console.log('page id is undefined, posting...');
                $.ajax({
                    type: 'POST',
                    url: '/data/canvas',
                    data: saveData,
                    error: onError.curry(i),
                    success: onPostSuccess.curry(i)
                });
            }
        }
    }

    function checkSaved() {
        var allSaved = true;
        for (var i = 0; i < pages.length; i++) {
            if (pages[i].locked === true) {
                allSaved = false;
            }
        }
        if (allSaved === true) {
            $('#save').enable(true);
        } else {
            setTimeout(checkSaved, 500);
        }
    }

    function onError(i) {
        pages[i].locked = false;
        console.log('PUT/POST error arguments:', arguments);
    }

    function onPutSuccess(i, savedData) {
        pages[i].locked = false;
    }

    function onPostSuccess(i, savedData) {
        pages[i].locked = false;
        // set the model id given back from the server, so a PUT is used next time it is saved
        pages[i].id = savedData.id;
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
        var canvas, ctx, size;
        if (page === undefined) {
            page = pages[iPage];
        }
        canvas = page.$canvas[0];
        ctx = page.ctx;
        size = page.size;

        canvas.width = size[0];
        canvas.height = size[1];
        ctx.fillStyle = '#ddd';
        ctx.fillRect(0, 0, size[0], size[1]);

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
        page.$canvas.css({
            'margin-top': marginTop,
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
        console.log('binding move up and leave to ' + moveEventStr.slice(0,5));
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

    function getOrientation() {
        // If media queries supported, use them to determine orientation and get out
        if (window.matchMedia) {
            var mql = window.matchMedia("(orientation: portrait)");
            if (mql.matches) {
                return 'portrait';
            } else {
                return 'landscape';
            }
        }
        // Media queries not supported, just use window size
        if (window.innerWidth > window.innerHeight) {
            return 'landscape';
        } else {
            return 'portrait';
        }
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
                  window.devicePixelRatio + ', ' + $canvas.css('width') + ', ' + $canvas.css('height') +
                  ', ' + HEADER_HEIGHT + ', ' + $canvas[0].offsetTop);
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
                  window.devicePixelRatio + ', ' + $canvas.css('width') + ', ' + $canvas.css('height') +
                  ', ' + HEADER_HEIGHT + ', ' + $canvas[0].offsetTop);
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

