namespace.module('gdg.touch', function (exports, require) {

    exports.extend({
        init: init,
        down: down,
        move: move,
        up: up,
        leave: leave,
        cancel: cancel,
        isTouchDevice: isTouchDevice,
        doubleTap: doubleTap
    });

    var down;
    var move;
    var up;
    var leave;
    var cancel = 'touchcancel';
    var isTouchDevice;

    var dtTimeout;
    var DT_WAIT_DEF = 300;   // ms

    function init(doubleTapTime) {
        if (Modernizr) {
            isTouchDevice = Modernizr.touch ? true : false;
        } else {
            if (('ontouchstart' in window) ||
                window.DocumentTouch && document instanceof DocumentTouch) {
                isTouchDevice = true;
            } else {
                isTouchDevice = false;
            }
        }

        down = isTouchDevice ? 'touchstart' : 'mousedown';
        move = isTouchDevice ? 'touchmove' : 'mousemove';
        up   = isTouchDevice ? 'touchend' : 'mouseup';

        if (isTouchDevice) {
            leave = 'touchleave';
        } else {
            leave = jQuery ? 'mouseleave' : 'mouseout';
        }

        if (doubleTapTime === undefined) {
            dtTimeout = DT_WAIT_DEF;
        } else {
            dtTimeout = doubleTapTime;
        }
    }

    var lastTapTime = 0;

    function doubleTap(callback, event) {
        console.log('doubleTap', event);

        if (lastTapTime === 0) {
            lastTapTime = new Date().getTime();
            setTimeout(function () {
                lastTapTime = 0;
            }, dtTimeout);
            return;
        }

        event.type = 'doubleTap';
        callback(event);
    }

});