function Slime(_this, options) {
    //default options
    var o = {
        transitionSpeed: 400,
        cssPrefix: 'slime-',
        borderPadding: 24,
        disableIfFit: true,
        onClick: undefined,
        onSetup: undefined //setup callback
    };

    //merge user options into defaults
    options && mergeObjects(o, options);

    var noop = function() {},
        bounceSpeed = 300,
        overlapModifier = 1 / (o.transitionSpeed / 60),
        maxOverlap = 150,
        animationTimer,
        scrollerBlock,
        contentWidth,
        contentFits,
        slimeWidth,
        positionMin,
        burrito,
        currentPosition = 0;

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

        changePos(pos, speed!==undefined?speed:o.transitionSpeed);
    }

    function scrollToElement(element, speed) {
        scrollTo(-element.offsetLeft, speed!==undefined?speed:o.transitionSpeed);
    }

    function moveElementToViewport(element, padding, speed) {
        var pos = -element.offsetLeft + (padding!==undefined?padding:o.borderPadding),
            width = element.offsetWidth + 2*(padding!==undefined?padding:o.borderPadding);

        if (currentPosition < pos) {
            scrollTo(pos, speed!==undefined?speed:o.transitionSpeed);  
        }
        else if (currentPosition - slimeWidth > pos - width) {
            scrollTo(pos - width + slimeWidth, speed!==undefined?speed:o.transitionSpeed);
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

                var posDiff = speed.x*Math.pow(Math.abs(speed.x), 0.5)*o.transitionSpeed/2;
                var targetPosition = currentPosition + posDiff;

                var targetOverlap = Math.abs(Math.max(targetPosition, 0) || Math.min((targetPosition - positionMin), 0));
                var overlap = Math.min(targetOverlap*overlapModifier, maxOverlap);
                var overlapDiff = targetOverlap - overlap;
                var targetSpeed = Math.max(0, o.transitionSpeed - (overlapDiff / (Math.abs(posDiff) + 1))*o.transitionSpeed);

                if (targetPosition > 0) {
                    bounce(targetSpeed, overlap, 0);
                }
                else if (targetPosition < positionMin) {
                    bounce(targetSpeed, positionMin - overlap, positionMin);
                }
                else {
                    changePos(targetPosition, o.transitionSpeed);
                }
            },
            click: function(event) {
                o.onClick && o.onClick(event);
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
            addEvent(images[i], 'load error', onWidthChange)
        }

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

        //get widths and init touch if necessary
        onWidthChange();

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

        scrollTo: function(pos) {
            scrollTo(parseInt(-pos, 10));
        },

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