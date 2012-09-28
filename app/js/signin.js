/* signin.js - Handle user signin - for both online and offline application states. */

namespace.module('gdg.signin', function (exports, require) {
    cookies = require('org.startpad.cookies');

    exports.extend({
        'getInfo': getInfo,
        'on': on
    });

    var defaultInfo = {
        'isAdmin': false,
        'username': '',
        };

    var info = defaultInfo;
    var handlers = {'signin': [], 'signout': []};

    $(document).ready(setup);
    on('signin', onSignIn);
    on('signout', onSignOut);

    function getInfo() {
        return info;
    }

    function on(eventName, fn) {
        handlers[eventName].push(fn);
    }

    function dispatch(eventName, data) {
        var funcs = handlers[eventName];
        for (var i = 0; i < funcs.length; i++) {
            funcs[i](data);
        }
    }

    function setup() {
        var url = cookies.getCookie('signin-url');
        if (url) {
            $('#sign-in').attr('href', url);
        }
        $('#sign-out').click(doSignOut);

        var saved = cookies.getCookie('signin-info');
        if (saved) {
            dispatch('signin', JSON.parse(saved));
        }

        // Refresh signin state from server (if available)
        $.get('/meta/signin', {"url": location.href}).success(updatePage);
    }

    function doSignOut() {
        location.href = info.signOut;
    }

    function updatePage(data) {
        cookies.setCookie('signin-url', data.signIn);
        $('#sign-in').attr('href', data.signIn);
        dispatch(data.username ? 'signin' : 'signout', data);
    }

    function onSignIn(data) {
        info = data;
        $('#username').text(info.username);
        $('body').addClass('signed-in');
        $('#sign-in').attr('href', data.signIn);
        cookies.setCookie('signin-info', JSON.stringify(info));
    }

    function onSignOut() {
        info = defaultInfo;
        $('#username').text(info.username);
        $('body').removeClass('signed-in');
        cookies.setCookie('signin-info', '');
    }
});
