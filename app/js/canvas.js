namespace.module('gdg.canvas', function (exports, require) {
    require('org.startpad.funcs').patch();

    $(document).ready(function () {
        setTimeout(init, 0);  // let the DOM catch up before calling init
    });

    var isTouchDevice;   // boolean
    var $canvas;         // jQuery wrapped html canvas element
    var ctx;
    var windowSize;      // 2 element array recording the window size
    var orientation;     // string, 'portrait' or 'landscape
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
    var DEVICE_PIXEL_RATIO = 1.325;
    var PORTRAIT = [603, 796];
    var LANDSCAPE = [965, 443];
    var canvasSize = [];
    var canvasScale;

    function init() {

        isTouchDevice = Modernizr.touch;

        downEventStr = isTouchDevice ? 'touchstart' : 'mousedown';
        moveEventStr = isTouchDevice ? 'touchmove'  : 'mousemove';
        upEventStr   = isTouchDevice ? 'touchend'   : 'mouseup';

        if (isTouchDevice) {
            $(document).on('touchstart', function (event) {
                if (event.target.nodeName !== 'INPUT') {
                    event.preventDefault();
                }
            });
            $(document).on('touchmove', function (event) {
                event.preventDefault();
            });
        }

        $canvas = $('canvas');
        orientation = getOrientation();

        if (orientation === 'portrait') {
            canvasSize[0] = PORTRAIT[0] * DEVICE_PIXEL_RATIO;
            canvasSize[1] = PORTRAIT[1] * DEVICE_PIXEL_RATIO;
        } else if (orientation === 'landscape') {
            canvasSize[0] = LANDSCAPE[0] * DEVICE_PIXEL_RATIO;
            canvasSize[1] = LANDSCAPE[1] * DEVICE_PIXEL_RATIO;
        } else {
            console.log('ERROR: you have spelled something wrong');
            return;
        }
        $canvas[0].width = canvasSize[0];
        $canvas[0].height = canvasSize[1];

        HEADER_HEIGHT = parseInt($('#control').css('height'), 10);

        ctx = $canvas[0].getContext('2d');

        ctx.fillStyle = '#ddd';
        ctx.fillRect(0, 0, canvasSize[0], canvasSize[1]);
        ctx.lineWidth = $('#line-width').val();
        ctx.strokeStyle = '#' + $('#color').val();

        $canvas.on(downEventStr, onDown);
        $canvas.on(moveEventStr, onMove);
        $canvas.on(upEventStr,   onUp);

        $('#color').on('change keyup', changeColor);
        $('#line-width').on('change keyup', changeLineWidth);

        $(window).on('resize', onResize);
        onResize();

        $('input').on(downEventStr, function () { this.focus(); });

        $('#next').on(downEventStr, onNext);
        $('#prev').on(downEventStr, onPrev);

        requestAnimationFrame(render);

        debugLogs();
        
        window.enable = enable;
    }

    function enable(element, which) {
        while (element.length) {  // un-jQuery wrap if needed
            element = element[0];
        }
        if (which === true) {
            element.disabled = false;
        } else if (which === false) {
            element.disabled = true;
        } else {
            element.disabled = !element.disabled;
        }
    }

    function onNext() {
        
    }

    function onPrev() {
        
    }

    function saveCanvas(canvas) {
        $('body').append(hiddenCanvas({
            id: hiddenCanvasUID,
            width: canvas.width,
            height: canvas.height
        }));
        var newCanvas = $('#hidden-canvas-' + hiddenCanvasUID)[0];
        newCanvas.getContext('2d').drawImage(canvas, 0, 0);

        hiddenCanvasUID++;
    }

    function changeColor() {
        var color = '#' + $(this).val();
        ctx.strokeStyle = color;
        $('#color-demo').css('background-color', color);
    }

    function changeLineWidth() {
        ctx.lineWidth = parseFloat($(this).val());
    }

    function onResize() {
        windowSize = [window.innerWidth, window.innerHeight];
        var size = canvasSize;
        var space = [windowSize[0], windowSize[1] - HEADER_HEIGHT];
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
        $canvas.css({
            'margin-top': marginTop,
            'width': size[0] * scale,
            'height': size[1] * scale
        });
        canvasSize = size;
    }

    function render(time) {
        var touch;

        $('#fps').empty().append(getFps(time, lastTime));

        while (touchQueue.length > 0) {
            touch = touchQueue.shift();
            touch.x /= canvasScale;
            touch.y /= canvasScale;
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
                isTouchDown = undefined;
            }
        }

        lastTime = time;
        requestAnimationFrame(render);
    }

    function onDown(event) {
        isTouchDown = true;
        event.preventDefault();
        event = exposeTouchEvent(event);
        enqueueTouch('down', event);
    }

    function onMove(event) {
        if (isTouchDown !== true) {
            return;
        }
        event.preventDefault();
        event = exposeTouchEvent(event);
        enqueueTouch('move', event);
    }

    function onUp(event) {
        if (isTouchDown !== true) {
            return;
        }
        event = exposeTouchEvent(event);
        enqueueTouch('up', event);
        isTouchDown = false;
    }

    function enqueueTouch(type, event) {
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
            return e.originalEvent.touches[0];
        }
        return e; // is not a touch event
    }

    function debugLogs() {
        return;
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
    }

});


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

