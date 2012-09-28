# Javascript Event Handling

Setting event handlers using jQuery

Because jQuery makes it so easy to control your event handlers among other things, we will be using it
throughout this presentation

# $.on

on() is the new way to set handlers in jQuery.  It replaces bind() and live() which have both been deprecated

http://api.jquery.com/on/

    var jQueryWrappedElements = $('.a-class');  // find all elements in the dom with class="a-class" and return a jQuery wrapped "array" of them

    jQueryWrappedElements.on('mousedown', myCallbackFn);  // attach an event listener to the element(s) so every time the mousedown event fires on any of the elements, myCallbackFn is called

    $('.a-class').on('mousedown', myCallbackFunction); // shorthand version

You can also 

If you know of $.bind(), and are new to $.on(), this is the exact same thing as 

    $('.a-class').on('mousedown', callbackFn);
    ===
    $('.a-class').bind('mousedown', callbackFn);

This only works for elements that are in the DOM when you call on().
If you want to add event listeners to elements that are not in the dom, you can use on in a different way
Just pass in a second selector within which jQuery will search for newly created elements.
This is similar to the way live worked, except it is more efficient due to the second selector.

Let's say you have a slideshow application, and you dynamically generate slides after runtime, and can't
add event listeners on item creation.  You can use on() to get callbacks on items generated after the fact.

$('.slideshow-container').on('mousedown', '.slide' callbackFn);

Here's how this works.  First we grab elements with class slideshow-container.
Then, jQuery listens to mousedown events on the slideshow-container, but ignores them unless they
originate from an element with class=slide
The more general wrapper class called, the more costly this call is, so make it as specific as possible.

# $.off()

$.off() is used to unbind an event handler bound with $.on().  It only works if you are using a named (not anyonymous) function.

$('body').on('mousedown', onMouseDown);
// listening
$('body').off('mousedown', onMouseDown);
// not listening

Do not do this:
$('body').on('mousedown', function () {
    // some stuff to do
});
$('body').off('mousedown', function () {
    // some stuff to do
});
Just because the functions do the same thing does not mean they are the same function.

Let's say we are trying to listen for a user's mouse down, move and up events.  However, we only care about the move and up events if the user's mouse is down.
We can have a mousedown listener on all the time, and in that callback, we turn on the listeners for move and up, and off later

http://jsfiddle.net/NKwrH/2/

$(document).ready(init);

function init () {
    $('body').on('mousedown', onDown);
}

function onDown() {
    $('body').on('mousemove', onMove);
    $('body').on('mouseup mouseleave', onUp);
    // stuff done when the user clicks
}

function onMove() {
    // stuff done when the user is holding down their mouse button
}

function onUp() {
    // stuff done when the user's mouse leaves the body or lets up on the mouse button
    $('body').off('mousemove', onMove);
    $('body').off('mouseup mouseleave', onUp);
}

# Event Bubbling

Let's say that you have an image in a div in the body of the document.  If the user clicks the image, that event is first sent to the image, then it bubbles the div, then it bubbles the body.  

This only matters if you have event listeners bound to more than one of the elements, as it will dictate the order in which the events are called.  

The other way of doing this is called Event Capturing which simply reverses the order.  A click on the image send a click
event to the body, then the div, then the image.  The war between these two goes back to the days of netscape.
Netscape supported both, but IE only supported bubbling.  IE 9 is the first version of IE to support capturing, and since
jQuery's is all about providing cross browser support, it only supports bubbling.

# The Event Object

When your callback function is called, the first argument passed is the event object which contains useful data and menthods
related to the event.  

The part of the event object I find myself using the most are the methods preventDefault() and stopPropagation()

preventDefault allows you to cancel the browser's default behavior for that action