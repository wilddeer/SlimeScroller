/*!
 * Slime touch scroller
 * v. 0.11.0 | https://github.com/wilddeer/SlimeScroller
 * Copyright Oleg Korsunsky | http://wd.dizaina.net/
 *
 * Depends on Event Burrito (included) | https://github.com/wilddeer/Event-Burrito
 * MIT License
 */
function Slime(_this, options) {
    var noop = function() {},
        transitionSpeed = 400,
        bounceSpeed = 300,
        overlapModifier = 1 / (transitionSpeed / 60),
        maxOverlap = 150,
        animationTimer,
        scrollerBlock,
        contentWidth,
        contentFits,
        slimeWidth,
        positionMin,
        burrito,
        currentPosition = 0;

    //default options
    var o = {
        cssPrefix: 'slime-',
        borderPadding: 24,
        disableIfFit: true,
        onClick: noop,
        onSetup: undefined //setup callback
    };

    //merge user options into defaults
    options && mergeObjects(o, options);

    var classes = {
        inactive: o.cssPrefix + 'inactive',
        active: o.cssPrefix + 'active',
        grabbing: o.cssPrefix + 'grabbing',
        drag: o.cssPrefix + 'drag',
        scroller: o.cssPrefix + 'scroller'
    };

    //feature detects
    //properly prefixed property stored in case property is suported
    //`false` for unsupported properties
    var supportedProps = {
        transform: testProp('transform'),
        transition: testProp('transition')
    };

    function mergeObjects(targetObj, sourceObject) {
        for (key in sourceObject) {
            if (sourceObject.hasOwnProperty(key)) {
                targetObj[key] = sourceObject[key];
            }
        }
    }

    function testProp(prop) {
        var prefixes = ['Webkit', 'Moz', 'O', 'ms'],
            block = document.createElement('div');

        if (block.style[prop] !== undefined) return prop;

        prop = prop.charAt(0).toUpperCase() + prop.slice(1);
        for (var i in prefixes) {
            if (block.style[prefixes[i]+prop] !== undefined) return prefixes[i]+prop;
        }

        return false;
    }

    function addEvent(el, events, func, bool) {
        if (!(events = events.split(' '))) return;

        for (var i = events.length - 1; i >= 0; i--) {
            el.addEventListener? el.addEventListener(events[i], func, !!bool): el.attachEvent('on'+events[i], func);
        };
    }

    function removeEvent(el, events, func, bool) {
        if (!(events = events.split(' '))) return;

        for (var i = events.length - 1; i >= 0; i--) {
            el.removeEventListener? el.removeEventListener(events[i], func, !!bool): el.detachEvent('on'+events[i], func);
        };
    }

    function addClass(el, cl) {
        if (!new RegExp('(\\s|^)'+cl+'(\\s|$)').test(el.className)) {
            el.className += ' ' + cl;
        }
    }

    function removeClass(el, cl) {
        el.className = el.className.replace(new RegExp('(\\s+|^)'+cl+'(\\s+|$)', 'g'), ' ').replace(/^\s+|\s+$/g, '');
    }

    //changes position of the slider (in px) with a given speed (in ms)
    function changePos(pos, speed) {
        scrollerBlock.style[supportedProps.transition+'Duration'] = speed?speed+'ms':'';
        setPos(Math.floor(pos));
    }

    //fallback to `setInterval` animation for UAs with no CSS transitions
    function changePosFallback(pos, speed) {
        pos = Math.floor(pos);

        animationTimer && clearInterval(animationTimer);

        if (!speed) {
            setPos(pos);
            return;
        }

        var startTime = +new Date,
            startPos = currentPosition;

        animationTimer = setInterval(function() {
            //rough bezier emulation
            var diff, y,
                elapsed = +new Date - startTime,
                f = elapsed / speed,
                bezier = [0, 0.7, 1, 1];

            function getPoint(p1, p2) {
                return (p2-p1)*f + p1;
            }
            
            if (f >= 1) {
                setPos(pos);
                clearInterval(animationTimer);
                return;
            }
        
            diff = pos - startPos;

            y = getPoint(
                    getPoint(getPoint(bezier[0], bezier[1]), getPoint(bezier[1], bezier[2])),
                    getPoint(getPoint(bezier[1], bezier[2]), getPoint(bezier[2], bezier[3]))
                    );

            setPos(Math.floor(y*diff + startPos));
        }, 15);
    }

    //sets the position of the slider (in px)
    function setPos(pos) {
        scrollerBlock.style[supportedProps.transform] = 'translateX('+pos+'px)';

        currentPosition = pos;
    }

    //`setPos` fallback for UAs with no CSS transforms support
    function setPosFallback(pos) {
        scrollerBlock.style.left = pos+'px';

        currentPosition = pos;
    }

    function bounce(speed, turnPos, finalPos) {
        if (speed) {
            changePos(turnPos, speed);
            addEvent(scrollerBlock, 'transitionend webkitTransitionEnd', bounceBack);
        }
        else {
            bounceBack();
        }

        function bounceBack() {
            changePos(finalPos, bounceSpeed);

            removeEvent(scrollerBlock, 'transitionend webkitTransitionEnd', bounceBack);
        }
    }

    function bounceFallback(speed, turnPos, finalPos) {
        speed && changePos(turnPos, speed);
        setTimeout(function() {
            changePos(finalPos, bounceSpeed);
        }, speed);
    }

    function getPos() {
        return parseFloat(getComputedStyle(scrollerBlock)[supportedProps.transform].split(/,\s*/)[4]);
    }

    function getPosFallback() {
        return currentPosition;
    }

    function scrollTo(pos, speed) {
        if (pos > 0) {
            pos = 0;
        }
        else if (pos < positionMin) {
            pos = positionMin;
        }

        changePos(pos, speed!==undefined?speed:transitionSpeed);
    }

    function scrollToElement(element, speed) {
        scrollTo(-element.offsetLeft, speed!==undefined?speed:transitionSpeed);
    }

    function moveElementToViewport(element, padding, speed) {
        var pos = -element.offsetLeft + (padding || o.borderPadding),
            width = element.offsetWidth + 2*(padding || o.borderPadding);

        if (currentPosition < pos) {
            scrollTo(pos, speed!==undefined?speed:transitionSpeed);  
        }
        else if (currentPosition - slimeWidth > pos - width) {
            scrollTo(pos - width + slimeWidth, speed!==undefined?speed:transitionSpeed);
        }
    }

    //init touch events
    function touchInit() {
        var startPosition;

        burrito = EventBurrito(_this, {
            clickTolerance: 5,
            start: function(event, start) {
                //firefox doesn't want to apply the cursor from `:active` CSS rule, have to add a class :-/
                addClass(_this, classes.grabbing);
                changePos(startPosition = getPos());
            },
            move: function(event, start, diff, speed) {
                var linearPosition = startPosition + diff.x,
                    overlap = Math.max(linearPosition, 0) || Math.min((linearPosition - positionMin), 0);

                if (Math.abs(diff.x) < 6 && diff.time < 150) return;

                diff.x -= overlap - overlap / (Math.abs(overlap)/slimeWidth*2 + 1);

                //change the position of the slider appropriately
                changePos(startPosition + diff.x);
            },
            end: function(event, start, diff, speed) {
                //remove the grabbing class
                removeClass(_this, classes.grabbing);

                if (Math.abs(diff.x) < 6 && diff.time < 150) return;

                speed.x /= 2;

                var posDiff = speed.x*Math.pow(Math.abs(speed.x), 0.5)*transitionSpeed/2;
                var targetPosition = currentPosition + posDiff;

                var targetOverlap = Math.abs(Math.max(targetPosition, 0) || Math.min((targetPosition - positionMin), 0));
                var overlap = Math.min(targetOverlap*overlapModifier, maxOverlap);
                var overlapDiff = targetOverlap - overlap;
                var targetSpeed = Math.max(0, transitionSpeed - (overlapDiff / (Math.abs(posDiff) + 1))*transitionSpeed);

                if (targetPosition > 0) {
                    bounce(targetSpeed, overlap, 0);
                }
                else if (targetPosition < positionMin) {
                    bounce(targetSpeed, positionMin - overlap, positionMin);
                }
                else {
                    changePos(targetPosition, transitionSpeed);
                }
            },
            click: function(event) {
                o.onClick(event);
            }
        });
    }

    function onWidthChange() {
        getWidths();
        checkFit();
        scrollTo(currentPosition, 0);
        if ((!contentFits || !o.disableIfFit) && !burrito) {
            touchInit();
            addClass(_this, classes.drag);
        }
        else if (contentFits && burrito && o.disableIfFit) {
            burrito.kill();
            burrito = undefined;
            removeClass(_this, classes.drag);
        }
    }

    function getWidths() {
        slimeWidth = _this.offsetWidth;
        contentWidth = scrollerBlock.offsetWidth;
        positionMin = slimeWidth - contentWidth;
    }

    function checkFit() {
        return contentFits = slimeWidth >= contentWidth;
    }

    function setup() {
        //If the UA doesn't support css transforms or transitions -- use fallback functions.
        //Separate functions instead of checks for better performance.
        if (!supportedProps.transform || !!window.opera) setPos = setPosFallback;
        if (!supportedProps.transition || !!window.opera) {
            changePos = changePosFallback;
            bounce = bounceFallback;
        }
        if (!supportedProps.transform || !!window.opera || !window.getComputedStyle) getPos = getPosFallback;

        scrollerBlock = document.createElement('div');

        //wrap children
        for (var i = 0, l = _this.children.length; i < l; i++) {
            scrollerBlock.appendChild(_this.children[0]);
        }

        _this.appendChild(scrollerBlock);

        //recalc the size when images load
        var images = scrollerBlock.getElementsByTagName('img');

        for (var i = images.length - 1; i >= 0; i--) {
            addEvent(scrollerBlock, 'load error', onWidthChange);
        };

        //prevent focus bug (see http://wd.dizaina.net/en/internet-maintenance/js-sliders-and-the-tab-key/)
        //and move focused element to viewport
        addEvent(_this, 'focus', function(event) {
            _this.scrollLeft = 0;
            setTimeout(function() {
                _this.scrollLeft = 0;
            }, 0);
            event.target && moveElementToViewport(event.target);
        }, true);

        //set classes
        addClass(scrollerBlock, classes.scroller);
        addClass(_this, classes.active);
        removeClass(_this, classes.inactive);

        //get widths
        onWidthChange();

        //init touch events
        //touchInit();

        //watch for width changes
        addEvent(window, 'resize', onWidthChange);
        addEvent(window, 'orientationchange', onWidthChange);

        //API callback, timeout to expose the API first
        setTimeout(function() {
            o.onSetup && o.onSetup();
        }, 0);
    }

    setup();

    //expose the API
    return {
        getClicksAllowed: function() {
            return burrito.getClicksAllowed();
        },

        scrollTo: scrollTo,

        scrollToElement: scrollToElement,

        moveElementToViewport: moveElementToViewport,

        //invoke this when Slime's width or display state is changed
        recalcWidth: onWidthChange
    }
}

//if jQuery is available -- create a plugin
if (window.jQuery) {
    (function($) {
        $.fn.Slime = function(options) {
            this.each(function() {
                $(this).data('Slime', Slime(this, options));
            });
        };
    })(window.jQuery);
}
/*!
 * Event Burrito is a touch / mouse / pointer event unifier
 * https://github.com/wilddeer/Event-Burrito
 * Copyright Oleg Korsunsky | http://wd.dizaina.net/
 *
 * MIT License
 */
function EventBurrito(_this, options) {

    var o = options || {},
        noop = function() {};

    o.clickTolerance = o.clickTolerance || 0;
    o.preventScroll = o.preventScroll || false;
    o.mouse = o.mouse !== undefined? o.mouse: true;
    o.start = o.start || noop;
    o.move = o.move || noop;
    o.end = o.end || noop;
    o.click = o.click || noop;

    var support = {
            pointerEvents: !!window.navigator.pointerEnabled,
            msPointerEvents: !!window.navigator.msPointerEnabled
        },
        start = {},
        diff = {},
        speed = {},
        stack = [],
        listeners = [],
        isScrolling,
        eventType,
        clicksAllowed = true, //flag allowing default click actions (e.g. links)
        eventModel = (support.pointerEvents? 1 : (support.msPointerEvents? 2 : 0)),
        events = [
            ['touchstart', 'touchmove', 'touchend', 'touchcancel'], //touch events
            ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'], //pointer events
            ['MSPointerDown', 'MSPointerMove', 'MSPointerUp', 'MSPointerCancel'], //IE10 pointer events
            ['mousedown', 'mousemove', 'mouseup', false] //mouse events
        ],
        //some checks for different event types
        checks = [
            //touch events
            function(e) {
                //if it's multitouch or pinch move -- skip the event
                return (e.touches && e.touches.length > 1) || (e.scale && e.scale !== 1);
            },
            //pointer events
            function(e) {
                //if event is not primary (other pointers during multitouch),
                //if left mouse button is not pressed,
                //if mouse drag is disabled and event is not touch -- skip it!
                return !e.isPrimary || e.buttons !== 1 || (!o.mouse && e.pointerType !== 'touch' && e.pointerType !== 'pen');
            },
            //IE10 pointer events
            function(e) {
                //same checks as in pointer events
                return !e.isPrimary || (e.buttons && e.buttons !== 1) || (!o.mouse && e.pointerType !== e.MSPOINTER_TYPE_TOUCH && e.pointerType !== e.MSPOINTER_TYPE_PEN);
            },
            //mouse events
            function(e) {
                //if left mouse button is not pressed -- skip the event
                //in IE7-8 `buttons` is not defined, in IE9 LMB is 0
                return (e.buttons && e.buttons !== 1);
            }
        ];

    function addEvent(el, event, func, bool) {
        if (!event) return;

        el.addEventListener? el.addEventListener(event, func, !!bool): el.attachEvent('on'+event, func);

        //return event remover to easily remove anon functions later
        return {
            remove: function() {
                removeEvent(el, event, func, bool);
            }
        };
    }

    function removeEvent(el, event, func, bool) {
        if (!event) return;

        el.removeEventListener? el.removeEventListener(event, func, !!bool): el.detachEvent('on'+event, func);
    }

    function preventDefault(event) {
        event.preventDefault? event.preventDefault() : event.returnValue = false;
    }

    function getDiff(event) {
        diff = {
            x: (eventType? event.clientX : event.touches[0].clientX) - start.x,
            y: (eventType? event.clientY : event.touches[0].clientY) - start.y,

            time: Number(new Date) - start.time
        };

        if (diff.time - stack[stack.length - 1].time) {
            for (var i = 0; i < stack.length - 1 && diff.time - stack[i].time > 80; i++);

            speed = {
                x: (diff.x - stack[i].x) / (diff.time - stack[i].time),
                y: (diff.y - stack[i].y) / (diff.time - stack[i].time)
            };

            if (stack.length >= 5) stack.shift();
            stack.push({x: diff.x, y: diff.y, time: diff.time});
        }
    }

    function tStart(event, eType) {
        clicksAllowed = true;
        eventType = eType; //leak event type

        if (checks[eventType](event)) return;

        //add event listeners to the document, so that the slider
        //will continue to recieve events wherever the pointer is
        addEvent(document, events[eventType][1], tMove);
        addEvent(document, events[eventType][2], tEnd);
        addEvent(document, events[eventType][3], tEnd);

        //fixes WebKit's cursor while dragging
        if (eventType) preventDefault(event);

        //remember starting time and position
        start = {
            x: eventType? event.clientX : event.touches[0].clientX,
            y: eventType? event.clientY : event.touches[0].clientY,

            time: Number(new Date)
        };

        //reset
        isScrolling = undefined;
        diff = {x:0, y:0, time: 0};
        speed = {x:0, y:0};
        stack = [{x:0, y:0, time: 0}];

        o.start(event, start);
    }

    function tMove(event) {
        //if user is trying to scroll vertically -- do nothing
        if ((!o.preventScroll && isScrolling) || checks[eventType](event)) return;

        getDiff(event);

        if (Math.abs(diff.x) > o.clickTolerance || Math.abs(diff.y) > o.clickTolerance) clicksAllowed = false; //if there was a move -- deny all the clicks before the next touchstart

        //check whether the user is trying to scroll vertically
        if (isScrolling === undefined && eventType !== 3) {
            //assign and check `isScrolling` at the same time
            if (isScrolling = (Math.abs(diff.x) < Math.abs(diff.y)) && !o.preventScroll) return;
        }

        preventDefault(event); //Prevent scrolling

        o.move(event, start, diff, speed);
    }

    function tEnd(event) {
        eventType && getDiff(event);

        //IE likes to focus the link after touchend.
        //Since we dont' want to disable the outline completely for accessibility reasons,
        //we just defocus it after touch and disable the outline for `:active` links in css.
        //This way the outline will remain visible when tabbing through the links.
        event.target && event.target.blur && event.target.blur();

        //remove the event listeners
        detachEvents();

        o.end(event, start, diff, speed);
    }

    //remove event listeners from the document
    function detachEvents() {
        removeEvent(document, events[eventType][1], tMove);
        removeEvent(document, events[eventType][2], tEnd);
        removeEvent(document, events[eventType][3], tEnd);
    }

    function init() {
        //bind the touchstart
        listeners.push(addEvent(_this, events[eventModel][0], function(e) {tStart(e, eventModel);}));
        //prevent stuff from dragging when using mouse
        listeners.push(addEvent(_this, 'dragstart', preventDefault));

        //bind mousedown if necessary
        if (o.mouse && !eventModel) {
            listeners.push(addEvent(_this, events[3][0], function(e) {tStart(e, 3);}));
        }

        //No clicking during touch
        listeners.push(addEvent(_this, 'click', function(event) {
            clicksAllowed? o.click(event): preventDefault(event);
        }));
    }

    init();

    return {
        getClicksAllowed: function() {
            return clicksAllowed;
        },
        kill: function() {
            for (var i = listeners.length - 1; i >= 0; i--) {
                listeners[i].remove();
            }
        }
    }
}