// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/).
//
// 2012-01-10: mckoss Modified to use App Engine back end

namespace.module('gdg.todos', function (exports, requires) {
    $(document).ready(init);

    var isTouchDevice;
    var overflowing;
    var touch;
    var minDistance2 = 4 * 4;

    function init() {
        // Cache the template function for a single item.
        TodoView.template =  _.template($('#item-template').html());

        // Our template for the line of statistics at the bottom of the app.
        AppView.statsTemplate = _.template($('#stats-template').html());

        exports.app = new AppView();


        // check if touch device (from Modernizr)
        isTouchDevice = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;

        if (isTouchDevice) {
            $(document).on('touchstart', function (e) {
                if (e.target == $('body')[0]) {
                    e.preventDefault();
                }
            });

            $('#todo-list').on('touchstart', '.todo-text', onTodoTouchstart);
            $('#todo-list').on('touchmove', '.todo-text', onTodoTouchmove);
            $('#todo-list').on('touchend', '.todo-text', onTodoTouchend);
        }

        $(window).on('resize', onResize);
    }

    function onTodoTouchstart(event) {
        if (event.target.classList == 'todo-text') {
            event = exposeTouchEvent(event);
            touch = [event.pageX, event.pageY];
        }
    }

    function onTodoTouchmove(event) {
        if (touch.length != 2) {
            return;
        }
        event = exposeTouchEvent(event);
        touch = [event.pageX, event.pageY];
    }

    function onTodoTouchend(event) {
        if (touch.length != 2) {
            return;
        }
        console.log('here');
        var $target = $(event.target).closest('li');
        event = exposeTouchEvent(event);
        var point = [event.pageX, event.pageY];

        console.log(distance2(touch, point));
        if (distance2(touch, point) < minDistance2) {
            console.log('hi');
            $target.addClass('editing');
            $target.find('input.todo-input').focus();
        }
    }

    function distance2(p1, p2) {
        console.log(p1[0], p1[1], p2[0], p2[1]);
        return Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2);
    }

    function onResize() {
        
    }

    function isOverflowing() {
        var bodyHeight = $('body').css('height');
        return parseInt(bodyHeight, 10) > window.innerHeight;
    }

    function getOrientation() {
        if (window.matchMedia) {
            var mql = window.matchMedia("(orientation: portrait)");
            if (mql.matches) {
                return 'portrait';
            } else {
                return 'landscape';
            }
            return;
        }
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

    // Todo Model
    // ----------

    // Our basic **Todo** model has `text`, `order`, and `done` attributes.
    var Todo = Backbone.Model.extend({
        // Default attributes for a todo item.
        defaults: function() {
            return {
                done:  false,
                order: Todos.nextOrder()
            };
        },

        // Toggle the `done` state of this todo item.
        toggle: function() {
            this.save({done: !this.get("done")});
        }

    });

    // Todo Collection
    // ---------------

    // The collection of todos is backed by *localStorage* instead of a remote
    // server.
    var TodoList = Backbone.Collection.extend({

        // Reference to this collection's model.
        model: Todo,
        // BUG: This should really use ?no-cache to get the most up to date list -
        // but that impacts all the other item url's that are constructed from
        // this one....how to fix?
        url: '/data/todo',

        // Filter down the list of all todo items that are finished.
        done: function() {
            return this.filter(function(todo){ return todo.get('done'); });
        },

        // Filter down the list to only todo items that are still not finished.
        remaining: function() {
            return this.without.apply(this, this.done());
        },

        // We keep the Todos in sequential order, despite being saved by unordered
        // GUID in the database. This generates the next order number for new items.
        nextOrder: function() {
            if (!this.length) return 1;
            return this.last().get('order') + 1;
        },

        // Todos are sorted by their original insertion order.
        comparator: function(todo) {
            return todo.get('order');
        }

    });

    // Create our global collection of **Todos**.
     var Todos = new TodoList;

    // Todo Item View
    // --------------

    // The DOM element for a todo item...
    var TodoView = Backbone.View.extend({

        //... is a list tag.
        tagName:  "li",

        // The DOM events specific to an item.
        events: {
            "click .check"              : "toggleDone",
            "dblclick div.todo-text"    : "edit",
            "click span.todo-destroy"   : "clear",
            "keypress .todo-input"      : "updateOnEnter"
        },

        // The TodoView listens for changes to its model, re-rendering.
        initialize: function() {
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
            this.model.bind('error', this.reportError, this);
        },

        reportError: function(model, response, options) {
             var data = JSON.parse(response.responseText);
             alert(data.status || response.statusText);
        },

        // Re-render the contents of the todo item.
        render: function() {
            $(this.el).html(TodoView.template(this.model.toJSON()));
            this.setText();
            return this;
        },

        // To avoid XSS (not that it would be harmful in this particular app),
        // we use `jQuery.text` to set the contents of the todo item.
        setText: function() {
            var text = this.model.get('text');
            this.$('.todo-text').text(text);
            this.input = this.$('.todo-input');
            this.input.bind('blur', _.bind(this.close, this)).val(text);
        },

        // Toggle the `"done"` state of the model.
        toggleDone: function() {
            this.model.toggle();
        },

        // Switch this view into `"editing"` mode, displaying the input field.
        edit: function() {
            $(this.el).addClass("editing");
            this.input.focus();
        },

        // Close the `"editing"` mode, saving changes to the todo.
        close: function() {
            this.model.save({text: this.input.val()});
            $(this.el).removeClass("editing");
        },

        // If you hit `enter`, we're through editing the item.
        updateOnEnter: function(e) {
            if (e.keyCode == 13) this.close();
        },

        // Remove this view from the DOM.
        remove: function() {
            $(this.el).remove();
        },

        // Remove the item, destroy the model.
        clear: function() {
            this.model.destroy();
        }

    });

    // The Application
    // ---------------

    // Our overall **AppView** is the top-level piece of UI.
    var AppView = Backbone.View.extend({

        // Instead of generating a new element, bind to the existing skeleton of
        // the App already present in the HTML.
        el: '#todoapp',

        // Delegated events for creating new items, and clearing completed ones.
        events: {
            "keypress #new-todo":  "createOnEnter",
            "keyup #new-todo":     "showTooltip",
            "click .todo-clear a": "clearCompleted"
        },

        // At initialization we bind to the relevant events on the `Todos`
        // collection, when items are added or changed. Kick things off by
        // loading any preexisting todos that might be saved in *localStorage*.
        initialize: function() {
            this.input    = this.$("#new-todo");

            Todos.bind('add',   this.addOne, this);
            Todos.bind('reset', this.addAll, this);
            Todos.bind('all',   this.render, this);

            Todos.fetch();
        },

        // Re-rendering the App just means refreshing the statistics -- the rest
        // of the app doesn't change.
        render: function() {
            this.$('#todo-stats').html(AppView.statsTemplate({
                total:      Todos.length,
                done:       Todos.done().length,
                remaining:  Todos.remaining().length
            }));
            overflowing = isOverflowing();
        },

        // Add a single todo item to the list by creating a view for it, and
        // appending its element to the `<ul>`.
        addOne: function(todo) {
            var view = new TodoView({model: todo});
            this.$("#todo-list").append(view.render().el);
        },

        // Add all items in the **Todos** collection at once.
        addAll: function() {
            Todos.each(this.addOne);
        },

        // If you hit return in the main input field, and there is text to save,
        // create new **Todo** model persisting it to *localStorage*.
        createOnEnter: function(e) {
            var text = this.input.val();
            if (!text || e.keyCode != 13) return;
            Todos.create({text: text});
            this.input.val('');
        },

        // Clear all done todo items, destroying their models.
        clearCompleted: function() {
            _.each(Todos.done(), function(todo){ todo.destroy(); });
            return false;
        },

        // Lazily show the tooltip that tells you to press `enter` to save
        // a new todo item, after one second.
        showTooltip: function(e) {
            var tooltip = this.$(".ui-tooltip-top");
            var val = this.input.val();
            tooltip.fadeOut();
            if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
            if (val == '' || val == this.input.attr('placeholder')) return;
            var show = function(){ tooltip.show().fadeIn(); };
            this.tooltipTimeout = _.delay(show, 1000);
        }

    });

}); // gdg.todos
