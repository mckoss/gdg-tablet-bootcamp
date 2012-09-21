namespace.module('gdg.canvas', function (exports, require) {
    require('org.startpad.funcs').patch();

    $(document).ready(function () {
        setTimeout(init, 0);  // let the DOM catch up before calling init
    });

    var isTouchDevice;   // boolean

    var fpsAverage = 60;
    var lastTime = new Date().getTime();

    var downEventStr;  // holds name of events for touch or mouse events
    var moveEventStr;
    var upEventStr;
    var isTouchDown = false;  // boolean, is there a touchdown

    var touchQueue = [];

    var hiddenCanvasUID = 0;

    var hiddenCanvas = _.template(
        '<canvas id=hidden-canvas-<%= id %> width=<%= width %> height=<%= height %>' +
            ' style="display: none;"></canvas>'
    );

    var HEADER_HEIGHT;
    var DEVICE_PIXEL_RATIO = 1.325;  // device pixel to css pixel ratio on a nexus 7
    var PORTRAIT = [603, 796];  // CSS pixels available in portrait  mode in chrome on a nexus 7
    var LANDSCAPE = [965, 443]; // CSS pixels available in landscape mode in chrome on a nexus 7

    var pages = [];
    var iPage;

    function init() {
        var orientation;
        var $canvas;
        var ctx;

        isTouchDevice = Modernizr.touch;

        downEventStr = isTouchDevice ? 'touchstart' : 'mousedown';
        moveEventStr = isTouchDevice ? 'touchmove'  : 'mousemove';
        upEventStr   = isTouchDevice ? 'touchend'   : 'mouseup';

        if (isTouchDevice) {
            // prevent some defaults so the user can't scroll / drag the page
            $(document).on('touchstart', function (event) {
                if (event.target.nodeName !== 'INPUT') {
                    event.preventDefault();
                }
            });
            $(document).on('touchmove', function (event) {
                event.preventDefault();
            });
        }
        // get the height of the toolbar
        HEADER_HEIGHT = parseInt($('#control').css('height'), 10);

        // set change and keyup events on the color and line width inputs
        $('#color').on('change keyup', changeColor);
        $('#line-width').on('change keyup', changeLineWidth);

        // NEXT LINE PROBABLY USELESS
        $('input').on(downEventStr, function () { this.focus(); });

        $('#next').on(downEventStr, function() { changePage(iPage + 1); });
        $('#prev').on(downEventStr, function() { changePage(iPage - 1); });

        // grab the canvas from the dom, note it is jQuery wrapped
        $canvas = $('#c0');

        // get the drawing context from the canvas
        ctx = $canvas[0].getContext('2d');

        // get the device orientation, portrait or landscape
        orientation = getOrientation();

        // set the canvas size based on the orientation
        canvasSize = getCanvasSize(orientation);


        // set the canvas line width and stroke style
        ctx.lineWidth = $('#line-width').val();
        ctx.strokeStyle = '#' + $('#color').val();

        // construct the page object and put it in the array of pages
        iPage = 0;
        pages[iPage] = {
            $canvas: $canvas,
            ctx: ctx,
            size: canvasSize,
            orientation: orientation,
            scale: undefined            // scale set in onResize / scaleCanvas
        };

        resetCanvas();

        // detect user touch/mouse events
        $(document).on(downEventStr, onDown);
        $(document).on(moveEventStr, onMove);
        $(document).on(upEventStr,   onUp);

        $(window).on('resize', onResize);    // detect resize events
        onResize();                          // call resize to initialize some values

        debugLogs();
        requestAnimationFrame(render);       // render the first frame, starting a chain of renders
    }

    function getCanvasSize(orientation) {
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

    function changePage(i) {
        if (i < 0 || i > pages.length || i === iPage) {
            return;
        }

        var page = pages[iPage];

        page.data = page.$canvas[0].toDataURL();
        if (i === pages.length) {
            // HACK since we are only using one canvas, might as well be
            // a global var take canvas and ctx vars from pages[0]
            var orientation = getOrientation();
            pages[i] = {
                $canvas: pages[0].$canvas,
                ctx: pages[0].ctx,
                size: getCanvasSize(orientation),
                orientation: orientation
            };
        }

        page = pages[i];

        resetCanvas(page);
        sizeCanvas(page);

        if (page.data !== undefined) {
            console.log('canvas has some page data, drawing it');
            var img = new Image();
            $(img).on('load', function () {
                page.ctx.drawImage(img, 0, 0);
            });
            img.src = page.data;
        }

        iPage = i;
    }

    function changeColor() {
        var color = '#' + $(this).val();
        pages[iPage].ctx.strokeStyle = color;
        $('#color-demo').css('background-color', color);
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
        page.$canvas[0].width = page.size[0];
        page.$canvas[0].height = page.size[1];
        page.ctx.fillStyle = '#ddd';
        page.ctx.fillRect(0, 0, page.size[0], page.size[1]);
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
        var touch;
        var ctx = pages[iPage].ctx;
        var scale = pages[iPage].scale;

        $('#fps').empty().append(getFps(time, lastTime));

        while (touchQueue.length > 0) {
            touch = touchQueue.shift();
            touch.x /= scale;
            touch.y /= scale;
	    console.log('render, type: ' + touch.type + ' x: ' +
			Math.round(touch.x) + ', ' + Math.round(touch.y));
            if (touch.type === 'down') {
                ctx.beginPath();
                ctx.moveTo(touch.x, touch.y);
                ctx.lineTo(touch.x, touch.y + 0.1);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
            } else if (touch.type === 'move') {
                ctx.lineTo(touch.x, touch.y);
                ctx.stroke();
            } else if (touch.type === 'up') {
                ctx.lineTo(touch.x, touch.y);
                ctx.stroke();
            }
        }

        lastTime = time;
        requestAnimationFrame(render);
    }

    function onDown(event) {
        if (event.target.nodeName !== 'CANVAS') {
            return;
        }
        isTouchDown = true;
        event.preventDefault();

        enqueueTouch('down', event);
    }

    function onMove(event) {
        if (isTouchDown === false) {
            return;
        }

        if (event.target.nodeName !== 'CANVAS') {
            enqueueTouch('up', event, pages[iPage].$canvas[0]);
            isTouchDown = false;
            return;
        }

        event.preventDefault();
        enqueueTouch('move', event);
    }

    function onUp(event) {
        if (isTouchDown === false) {
            return;
        }

        if (event.target.nodeName !== 'CANVAS') {
            return;
        }

        enqueueTouch('up', event);
        isTouchDown = false;
    }

    function enqueueTouch(type, event, target) {
	if (target !== undefined) {
	    event.target = target;
	}
        exposeTouchEvent(event);
        touchQueue.push({
            type: type,
            x: event.pageX - event.target.offsetLeft,
            y: event.pageY - event.target.offsetTop
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
        /*        setTimeout(function () {
            alert('[' + window.innerWidth + ', ' + window.innerHeight + '], pixelRatio:' +
                  window.devicePixelRatio + ', ' + $canvas.css('width') + ', ' + $canvas.css('height') +
                 ', ' + HEADER_HEIGHT + ', ' + $canvas[0].offsetTop);
        }, 3000);
        
        setTimeout(function () {
            var suf = ['top', 'right', 'bottom', 'left'];
            for (var i = 0; i < suf.length; i++) {
                console.log($('#color').css('padding-' + suf[i]))
            }
        }, 3000);*/
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

