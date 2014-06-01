#Slime touch scroller

Responsive touch-enabled scroller

- Works with mouse, [Touch Events](http://www.w3.org/TR/touch-events/), [Pointer Events](http://www.w3.org/TR/pointerevents/), old [IE10 Pointer Events](http://msdn.microsoft.com/en-us/library/ie/hh673557\(v=vs.85\).aspx)
- Responsive, works on iPhones, Androids, Windows Phones, Blackberries, Windows 8 devices
- IE7+ compatible
- Library agnostic. If jQuery is available, registers itself as a plugin.
- Uses CSS3 transforms &amp; animations, falls back to timer animations when necessary
- Only 6.5 Kb minified
- Perfomance-optimized `touch` functions
- API and callback functions for extensibility
- [Doesn't break](http://wd.dizaina.net/en/internet-maintenance/js-sliders-and-the-tab-key/) when <kbd>tab</kbd>&rsquo;bing

##Kit

- **[slimescroller.min.js](https://raw.github.com/wilddeer/SlimeScroller/master/dist/slimescroller.min.js)** -- minified production script
- **[slimescroller.css](https://raw.github.com/wilddeer/SlimeScroller/master/dist/slimescroller.css)** -- styles required for proper functioning

##Usage

HTML markup:

    <div class="slime slime-inactive" id="slime">
      <div> ... </div>

      <div> ... </div>

      <div> ... </div>
    </div>

Javascript:

    var scroller = Slime(document.getElementById('slime'));

Or javascript + jQuery:

    $('.slime').Slime();
    
`slime-inactive` class is not required. It is replaced with `slime-active` during setup.

Place anything you want within the Slime's block. All the elements will recieve `display: inline-block`.

##Settings

Slime can take settings object as an optional second parameter (first when using jQuery). Default settings:

    {
      //transition time when changing slides, ms
      transitionSpeed: 400,

      //Prefix to be used with Slime classes,
      //such as `inactive`, `active`, `drag`, etc.
      //Don't forget to change the stylesheet appropriately!
      cssPrefix: 'slime-',

      //determines padding (in px) from the element to the edge of the container
      //when using `scrollToElement()` (see API) or in case some inner element
      //catches focus
      borderPadding: 24,
      
      //disable dragging if content fits into the container
      disableIfFit: true,

      //Callback function, invoked when proper click happens
      //(not after dragging).
      //Recieves click event object as a parameter
      onClick: undefined,
    
      //callback function, invoked after setup
      onSetup: undefined
    }

Example:

    var scroller = Slime(document.getElementById('slime'), {
      borderPadding: 50,
      disableIfFit: false,
      onSetup: function(n) {
        console.log('Slime setup successful!');
      }
    });

##API

Slime exposes a set of functions upon installation. These functions can be used to controll the scroller externally:

###`scrollTo(pos)`

Change scroll position to `pos` (in `px`).

###`scrollToElement(element, speed)`

Scroll to element within the scroller's block.

`element` - HTML node;

`speed` - speed in ms, *optional*.

###`moveElementToViewport(element, padding, speed)`

Move element to viewport.

`element` - HTML node;

`padding` - padding from the element to the edge of the container, *optional*;  

`speed` - speed in ms, *optional*.

###`recalcWidth()`

Recalculate Slime's width. Usefull when the container width is changed. Width recalculation runs automatically on window resize and device orientation change.

Example:

    var scroller = Slime(document.getElementById('slime')).

    //scroll 120px from the start
    scroller.scrollTo(120);
    
##License

[MIT license](http://opensource.org/licenses/MIT).
