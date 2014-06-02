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

Slime can take settings object as an optional second parameter (first when using jQuery).

###Options

####`transitionSpeed`

*integer, defaut: `400`*

Transition time in `ms`.

####`cssPrefix`

*string, default: `slime-`*

Prefix to be used with Slime classes, such as `inactive`, `active`, `drag`, etc. Don't forget to change the stylesheet appropriately!

####`borderPadding`

*integer, defaut: `24`*

Determines padding (in `px`) from the element to the edge of the container when using `scrollToElement()` (see API) or in case some inner element catches focus.
      
####`disableIfFit`

*bool, default: `true`*

Disable dragging if content fits into the container.

###Callbacks

####`onClick`

*function(event)*

Callback function, invoked when proper click happens (not during or immediately after mousedrag). Recieves click event object as a parameter.

####`onSetup`

*function()*

Callback function, invoked after setup.

####`onPosChange`

*function(pos)*

Callback function, invoked when scroller position is changed. Recieves position as a parameter.

Don't put anything heavy in this one, as it directly influences scroller's performance.

###Examples

JS:

```javascript
var scroller = Slime(document.getElementById('slime'), {
  borderPadding: 50,
  disableIfFit: false,
  onSetup: function() {
    console.log('Slime setup successful!');
  }
});
```

JS + jQuery:

```javascript
$('#slime').Slime({
  borderPadding: 50,
  disableIfFit: false,
  onSetup: function() {
    console.log('Slime setup successful!');
  }
});
```

##API

Slime exposes a set of functions upon installation. These functions can be used to controll the scroller externally:

####`scrollTo(pos)`

Change scroll position to `pos` (in `px`).

####`scrollToElement(element, speed)`

Scroll to element within the scroller's block.

`element` - HTML node;

`speed` - speed in `ms`, *optional*.

####`moveElementToViewport(element, padding, speed)`

Move element to viewport.

`element` - HTML node;

`padding` - padding from the element to the edge of the container, *optional*;  

`speed` - speed in `ms`, *optional*.

####`getClicksAllowed()`

Useful when listening for clicks on some inner element. Returns `true` if the click was an actual proper click, or `false` in case it was a result of mousedrag.

####`getPos()`

Returns current position of the scroller.

####`recalcWidth()`

Recalculate Slime's width. Usefull when Slime's width or `display` state is changed. Width recalculation runs automatically on window resize and device orientation change.

###Examples

JS:

```javascript
//init SLime scroller and save the API object
var scroller = Slime(document.getElementById('slime'));

//scroll 120px from the start
scroller.scrollTo(120);
```

JS + jQuery:

```javascript
//save jQuery link to scroller's block
var scroller = $('#slime');

//init Slime scroller
scroller.Slime();

//scroll 120px from the start
scroller.data('Slime').scrollTo(120);
```
    
##License

[MIT license](http://opensource.org/licenses/MIT).
