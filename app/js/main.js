namespace.module('gdg-sample.main', function(exports, require) {
    var jsonRest = require('startpad.json-rest');
    require('org.startpad.funcs').patch();

    var schema;

    $(document).ready(onReady);

    function onReady() {
        handleAppCache();
        jsonRest.ensureSchema(onSchemaReady);
    }

    function onSchemaReady() {
        schema = jsonRest.ensureSchema(onSchemaReady);
    }

    // For offline - capable applications
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
