namespace.module('startpad.json-forms', function(exports, require) {
    var jsonRest = require('startpad.json-rest');
    var imageGUI = require('startpad.image-gui');

    var types = require('org.startpad.types');  // FROM SC
    require('org.startpad.funcs').patch();

    exports.extend({
        'onFormsPage': onFormsPage,
        'onListPage': onListPage,
        'onItemPage': onItemPage,
        'onMediaPage': onMediaPage
    });

    var markdown;
    var schema;
    var pageInfo;
    var currentItem;

    // from SC, there is a less complete version of this declared in callback from
    //   onItemPage(), so this is added and that is removed
    var controlTemplates = {
        'text': _.template(
            '<label for="<%- name %>"><%- name %>:</label>' +
            '<input type="<%- property.control %>" name="<%- name %>" id="<%- name %>" ' +
            '    value="<%- value %>" class="span8" />'),

        'textarea': _.template(
            '<label for="<%- name %>"><%- name %>:</label>' +
            '<textarea id="<%- name %>" name="<%- name %>" class="span8"><%- value %></textarea>'),

        'readonly': _.template(
            '<label><%- name %>:</label>' +
            '<div id="<%- name %>"><%- value %></div>'),

        'computed': _.template('<div style="width: 100%; overflow: hidden;"><%= value %></div>'),

        'reference': _.template(
            '<label for="<%- name %>"><%- name %>:</label>' +
            '<input type="text" name="<%- name %>" id="<%- name %>" ' +
            '    value="<%- value.id %>"/>' +
            '<div>' +
            '  Current <a href="/admin/forms/<%- property.type %>"><%- property.type %></a>: ' +
            '<a href="/admin/forms/<%- property.type %>/<%- value.id %>">' +
            '<%- value.name %></a>' +
            '</div>')
    };

    var mediaLoaded = {};

    var mediaPageImageTemplate = _.template(
        '<img class="modal-image" src="/admin/media/<%= id %>?size=mobile" />');


    function onFormsPage() {
        if (!ensureInit(onFormsPage)) {
            return;
        }

        var schemaTemplate = _.template($('#schema-links-template').html());
        var linksHTML = ""
        for (model in schema) {
            linksHTML += schemaTemplate(schema);
        }
        $('#schema-links-body').html(linksHTML);
    }

    function onListPage() {
        if (!ensureInit(onListPage)) {
            return;
        }

        var headingText = pageInfo.model + ' List.';
        headingText = headingText[0].toUpperCase() + headingText.slice(1);

        $('#list-heading').text(headingText);
        $('#_new').click(onNew);

        var modelRowTemplate = _.template($('#model-row-template').html());
        $.ajax({
            // Override default caching since the list is likely to change frequently
            // while editing.
            url: '/data/' + pageInfo.model + '?no-cache',
            success: function (result) {
                var listHTML = ""
                for (var i = 0; i < result.length; i++) {
                    var item = result[i];
                    item.modelName = pageInfo.model;

                    if (!item.name) {
                        item.name = '#' + item.id;
                    }

                    if (!item.title) {
                        item.title = item.name;
                    }

                    listHTML += modelRowTemplate(item);
                }
                $('#list-table-body').html(listHTML);
            }
        });
    }

    function onMediaPage() {
        if (!ensureInit(onMediaPage)) {
            return;
        }

        var $images = $('.thumbnail').find('img');
        $images.one('load', onImageLoad).each(function () {
            if (this.complete) $(this).load();
        });
        // $images.on('error', onImageError); // removing image is not desired behavior

        var $modals = $('.modal');
        for (var i = 0; i < $modals.length; i++) {
            mediaLoaded[$modals[i].id] = 'not loaded';
            $($modals[i]).on('show', ensureModalLoaded.curry($modals[i].id));
        }
    }

    function onImageLoad(event) {
        // only on load add left: 50%; top: 50%; so less jarring visually
        $(this).addClass('centered');

        // 10 is padding + border set in thumbnail
        $(this).css('margin-left', -(this.width + 10) / 2); 
        $(this).css('margin-top', -(this.height + 10) / 2);
    }

    // on image load error, remove the whole thumbnail and modal
    function onImageError(event) {
        var id = $(this).siblings()[0].innerHTML;     // get the id of corresponding modal
        $('#' + id).remove();                         // remove the modal
        $(this.offsetParent.offsetParent).remove();   // remove the appropriate thumbnail container
    }

    function ensureModalLoaded(id, event) {
        if (mediaLoaded[id] == 'loaded') {
            return;
        }
        $('#' + id + '-body').find('a').append(mediaPageImageTemplate({ id: id }));
        mediaLoaded[id] = 'loaded';
    }

    function onItemPage() {
        if (!ensureInit(onItemPage)) {
            return;
        }

        $('#item-form-legend').text(pageInfo.model + ' item #' + pageInfo.id);

        markdown = markdown || new Showdown.converter().makeHtml;

        $('#_save').click(onSave);
        $('#_delete').click(onDelete);
        
        $.ajax({
            url: '/data/' + pageInfo.model + '/' + pageInfo.id,
            success: function (result) {
                currentItem = result;
                var modelSchema = schema[pageInfo.model];
                var modelProperties = modelSchema.properties;
                var formProperties = modelSchema.formOrder || types.keys(modelProperties);

                var formHTML = "";

                processValues(result, formProperties, function(data, name, property) {
                    var template;
                    var context;
                    if (data[name] === null) {
                        data[name] = '';
                    }
                    if (property) {
                        if (property.type == 'Date') {
                            data[name] = new Date(data[name]).toISOString()
                        }
                        context = {name: name,
                                   value: data[name],
                                   property: property
                                   };
                        if (!context.value && property.control == 'reference') {
                            context.value = {id: '', name: 'Unassigned'};
                        }
                        if (property.readOnly) {
                            context.control = 'readonly';
                        }
                    } else {
                        context = {name: 'computed',
                                   value: computeWrapper(data, name),
                                   property: {control: 'computed'}
                                   };
                    }

                    template = controlTemplates[context.control || context.property.control];
                    formHTML += template(context);
                });

                $('#item-form-body').append(formHTML);

                imageGUI.initImageGUI();
            }
        });
    }

    // Initialize schema and url parsing - call callback when ready.
    function ensureInit(callback) {
        if (!schema && !(schema = jsonRest.ensureSchema(callback))) {
            return false;
        }

        pageInfo = parsePageURL();
        return true;
    }

    function computeWrapper(item, expr) {
        return eval(expr);
    }

    function onSave() {
        data = getFields();

        // compute all computed fields
        var computed = schema[pageInfo.model].computed;
        if (computed) {
            for (var i = 0; i < computed.length; i++) {
                computeWrapper(data, computed[i]);
            }
        }

        $.ajax({
            type: 'PUT',
            url: '/data/' + pageInfo.model + '/' + pageInfo.id,
            data: JSON.stringify(data),
            error: function (result, textStatus) {
                alert(textStatus);
            },
            success: function (result, textStatus) {
                console.log("saved");
                window.location.href = '/admin/forms/' + pageInfo.model;
            }
        });
    }

    function onDelete() {
        if (confirm("Are you sure you want to delete " + currentItem.title + "?")) {
            $.ajax({
                type: 'DELETE',
                url: '/data/' + pageInfo.model + '/' + pageInfo.id,
                error: function (result, textStatus) {
                    alert(textStatus);
                },
                success: function (result, textStatus) {
                    window.location.href = '/admin/forms/' + pageInfo.model;
                }
            });
        }
    }

    function onNew() {
        $.ajax({
            type: 'POST',
            url: '/data/' + pageInfo.model,
            data: '{"title": "New ' + pageInfo.model + '"}',
            error: function (result, textStatus) {
                alert(textStatus);
            },
            success: function (result, textStatus) {
                window.location.href = '/admin/forms/' + pageInfo.model;
            }
        });
    }

    function getFields() {
        var fields = $('input, textarea');
        var result = {};

        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (field.id[0] == '_' || field.id.length == 0) {
                continue;
            }
            result[field.id] = $(field).val();
        }

        imageGUI.getImageFields(result);

        //result['images'] = imageGUI.stringifyImages();
        //result['mapLocations'] = imageGUI.stringifyMaps();
        return result;
    }

    // Parse /admin/forms/<model>/<id> from location
    function parsePageURL() {
        parts = window.location.pathname.split('/').slice(3)
        return {'model': parts[0],
                'id': parts[1]
               }
    }

    // FROM SC QR code stuff, makes sense to have it in here so here it is:
    var qrTemplate = _.template(
        '<img src="http://chart.googleapis.com/chart?cht=qr&chs=<%= size %>x<%= size %>&' +
            'chl=<%= encURL %>">' +
        '<div><a href="<%= url %>"><%- url %></a></div>');


    function QRCode(url, size, urlDisplay) {
        if (!size) {
            size = 300;
        }
        if (!urlDisplay) {
            urlDisplay = url;
        }
        var sep = url.indexOf('?') == -1 ? '?' : '&';
        var encURL = encodeURIComponent(url + sep + 's=s');
        return qrTemplate({url: urlDisplay, encURL: encURL, size: size});
    }

    // Looping primative - calls fn(data, name, property, result)
    function processValues(data, keys, fn) {
        if (arguments.length < 3) {
            fn = keys;
            keys = undefined;
        }
        var modelSchema = schema[pageInfo.model];
        var properties = modelSchema.properties;
        if (keys === undefined) {
            keys = types.keys(properties);
        }
        var result = {}

        for (var i = 0; i < keys.length; i++) {
            name = keys[i];
            fn(data, name, properties[name], result);
        }
        return result;
    }

});
