namespace.module('startpad.appcache', function (exports, require) {
    /* Setup event listener when module is loaded. */
    $(document).ready(handleAppCache)

    function handleAppCache() {
        if (typeof applicationCache == 'undefined') {
            return;
        }

        if (applicationCache.status == applicationCache.UPDATEREADY) {
            applicationCache.swapCache();
            location.reload();
            return;
        }

        applicationCache.addEventListener('updateready', handleAppCache, false);
    }

});