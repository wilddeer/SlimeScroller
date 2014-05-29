function SlimeScroller(_this, options) {
    var noop = function() {},
        o = options || {},
        transitionSpeed = 500,
        bounceSpeed = 300,
        animationTimer,
        scrollerBlock,
        contentWidth,
        slimeWidth,
        positionMin,
        burrito,
        currentPosition = 0;

    o.cssPrefix = o.cssPrefix || '';
    o.borderPadding = o.borderPadding || 24;
    o.onClick = o.onClick || noop;

    var classes = {
        inactive: o.cssPrefix + 'inactive',
        active: o.cssPrefix + 'active',
        drag: o.cssPrefix + 'drag',
        scroller: o.cssPrefix + 'scroller'
    };

    // feature detects
    // properly prefixed property stored in case property is suported
    // `false` for unsupported properties
    var supportedProps = {
        transform: testProp('transform'),
        transition: testProp('transition')
    };

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

    //changes the position of the slider (in px) with a given speed (in ms)
    function changePos(pos, speed) {
        var time = speed?speed+'ms':'';

        scrollerBlock.style[supportedProps.transition+'Duration'] = time;
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

    function getPos() {
        return parseFloat(getComputedStyle(scrollerBlock)[supportedProps.transform].split(/,\s*/)[4]);
    }

    function getPosFallback() {
        return currentPosition;
    }

    function scrollTo(pos) {
        if (pos > 0) {
            pos = 0;
        }
        else if (pos < positionMin) {
            pos = positionMin;
        }

        changePos(pos, transitionSpeed);
    }

    function scrollToElement(element) {
        scrollTo(-element.offsetLeft);
    }

    function moveElementToViewport(element, padding) {
        var pos = -element.offsetLeft + (padding || o.borderPadding),
            width = element.offsetWidth + 2*(padding || o.borderPadding);

        if (currentPosition < pos) {
            scrollTo(pos);  
        }
        else if (currentPosition - slimeWidth > pos - width) {
            scrollTo(pos - width + slimeWidth);
        }
    }

    //init touch events
    function touchInit() {
        var startPosition;

        burrito = EventBurrito(_this, {
            clickTolerance: 5,
            start: function(event, start) {
                //firefox doesn't want to apply the cursor from `:active` CSS rule, have to add a class :-/
                addClass(_this, classes.drag);
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
                //remove the drag class
                removeClass(_this, classes.drag);

                if (Math.abs(diff.x) < 6 && diff.time < 150) return;

                speed.x /= 2;

                var posDiff = speed.x*Math.pow(Math.abs(speed.x), 0.5)*transitionSpeed/2;
                var targetPosition = currentPosition + posDiff;

                var targetOverlap = Math.abs(Math.max(targetPosition, 0) || Math.min((targetPosition - positionMin), 0));
                var overlap = Math.pow(targetOverlap, 0.7) / (Math.pow(targetOverlap, 0.7)/(transitionSpeed) + 1);
                console.log(targetOverlap);
                console.log(overlap);
                //var overlap = targetOverlap / (transitionSpeed / 70);
                var overlapDiff = targetOverlap - overlap;
                var targetSpeed = Math.max(0, transitionSpeed - (overlapDiff / (Math.abs(posDiff) + 1))*transitionSpeed);

                if (targetPosition > 0) {
                    (function() {
                        if (targetSpeed) {
                            changePos(overlap, targetSpeed);
                            addEvent(scrollerBlock, 'transitionend webkitTransitionEnd', bounceBack);
                        }
                        else {
                            bounceBack();
                        }

                        function bounceBack() {
                            changePos(0, bounceSpeed);

                            removeEvent(scrollerBlock, 'transitionend webkitTransitionEnd', bounceBack);
                        }
                    })();
                }
                else if (targetPosition < positionMin) {
                    (function() {
                        if (targetSpeed) {
                            changePos(positionMin - overlap, targetSpeed);
                            addEvent(scrollerBlock, 'transitionend webkitTransitionEnd', bounceBack);
                        }
                        else {
                            bounceBack();
                        }

                        function bounceBack() {
                            changePos(positionMin, bounceSpeed);

                            removeEvent(scrollerBlock, 'transitionend webkitTransitionEnd', bounceBack);
                        }
                    })();
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

    function widthChanged() {
        getWidths();
        scrollTo(currentPosition);
    }

    function getWidths() {
        slimeWidth = _this.offsetWidth;
        contentWidth = scrollerBlock.offsetWidth;
        positionMin = slimeWidth - contentWidth;
    }

    function setup() {
        //If the UA doesn't support css transforms or transitions -- use fallback functions.
        //Separate functions instead of checks for better performance.
        if (!supportedProps.transform || !!window.opera) setPos = setPosFallback;
        if (!supportedProps.transition || !!window.opera) changePos = changePosFallback;
        if (!supportedProps.transform || !!window.opera || !window.getComputedStyle) getPos = getPosFallback;

        scrollerBlock = _this.children[0];

        addEvent(_this, 'focus', function(event) {
            _this.scrollLeft = 0;
            setTimeout(function() {
                _this.scrollLeft = 0;
            }, 0);
            event.target && moveElementToViewport(event.target);
        }, true);

        /* set classes */
        addClass(scrollerBlock, classes.scroller);
        addClass(_this, classes.active);
        removeClass(_this, classes.inactive);

        /* get widths */
        getWidths();

        /* init touch events */
        touchInit();

        /* watch for width changes */
        addEvent(window, 'resize', widthChanged);
        addEvent(window, 'orientationchange', widthChanged);
    }

    setup();

    return {
        getClicksAllowed: function() {
            return burrito.getClicksAllowed();
        },

        scrollTo: scrollTo,

        scrollToElement: scrollToElement,

        moveElementToViewport: moveElementToViewport
    }
}