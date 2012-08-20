// Pictures are the pictures of planes
// Maps are the maps of the museum
// Images is the set of both Pictures and Maps

namespace.module('startpad.image-gui', function(exports, require) {
    require('org.startpad.funcs').patch();

    exports.extend({
        'initImageGUI': initImageGUI,
        'loadPictures': loadPictures,
        'loadMaps': loadMaps,
        'stringifyPictures': stringifyPictures,
        'stringifyMaps': stringifyMaps
    });


    // unique identifier counter for pictures and maps, incremented with each new one added
    //   initialized in loadPics() and loadMaps() respectively
    var pictureUID;
    var mapUID;

    var pictures;
    var maps;

    var IMAGE_MARGIN = 5;
    var THUMB_X_SIZE = 10;
    var MODAL_X_SIZE = 20;
    var MODAL_BODY_WIDTH = 530;
    var MODAL_PADDING = 15;

    var allPicturesTemplate = _.template(
        '<label for="pictures">pictures:</label>' +
        '<div class="pictures span8" name="pictures">' +
          '<% _.each(pictures, function(picture) { %> ' +
            '<%= pictureTemplate({ picture: picture }) %>' +
          '<% }); %>' +
          '<div class="add-image-container">' +
            '<img id="add-image" class="add-image" src="/images/plus-big.png" />' +
          '</div>' +
        '</div>');


    var pictureTemplate = _.template(
        '<div id="<%= picture.id %>-container" class="thumbnail-container">' +
          '<a class="thumbnail" data-toggle="modal" href="#<%= picture.id %>-modal">' +
            '<img class="thumbnail-image" src="/admin/media/<%= picture.name %>?size=thumbnail" />' +
            '<img class="delete icon" src="/images/delete.png" />' +
            '<img class="back icon" src="/images/arrow_back.png" />' +
            '<img class="fwd icon" src="/images/arrow_fwd.png" />' +
          '</a>' +
          '<a class=label href="/admin/media/<%= picture.name %>?size=large" target="blank">' + 
            '<%= picture.name %>' + 
          '</a>' +
        '</div>' +
        '<div class="modal hide" id="<%= picture.id %>-modal">' +
          '<div id="<%= picture.id %>-modal-body" class="modal-body">' +
            '<a href="/admin/media/<%= picture.name %>?size=large" target="blank">' +
              '<img id="<%= picture.id %>-modal-img" class="modal-image" ' +
                  'src="/admin/media/<%= picture.name %>?size=large" />' +
            '</a>' +
          '</div>' +
           '<div class="modal-footer">' +
             '<a href="#" class="btn" data-dismiss="modal">Close</a>' +
          '</div>' +
        '</div>');


    var allMapsTemplate = _.template(
        '<label for="maps">maps:</label>' +
        '<div class="maps span8" name="maps">' +
          '<% _.each(maps, function(map) { %> ' +
            '<%= mapTemplate({ map: map }) %>' +
          '<% }); %>' +
          '<div class="add-image-container">' +
            '<img id="add-map" class="add-image" src="/images/plus-big.png" />' +
          '</div>' +
        '</div>');


    var mapTemplate = _.template(
        '<div id="<%= map.id %>-container" class="thumbnail-container">' +
          '<a class="thumbnail" data-toggle="modal" href="#<%= map.id %>-modal">' +
            '<img class="thumbnail-image" src="/admin/media/<%= map.name %>?size=thumbnail" />' +
            '<img class="delete icon" src="/images/delete.png" />' +
            '<img class="back icon" src="/images/arrow_back.png" />' +
            '<img class="fwd icon"src="/images/arrow_fwd.png" />' +
            '<img class="map-x" id="<%= map.id %>-map-x" src="/images/x.png" ' +
                'style="left: <%= map.x * 64 + 5 %>px; top: <%= map.y * 64 + 5 %>px" />' +
          '</a>' +
          '<a class="label" href="/admin/media/<%= map.name %>?size=large" target="blank">' +
            '<%= map.name %>' +
          '</a>' +
        '</div>' +
        '<div class="modal hide" id="<%= map.id %>-modal">' +
          '<div id="<%= map.id %>-modal-body" class="modal-body">' +
            '<img id="<%= map.id %>-modal-img" class="modal-map" ' +
                'src="/admin/media/<%= map.name %>?size=large" />' +
            '<img id="<%= map.id %>-map-x" src="/images/x.png" class="modal-map-x" />' +
          '</div>' +
          '<div class="modal-footer">' +
            '<a class="btn" href="/admin/media/<%= map.name %>?size=large" target="blank">' +
              'Fullsize' +
            '</a>' +
            '<a href="#" class="btn" data-dismiss="modal">Close</a>' +
          '</div>' +
        '</div>');


    function initImageGUI() {
        var i;
        for (i = 0; i < pictures.length; i++) {
            bindImageEvents(pictures[i], 'picture');
        }
        for (i = 0; i < maps.length; i++) {
            bindImageEvents(maps[i], 'map');
        }
        $('#add-image').on('click', addImage.curry('picture'));
        $('#add-map').on('click', addImage.curry('map'));
    }

    function bindImageEvents(obj, which) {
        var id, array, $container, map, Picture;

        id = obj.id;
        $container = $('#' + obj.id + '-container');
        obj.$container = $container;

        if (which == 'map') {
            map = obj;
            array = maps;
        } else if (which == 'picture') {
            Picture = obj;
            array = pictures;
        }

        $container.find('.thumbnail-image').one('load', onImageLoad.curry(which)).each(function () {
            if (this.complete) $(this).load();
        });
        $container.find('.delete').on('click', onDeleteClick.curry(id, which));

        $container.find('.back').on('click', shiftImage.curry(array, id, 'back'));
        $container.find('.fwd').on('click', shiftImage.curry(array, id, 'fwd'));

        if (which == 'map') {
            var $modal = $('#' + id + '-modal');
            var $modalMap = $modal.find('.modal-map');
            var $modalMapX = $modal.find('.modal-map-x');

            $modalMap.on('mousedown', preventDefaultStopProp);
            $modalMapX.on('mousedown', preventDefaultStopProp);

            $modal.find('.modal-map').on('load', onModalMapLoad.curry(map));

            $modalMap.on('click', onModalMapClick.curry(map));
            $modalMapX.on('click', onModalMapXClick.curry(map));

            $modal.on('shown', positionModalX.curry(map));
        }
    }

    function addImage(which, event) {
        var name = prompt("Image name?");
        if (!name) {
            return;
        }
        if (which == 'picture') {
            var Picture = { id: 'pic' + pictureUID++, name: name }
            pictures.push(Picture);
            $(pictureTemplate({ picture: Picture })).insertBefore($(this).parent());
            bindImageEvents(Picture, 'picture');
        } else if (which == 'map') {
            var map = { id: 'map' + mapUID++, name: name, x: 0.5, y: 0.5 };
            maps.push(map);
            $(mapTemplate({ map: map })).insertBefore($(this).parent());
            bindImageEvents(map, 'map');
        }
    }

    function preventDefaultStopProp(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    function onDeleteClick(id, which, event) {
        preventDefaultStopProp(event);
        var index;
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

        $('#' + id + '-container').remove();
        $('#' + id + '-modal').remove();
    }

    function onImageLoad(which, event) {
        $(this).addClass('centered');
        var ml = -(this.width + 10) / 2;
        var mt = -(this.height + 10) / 2
        $(this).css('margin-left', ml);
        $(this).css('margin-top', mt);

        if (which == 'map') {
            var offset = [0, 0];
            // 74=internal width of .thumbnail, 5=padding + border
            offset[0] = 74 / 2 + ml + 5;
            offset[1] = 74 / 2 + mt + 5;

            // get the id from the id field of this image's container
            var id = $(this).parents('.thumbnail-container')[0].id.split('-')[0];

            var $mapx = $('#' + id + '-map-x');

            var map = maps[objectIndexOf(maps, 'id', id)];

            map.thumbOffset = offset;
            map.thumbSize = [this.width, this.height];
            map.thumbMapX = $mapx;
            positionThumbnailX(map);
        }
    }

    function onModalMapLoad(map) {
        var $map, $mapx;

        $map = $(this);
        $mapx = $map.siblings('.modal-map-x');

        $map.css('width', MODAL_BODY_WIDTH);

        map.$modalMap = $map;
        map.$modalMapX = $mapx;
    }

    function positionModalX(map) {
        var mapSize;
        if (!map.modalMapSize) {
            mapSize = [MODAL_BODY_WIDTH, parseInt(map.$modalMap.css('height'), 10)];
            map.modalMapSize = mapSize;
        } else {
            mapSize = map.modalMapSize;
        }

        map.$modalMapX.css('left', mapSize[0] * map.x - MODAL_X_SIZE / 2 + MODAL_PADDING);
        map.$modalMapX.css('top', mapSize[1] * map.y - MODAL_X_SIZE / 2 + MODAL_PADDING);
    }

    function onModalMapClick(map, event) {
        var mapSize = map.modalMapSize;

        map.x = event.offsetX / mapSize[0];
        map.y = event.offsetY / mapSize[1];

        positionModalX(map);
        positionThumbnailX(map);
    }

    function onModalMapXClick(map, event) {
        var pixelOffset = []
        var percentOffset = [];
        var mapSize = map.modalMapSize;

        pixelOffset[0] = event.offsetX - MODAL_X_SIZE / 2;
        pixelOffset[1] = event.offsetY - MODAL_X_SIZE / 2;

        percentOffset[0] = pixelOffset[0] / mapSize[0];
        percentOffset[1] = pixelOffset[1] / mapSize[1];

        map.x += percentOffset[0];
        map.y += percentOffset[1];

        map.x = map.x < 0 ? 0 : map.x;
        map.x = map.x > 1 ? 1 : map.x;
        map.y = map.y < 0 ? 0 : map.y;
        map.y = map.y > 1 ? 1 : map.y;

        positionModalX(map);
        positionThumbnailX(map);
    }

    function positionThumbnailX(map) {
        var offset = map.thumbOffset;
        var size = map.thumbSize;
        var $mapx = map.thumbMapX;

        $mapx.css('top', offset[1] + IMAGE_MARGIN - THUMB_X_SIZE / 2 + size[1] * map.y);
        $mapx.css('left', offset[0] + IMAGE_MARGIN - THUMB_X_SIZE / 2 + size[0] * map.x);
    }

    function getMapFromName(name) {
        var index = getMapIndexFromName(name);
        if (index == -1) {
            return false;
        }
        return maps[index];
    }

    function getMapIndexFromName(name) {
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].name == name) {
                return i;
            }
        }
        return -1;
    }

    // runs through the Pictures object and conatenates their 'names' with  \n
    function stringifyPictures() {
        var result = '';
        for (var i = 0; i < pictures.length; i++) {
            result += pictures[i].name + '\n';
        }
        return result.slice(0, -1); // slice off the trailing \n
    }

    // runs through the Maps object and conatenates the 'name', x, and y values of each map
    //   with commas, then concatenates all of those with \n
    function stringifyMaps() {
        var result = '';
        for (var i = 0; i < maps.length; i++) {
            result += maps[i].name + ',' + maps[i].x + ',' + maps[i].y + '\n';
        }
        return result.slice(0, -1); // slice off the trailing \n
    }

    function loadPictures(pictureStr) {
        pictures = [];
        if (pictureStr) {
            pictures = pictureStr.split('\n');
        }
        // pictureUID is global
        for (pictureUID = 0; pictureUID < pictures.length; pictureUID++) {
            pictures[pictureUID] = { name: pictures[pictureUID], id: 'pic' + pictureUID };
        }

        return allPicturesTemplate({ pictures: pictures, pictureTemplate: pictureTemplate });
    }

    function loadMaps(mapStr) {
        var m, i;
        maps = [];
        if (mapStr) {
            maps = mapStr.split('\n');
        }
        // mapUID is global
        for (mapUID = 0; mapUID < maps.length; mapUID++) {
            m = maps[mapUID].split(',');
            maps[mapUID] = {
                id: 'map' + mapUID,
                name: m[0],
                x: m[1],
                y: m[2],
            };  // more fields will be added on thumb image and modal image loads
        }

        return allMapsTemplate({ maps: maps, mapTemplate: mapTemplate });
    }

    function shiftImage(array, id, direction, event) {
        preventDefaultStopProp(event);

        var index = objectIndexOf(array, 'id', id);
        if (direction == 'back') {
            index--;
        }
        if (index < 0 || index >= array.length - 1) {
            return;
        }
        array[index].$container.insertAfter(array[index + 1].$container);
        swap(array, index, index + 1);
    }

    // indexOf() for an array of objects. returns i where array[i].key == value
    function objectIndexOf(array, key, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i][key] == value) {
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

});