namespace.module('gdg.canvas', function (exports, requires) {
    $(document).ready(init);

    var isTouchDevice;   // boolean
    var $canvas;         // jQuery wrapped html canvas element
    var ctx;
    var windowSize;      // 2 element array recording the window size
    var orientation;     // string, 'portrait' or 'landscape
    var reRender = false;
    var fpsAverage = 60;
    var lastTime = new Date().getTime();

    var downEventStr;  // holds name of events for touch or mouse events
    var moveEventStr;
    var upEventStr;
    var isTouchDown = false;  // boolean, is there a touchdown

    function init() {

        // check if touch device (from Modernizr)
        isTouchDevice = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;

        if (isTouchDevice) {
            $(document).on('touchstart', function (event) {
                event.preventDefault();
            });
        }
        downEventStr = isTouchDevice ? 'touchstart' : 'mousedown';
        moveEventStr = isTouchDevice ? 'touchmove'  : 'mousemove';
        upEventStr   = isTouchDevice ? 'touchend'   : 'mouseup';

        $canvas = $('canvas');
        ctx = $canvas[0].getContext('2d');

        $canvas.on(downEventStr, onDown);
        $canvas.on(moveEventStr, onMove);
        $canvas.on(upEventStr,   onUp);

        $(window).on('resize', onResize);
        onResize();

        requestAnimationFrame(render);
    }

    function onResize() {
        windowSize = [window.innerWidth, window.innerHeight];
        orientation = getOrientation();
        reRender = true;
    }

    function render(time) {
        var fps;

        // If told to re-render
        if (reRender) {
            // set the size of the canvas (which clears it)
            $('canvas')[0].width = windowSize[0];
            $('canvas')[0].height = windowSize[1];

            // redraw the background
            ctx.fillStyle = '#ddd';
            ctx.fillRect(0, 0, windowSize[0], windowSize[1]);

            // reset flag
            reRender = false;
        }

        // draw background color over the fps display area
        ctx.fillStyle = '#ddd';
        ctx.fillRect(5, 5, 50, 12);

        // set styles and draw the fps count
        ctx.fillStyle = 'black';
        ctx.font = 'bold 12px Helvetica';
        ctx.textBaseline = 'top';
        ctx.fillText(getFps(time, lastTime, 4), 5, 5);

        // 
        lastTime = time;
        requestAnimationFrame(render);
    }

    function onDown(event) {
        isTouchDown = true;

        event = exposeTouchEvent(event);

        ctx.beginPath();
        ctx.moveTo(event.pageX, event.pageY);
        ctx.lineWidth = 2;
    }

    function onMove(event) {
        if (isTouchDown !== true) {
            return;
        }
        event = exposeTouchEvent(event);

        ctx.lineTo(event.pageX, event.pageY);
        ctx.stroke();
    }

    function onUp(event) {
        if (isTouchDown !== true) {
            return;
        }
        event = exposeTouchEvent(event);

        ctx.lineTo(event.pageX, event.pageY);
        ctx.stroke();
        ctx.closePath();
        reRender = true;
        isTouchDown = undefined;
    }

    // Calculate approximate frames per second based on time between raf calls
    // takes a digits integer to indicate level of truncation
    function getFps(time, lastTime, digits) {
        fpsAverage = 1000 / (time - lastTime) * 0.05 + fpsAverage * 0.95;
        if (digits) {
            return (fpsAverage + '').slice(0, digits + 1);
        } else {
            return fpsAverage + '';
        }
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