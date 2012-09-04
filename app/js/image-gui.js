// Pictures are the pictures of planes
// Maps are the maps of the museum
// Images is the set of both Pictures and Maps

namespace.module('startpad.image-gui', function(exports, require) {
    require('org.startpad.funcs').patch();

    exports.extend({
        'initImageGUI': initImageGUI,
        'loadImages': loadImages,
        'getImageFields': getImageFields
    });


    // array of unique identifier counters
    var imageUIDs = {};

    var images = {};

    var IMAGE_MARGIN = 5;
    var MODAL_BODY_WIDTH = 530;
    var MODAL_PADDING = 15;

    var allImagesTemplate = _.template(
        '<label for="<%= modelId %>"><%= modelId %>:</label>' + // images: should come from a variable, not hardcoded
        '<div class="images span8" name="<%= modelId %>">' +
          '<% _.each(images, function(image) { %> ' +
            '<%= imageTemplate({ image: image }) %>' +
          '<% }); %>' +
          '<div class="add-image-container">' +
            '<img id="add-image-<%= modelId %>" class="add-image" src="/images/plus-big.png" />' +
          '</div>' +
        '</div>');


    var imageTemplate = _.template(
        '<div id="<%= image.id %>-container" class="thumbnail-container">' +
          '<a class="thumbnail" data-toggle="modal" href="#<%= image.id %>-modal">' +
            '<img class="thumbnail-image" src="/admin/media/<%= image.name %>?size=thumbnail" />' +
            '<img class="delete icon" src="/images/delete.png" />' +
            '<img class="back icon" src="/images/arrow_back.png" />' +
            '<img class="fwd icon" src="/images/arrow_fwd.png" />' +
          '</a>' +
          '<a class=label href="/admin/media/<%= image.name %>?size=large" target="blank">' + 
            '<%= image.name %>' + 
          '</a>' +
        '</div>' +
        '<div class="modal hide" id="<%= image.id %>-modal">' +
          '<div id="<%= image.id %>-modal-body" class="modal-body">' +
            '<a href="/admin/media/<%= image.name %>?size=large" target="blank">' +
              '<img id="<%= image.id %>-modal-img" class="modal-image" ' +
                  'src="/admin/media/<%= image.name %>?size=large" />' +
            '</a>' +
          '</div>' +
           '<div class="modal-footer">' +
             '<a href="#" class="btn" data-dismiss="modal">Close</a>' +
          '</div>' +
        '</div>');


    function loadImages(imageStr, modelId) {
        var imageGroup = [];
        var i;

        if (imageStr) {
            imageGroup = imageStr.split('\n');
        }
        for (i = 0; i < imageGroup.length; i++) {
            imageGroup[i] = { name: imageGroup[i], id: modelId + '-' + i, modelId: modelId };
        }

        images[modelId] = imageGroup;
        imageUIDs[modelId] = i;

        return allImagesTemplate({ images: imageGroup, imageTemplate: imageTemplate, modelId: modelId });
    }

    function initImageGUI() {
        var i, j, imageGroup;
        for (modelId in images) {
            if (!images.hasOwnProperty(modelId)) {
                continue;
            }
            imageGroup = images[modelId];
            for (i = 0; i < imageGroup.length; i++) {
                bindImageEvents(imageGroup[i], imageGroup);
            }
            $('#add-image-' + modelId).on('click', addImage.curry(modelId));
        }
    }

    function bindImageEvents(image, imageGroup) { // imageGroup is not used in this function, should it be?
        var id, $container;

        id = image.id;
        $container = $('#' + image.id + '-container');
        image.$container = $container;

        // ensure that onImageLoad is called even if loaded from cache 
        //   (Load from cache will not fire a jQuery 'load' event)
        $container.find('.thumbnail-image').one('load', onImageLoad).each(function () {
            if (this.complete) $(this).load();
        });
        $container.find('.delete').on('click', onDeleteClick.curry(image, imageGroup));

        $container.find('.back').on('click', shiftImage.curry(image, 'back'));
        $container.find('.fwd').on('click', shiftImage.curry(image, 'fwd'));
    }

    function addImage(modelId, event) {
        var name = prompt("Image name?");
        if (!name) {
            return;
        }
        var image = { id: modelId + '-' + imageUIDs[modelId]++, name: name, modelId: modelId };
        images[modelId].push(image);
        $(imageTemplate({ image: image })).insertBefore($(this).parent());
        bindImageEvents(image, images[modelId]);
    }

    function onImageLoad(event) {
        $(this).addClass('centered');
        var ml = -(this.width + 10) / 2;
        var mt = -(this.height + 10) / 2
        $(this).css('margin-left', ml);
        $(this).css('margin-top', mt);
    }

    function onDeleteClick(image, imageGroup, event) {
        preventDefaultStopProp(event);

        var index = objectIndexOf(imageGroup, 'id', image.id);
        imageGroup.splice(index, 1);
/*        var index;
        var array;
        if (which == 'picture') {
            array = pictures;
        } else if (which == 'map') {
            array = maps;
        }
        index = objectIndexOf(array, 'id', id);
        if (index == -1) {
            console.log('Error: trying to delete non existant ' + which);
        }
        array.splice(index, 1);
*/
        $('#' + image.id + '-container').remove();
        $('#' + image.id + '-modal').remove();
    }


    //function shiftImage(array, id, direction, event) {
    function shiftImage(image, direction, event) {
        preventDefaultStopProp(event);

        var imageGroup = images[image.modelId];
        var index = objectIndexOf(imageGroup, 'id', image.id);

        if (direction == 'back') {
            index--;
        }
        if (index < 0 || index >= imageGroup.length - 1) {
            return;
        }
        imageGroup[index].$container.insertAfter(imageGroup[index + 1].$container);
        swap(imageGroup, index, index + 1);

        /*
        var index = objectIndexOf(array, 'id', id);
        if (direction == 'back') {
            index--;
        }
        if (index < 0 || index >= array.length - 1) {
            return;
        }
        array[index].$container.insertAfter(array[index + 1].$container);
        swap(array, index, index + 1);*/
    }

    function getImageFields(result) {
        for (modelId in images) {
            if (!images.hasOwnProperty(modelId)) {
                continue;
            }
            result[modelId] = stringifyImage(images[modelId]);
        }
    }

    // runs through the Images object and conatenates their 'names' with  \n
    function stringifyImage(imageGroup) {
        var result = '';
        for (var i = 0; i < imageGroup.length; i++) {
            result += imageGroup[i].name + '\n';
        }
        return result.slice(0, -1); // slice off the trailing \n
    }

    // indexOf() for an array of objects. returns i where array[i].key == value
    function objectIndexOf(array, key, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i][key] === value) {
                return i;
            }
        }
        console.log('objectindexof not found');
        return -1;
    }

    function swap(arr, i1, i2) {
        var temp = arr[i1];
        arr[i1] = arr[i2];
        arr[i2] = temp;
    }

    function preventDefaultStopProp(event) {
        event.stopPropagation();
        event.preventDefault();
    }

});