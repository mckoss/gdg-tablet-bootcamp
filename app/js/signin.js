namespace.module('gdg.signin', function (exports, require) {
    exports.extend({
        'getInfo': getInfo
    });

    var info = {
        'isAdmin': false,
        'username': ''
        };

    $(document).ready(setup);

    function setup() {
        $.get('/meta/signin', {"url": location.href}).success(updatePage);
    }

    function getInfo() {
        return info;
    }

    function updatePage(data) {
        info = data;

        $('#sign-in').attr('href', data.signIn);
        $('#sign-out').attr('href', data.signOut);

        username = data.username;
        $('#username').text(username);

        if (data.username != '') {
           $('body').addClass('signed-in');
        } else {
           $('body').removeClass('signed-in');
        }
    }
});
