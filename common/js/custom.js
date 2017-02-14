'use strict';

function imageEffect(option) {
    this.initialize(option);
    return this;
}

imageEffect.prototype = {
    option: null,
    startedAt: null,
    changeInterval: 0,
    acceleration: 1,
    timeIndex: 0,
    funcIndex: 0,
    currentIndex: 0,
    prevIndex: 0,
    nextIndex: 0,
    timeoutId: 0,
    intervalId: 0,
    resizeIntervalId: 0,
    canvas: null,
    canvasContext: null,
    layer: null,

    initialize: function (option) {
        if (!option.selector) return null;
        option.element = document.querySelector(option.selector);
        if (!option.element) return null;
        if (!option.showTime || (typeof option.showTime !== 'number' && typeof option.showTime !== 'object')) {
            option.showTime = [10000];
        }
        if (!Array.isArray(option.showTime)) option.showTime = [option.showTime];
        if (!option.step || option.step > 100 || option.step < 0) option.step = 0.5;

        option.timeLength = option.showTime.length;
        option.step = option.step / 100.00;
        option.interval = option.interval || 10;
        option.items = option.element.querySelectorAll('img');
        option.itemLength = option.items.length;
        this.acceleration = option.acceleration || 1;
        this.autoResize = (typeof option.autoResize !== 'boolean') ? true : option.autoResize;

        for (var i = 0; i < option.itemLength; i++) {
            if (option.items[i].classList) {
                if (option.items[i].classList.contains('active')) {
                    option.items[i].classList.remove('active');
                    option.items[i].style.zIndex = 10;
                    this.currentIndex = i;
                    this.prevIndex = (i - 1 < 0) ? 0 : i - 1;
                    this.nextIndex = (i + 1 < option.itemLength) ? i + 1 : 0;
                    break;
                }
            }
        }
        this.changeInterval = (option.interval * (1 / option.step));

        if (!Array.isArray(option.func)) {
            option.func = [option.func];
        }
        var funcLength = option.func.length;
        var isValid = true;
        for (var i = 0; i < funcLength; i++) {
            if (typeof this[option.func[i]] !== 'function') {
                isValid = false;
                break;
            }
        }
        if (isValid) {
            this.option = option;
            this.createCanvas();
            this.createLayer();
            this[this.option.func[this.funcIndex]](0);
            this.timeoutId = setTimeout(this.start.bind(this), this.option.showTime[this.timeIndex] - this.changeInterval);
        } else {
            console.log('Error : Invalid function name');
        }
    },

    start: function () {
        this.startedAt = 0;
        this[this.option.func[this.funcIndex]](0);
        this.intervalId = setInterval(this.update.bind(this), this.option.interval);
    },

    update: function () {
        this.startedAt += ((this.option.interval) / this.changeInterval) + (((this.option.interval) / this.changeInterval) * (this.startedAt * (this.acceleration - 1)));

        this[this.option.func[this.funcIndex]](this.startedAt);

        if (this.startedAt > 1.0) {
            this.timeIndex = this.timeIndex + 1 < this.option.timeLength ? this.timeIndex + 1 : 0;
            this.prevIndex = this.currentIndex;
            this.currentIndex = this.nextIndex;
            this.nextIndex = this.nextIndex + 1 < this.option.itemLength ? this.nextIndex + 1 : 0;
            this.funcIndex = (this.funcIndex + 1 < this.option.func.length) ? this.funcIndex + 1 : 0;
            clearInterval(this.intervalId);
            this.timeoutId = setTimeout(this.start.bind(this), this.option.showTime[this.timeIndex]);
        }
    },

    resetValue: function () {
        this.option.items[this.prevIndex].style.zIndex = 0;
        this.option.items[this.prevIndex].style.opacity = 1.0;
        this.option.items[this.prevIndex].style.top = '0px';
        this.option.items[this.prevIndex].style.left = '0px';
        this.option.items[this.currentIndex].style.opacity = 1.0;
    },

    createCanvas: function () {
        this.canvas = document.createElement('canvas');
        var wrapper = document.createElement('div');
        this.option.element.appendChild(wrapper);
        wrapper.appendChild(this.canvas);

        wrapper.style.left = '0px';
        wrapper.style.top = '0px';
        wrapper.style.bottom = '0px';
        wrapper.style.right = '0px';
        wrapper.style.zIndex = 11;
        wrapper.style.position = 'fixed';

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.left = '0px';
        this.canvas.style.top = '0px';
        this.canvas.style.bottom = '0px';
        this.canvas.style.right = '0px';
        this.canvas.style.zIndex = 12;
        this.canvasContext = this.canvas.getContext('2d');
    },

    createLayer: function () {
        this.layer = document.createElement('div');
        this.option.element.appendChild(this.layer);
        this.layer.style.width = '100%';
        this.layer.style.height = '100vh';
        this.layer.style.position = 'absolute';
        this.layer.style.zIndex = 5;
        this.layer.style.left = '0px';
        this.layer.style.top = '0px';
        this.layer.style.backgroundColor = 'black';
        this.layer.style.opacity = 0.9;
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //// Effects Functions                                                                                                                   ///
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    change: function (playback) {
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
        }
        if (playback > 1.00) {
            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.zIndex = 10;
        }
    },

    fadein: function (playback) {

        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            return;
        }
        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.opacity = 1 - playback;
    },

    // Slide in functions
    /* slideinleft: function (playback) {
     var width = window.innerWidth;
     if (playback === 0) {
     this.resetValue();

     this.option.items[this.currentIndex].style.zIndex = 9;
     this.option.items[this.nextIndex].style.zIndex = 10;
     this.option.items[this.nextIndex].style.opacity = 1.0;
     this.option.items[this.nextIndex].style.top = '0px';
     this.option.items[this.nextIndex].style.left = -width + 'px';
     return;
     }
     if (playback > 1.00) playback = 1;
     var left = (1 - playback) * -width;
     this.option.items[this.nextIndex].style.left = left + 'px';
     },

    slideinright: function (playback) {
        var width = window.innerWidth;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.top = '0px';
            this.option.items[this.nextIndex].style.left = width + 'px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var left = (1 - playback) * width;
        this.option.items[this.nextIndex].style.left = left + 'px';
    },

    slideintop: function (playback) {
        var height = window.innerHeight;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.top = -height + 'px';
            this.option.items[this.nextIndex].style.left = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var top = (1 - playback) * -height;
        this.option.items[this.nextIndex].style.top = top + 'px';
    },

    slideinbottom: function (playback) {
        var height = window.innerHeight;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.top = height + 'px';
            this.option.items[this.nextIndex].style.left = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var top = (1 - playback) * height;
        this.option.items[this.nextIndex].style.top = top + 'px';
    },
*/

    slideleftfadein: function (playback) {
        var width = window.innerWidth;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.opacity = 0.0;
            this.option.items[this.nextIndex].style.left = -width + 'px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var left = (1 - playback) * -width;
        this.option.items[this.nextIndex].style.left = left + 'px';
        this.option.items[this.nextIndex].style.opacity = playback;
    },

    sliderightfedein: function (playback) {
        var width = window.innerWidth;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.opacity = 0.0;
            this.option.items[this.nextIndex].style.top = '0px';
            this.option.items[this.nextIndex].style.left = width + 'px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var left = (1 - playback) * width;
        this.option.items[this.nextIndex].style.left = left + 'px';
        this.option.items[this.nextIndex].style.opacity = playback;
    },

    slidetopfadein: function (playback) {
        var height = window.innerHeight;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.opacity = 0.0;
            this.option.items[this.nextIndex].style.top = -height + 'px';
            this.option.items[this.nextIndex].style.left = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var top = (1 - playback) * -height;
        this.option.items[this.nextIndex].style.top = top + 'px';
        this.option.items[this.nextIndex].style.opacity = playback;
    },

    fadesmallerout: function (playback) {
        var width = window.innerWidth;
        var height = window.innerHeight;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.top = '0px';
            this.option.items[this.nextIndex].style.left = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var range = (1 - playback);
        this.option.items[this.currentIndex].style.opacity = range;
        this.option.items[this.currentIndex].style.width = range * width + 'px';
        this.option.items[this.currentIndex].style.height = range * height + 'px';

        if (playback === 1) {
            this.option.items[this.currentIndex].style.width = '100%';
            this.option.items[this.currentIndex].style.height = '100vh';
        }
    },

    fadebiggerin: function (playback) {
        var width = window.innerWidth;
        var height = window.innerHeight;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.opacity = 0.0;
            this.option.items[this.nextIndex].style.width = '0px';
            this.option.items[this.nextIndex].style.height = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        this.option.items[this.nextIndex].style.opacity = playback;
        this.option.items[this.nextIndex].style.width = playback * width + 'px';
        this.option.items[this.nextIndex].style.height = playback * height + 'px';

        if (playback === 1) {
            this.option.items[this.nextIndex].style.width = '100%';
            this.option.items[this.nextIndex].style.height = '100vh';
        }
    },

    rotatefadeout: function (playback) {
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.top = '0px';
            this.option.items[this.nextIndex].style.left = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.opacity = (1 - playback);
        this.option.items[this.currentIndex].style.transform = 'rotate(' + playback * 360 + 'deg)';
        this.option.items[this.currentIndex].style.msTransform = 'rotate(' + playback * 360 + 'deg)';
        this.option.items[this.currentIndex].style.webkittransform = 'rotate(' + playback * 360 + 'deg)';
    },

    rotatesmallerout: function (playback) {
        var width = window.innerWidth;
        var height = window.innerHeight;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.top = '0px';
            this.option.items[this.nextIndex].style.left = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var range = (1 - playback);
        this.option.items[this.currentIndex].style.opacity = (1 - playback);
        this.option.items[this.currentIndex].style.transform = 'rotate(' + playback * 360 + 'deg)';
        this.option.items[this.currentIndex].style.msTransform = 'rotate(' + playback * 360 + 'deg)';
        this.option.items[this.currentIndex].style.webkittransform = 'rotate(' + playback * 360 + 'deg)';
        this.option.items[this.currentIndex].style.width = range * width + 'px';
        this.option.items[this.currentIndex].style.height = range * height + 'px';

        if (playback === 1) {
            this.option.items[this.currentIndex].style.width = '100%';
            this.option.items[this.currentIndex].style.height = '100vh';
        }
    },

    rotatebiggerin: function (playback) {
        var width = window.innerWidth;
        var height = window.innerHeight;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.opacity = 0.0;
            this.option.items[this.nextIndex].style.top = '0px';
            this.option.items[this.nextIndex].style.left = '0px';
            return;
        }
        this.option.items[this.nextIndex].style.opacity = playback;
        this.option.items[this.nextIndex].style.transform = 'rotate(' + playback * 360 + 'deg)';
        this.option.items[this.nextIndex].style.msTransform = 'rotate(' + playback * 360 + 'deg)';
        this.option.items[this.nextIndex].style.webkittransform = 'rotate(' + playback * 360 + 'deg)';
        this.option.items[this.nextIndex].style.width = playback * width + 'px';
        this.option.items[this.nextIndex].style.height = playback * height + 'px';

        if (playback === 1) {
            this.option.items[this.nextIndex].style.width = '100%';
            this.option.items[this.nextIndex].style.height = '100vh';
        }
    },

    fadeintocenter: function (playback) {
        var width = window.innerWidth;
        var height = window.innerHeight;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.top = '0px';
            this.option.items[this.nextIndex].style.left = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.opacity = (1 - playback);
        this.option.items[this.currentIndex].style.left = playback * width / 2.0 + 'px';
        this.option.items[this.currentIndex].style.top = playback * height / 2.0 + 'px';
        this.option.items[this.currentIndex].style.width = (1 - playback) * width + 'px';
        this.option.items[this.currentIndex].style.height = (1 - playback) * height + 'px';

        if (playback === 1) {
            this.option.items[this.currentIndex].style.width = '100%';
            this.option.items[this.currentIndex].style.height = '100vh';
        }
    },

    fadeoutfromcenter: function (playback) {
        var width = window.innerWidth;
        var height = window.innerHeight;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.top = width / 2.0 + 'px';
            this.option.items[this.nextIndex].style.left = height / 2.0 + 'px';
            this.option.items[this.nextIndex].style.width = '0px';
            this.option.items[this.nextIndex].style.height = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        this.option.items[this.nextIndex].style.opacity = playback;
        this.option.items[this.nextIndex].style.width = playback * width + 'px';
        this.option.items[this.nextIndex].style.height = playback * height + 'px'
        this.option.items[this.nextIndex].style.left = (1 - playback) * width / 2.0 + 'px';
        this.option.items[this.nextIndex].style.top = (1 - playback) * height / 2.0 + 'px';

        if (playback === 1) {
            this.option.items[this.nextIndex].style.width = '100%';
            this.option.items[this.nextIndex].style.height = '100vh';
        }
    },

    modalin: function (playback) {
        var width = window.innerWidth;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.opacity = 0.0;
            this.option.items[this.nextIndex].style.width = '0px';
            this.option.items[this.nextIndex].style.left = width / 2.0 + 'px';
            return;
        }
        if (playback > 1.00) playback = 1;
        this.option.items[this.nextIndex].style.opacity = playback;
        this.option.items[this.nextIndex].style.left = (1 - playback) * width / 2.0 + 'px';
        this.option.items[this.nextIndex].style.width = playback * width + 'px';

        if (playback === 1) {
            this.option.items[this.nextIndex].width = '100%';
            this.option.items[this.nextIndex].style.left = '0px';
        }
    },

    modalout: function (playback) {
        var width = window.innerWidth;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.left = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        this.option.items[this.currentIndex].style.opacity = range;
        this.option.items[this.currentIndex].style.width = range * width + 'px';
        this.option.items[this.currentIndex].style.left = playback * width / 2.0 + 'px';

        if (playback === 1) {
            this.option.items[this.currentIndex].style.width = '100%';
            this.option.items[this.currentIndex].style.left = '0px';
        }
    },

    doorleftout: function (playback) {
        var width = window.innerWidth;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.left = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        this.option.items[this.currentIndex].style.opacity = range;
        this.option.items[this.currentIndex].style.width = range * width + 'px';

        if (playback === 1) {
            this.option.items[this.currentIndex].style.width = '100%';
        }
    },

    doorrightout: function (playback) {
        var width = window.innerWidth;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.left = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        this.option.items[this.currentIndex].style.opacity = range;
        this.option.items[this.currentIndex].style.left = playback * width + 'px';
        this.option.items[this.currentIndex].style.width = range * width + 'px';

        if (playback === 1) {
            this.option.items[this.currentIndex].style.width = '100%';
            this.option.items[this.currentIndex].style.left = '0px';
        }
    },

    doorupout: function (playback) {
        var height = window.innerHeight;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.left = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        this.option.items[this.currentIndex].style.opacity = range;
        this.option.items[this.currentIndex].style.height = range * height + 'px';

        if (playback === 1) {
            this.option.items[this.currentIndex].style.height = '100vh';
        }
    },

    doordownout: function (playback) {
        var height = window.innerHeight;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.left = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        this.option.items[this.currentIndex].style.opacity = range;
        this.option.items[this.currentIndex].style.top = playback * height + 'px';
        this.option.items[this.currentIndex].style.height = range * height + 'px';

        if (playback === 1) {
            this.option.items[this.currentIndex].style.height = '100vh';
            this.option.items[this.currentIndex].style.top = '0px';
        }
    },

    shutfadeout: function (playback) {
        var height = window.innerHeight;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.top = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        this.option.items[this.currentIndex].style.opacity = range;
        this.option.items[this.currentIndex].style.height = range * height + 'px';
        this.option.items[this.currentIndex].style.top = playback * height / 2.0 + 'px';

        if (playback === 1) {
            this.option.items[this.currentIndex].style.height = '100vh';
            this.option.items[this.currentIndex].style.top = '0px';
        }
    },

    shutfadein: function (playback) {
        var height = window.innerHeight;
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.opacity = 0.0;
            this.option.items[this.nextIndex].style.top = height / 2.0 + 'px';
            this.option.items[this.nextIndex].style.height = '0px';
            return;
        }
        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        this.option.items[this.nextIndex].style.opacity = playback;
        this.option.items[this.nextIndex].style.height = playback * height + 'px';
        this.option.items[this.nextIndex].style.top = range * height / 2.0 + 'px';

        if (playback === 1) {
            this.option.items[this.nextIndex].style.height = '100vh';
            this.option.items[this.nextIndex].style.top = '0px';
        }
    },

    fadecirclein: function (playback) {
        var width = window.innerWidth;
        var height = window.innerHeight;
        this.fadeintocenter(playback);
        if (playback === 0)return;
        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.borderRadius = playback * 100 + '%';

        if (playback === 1) {
            this.option.items[this.currentIndex].style.borderRadius = '0';
        }
    },

    fadecircleout: function (playback) {
        this.fadeoutfromcenter(playback);
        if (playback === 0) return;
        if (playback > 1.00) playback = 1;
        this.option.items[this.nextIndex].style.borderRadius = (1 - playback) * 100 + '%';

        if (playback === 1) {
            this.option.items[this.nextIndex].style.borderRadius = '0';
        }
    },

    pushinleft: function (playback) {
        this.slideinleft(playback);
        if (playback === 0) return;
        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.left = (playback * 0.75) * window.innerWidth + 'px';
    },

    pushinright: function (playback) {
        this.slideinright(playback);
        if (playback === 0) return;
        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.left = (playback * 0.75) * -window.innerWidth + 'px';
    },

    pushintop: function (playback) {
        this.slideintop(playback);
        if (playback === 0) return;
        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.top = (playback * 0.75) * window.innerHeight + 'px';

        if (playback === 1) {
            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.currentIndex].style.top = '0px';
        }
    },

    pushinbottom: function (playback) {
        this.slideinbottom(playback);
        if (playback === 0) return;
        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.top = (playback * 0.75) * -window.innerHeight + 'px';

        if (playback === 1) {
            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.currentIndex].style.top = '0px';
        }
    },

    turninhorizontal: function (playback) {
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.top = '0px';
            this.option.items[this.nextIndex].style.left = '0px';
            this.option.items[this.nextIndex].style.transform = 'rotateY(180deg)';
            this.option.items[this.nextIndex].style.msTransform = 'rotateY(180deg)';
            this.option.items[this.nextIndex].style.webkittransform = 'rotateY(180deg)';
            return;
        }
        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.transform = 'rotateY(' + playback * 180 + 'deg)';
        this.option.items[this.currentIndex].style.msTransform = 'rotateY(' + playback * 180 + 'deg)';
        this.option.items[this.currentIndex].style.webkittransform = 'rotateY(' + playback * 180 + 'deg)';
        this.option.items[this.nextIndex].style.transform = 'rotateY(' + (180 - playback * 180) + 'deg)';
        this.option.items[this.nextIndex].style.msTransform = 'rotateY(' + (180 - playback * 180) + 'deg)';
        this.option.items[this.nextIndex].style.webkittransform = 'rotateY(' + (180 - playback * 180) + 'deg)';
        if (playback > 0.500) {
            this.option.items[this.currentIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.zIndex = 10;
        }

        if (playback === 1) {
            this.option.items[this.currentIndex].style.transform = 'rotateY(0deg)';
            this.option.items[this.currentIndex].style.msTransform = 'rotateY(0deg)';
            this.option.items[this.currentIndex].style.webkittransform = 'rotateY(0deg)';
        }
    },

    turninvertical: function (playback) {
        if (playback === 0) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 10;
            this.option.items[this.nextIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            this.option.items[this.nextIndex].style.top = '0px';
            this.option.items[this.nextIndex].style.left = '0px';
            this.option.items[this.nextIndex].style.transform = 'rotateX(180deg)';
            this.option.items[this.nextIndex].style.msTransform = 'rotateX(180deg)';
            this.option.items[this.nextIndex].style.webkittransform = 'rotateX(180deg)';
            return;
        }
        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.transform = 'rotateX(' + playback * 180 + 'deg)';
        this.option.items[this.currentIndex].style.msTransform = 'rotateX(' + playback * 180 + 'deg)';
        this.option.items[this.currentIndex].style.webkittransform = 'rotateX(' + playback * 180 + 'deg)';
        this.option.items[this.nextIndex].style.transform = 'rotateX(' + (180 - playback * 180) + 'deg)';
        this.option.items[this.nextIndex].style.msTransform = 'rotateX(' + (180 - playback * 180) + 'deg)';
        this.option.items[this.nextIndex].style.webkittransform = 'rotateX(' + (180 - playback * 180) + 'deg)';
        if (playback > 0.500) {
            this.option.items[this.currentIndex].style.zIndex = 9;
            this.option.items[this.nextIndex].style.zIndex = 10;
        }

        if (playback === 1) {
            this.option.items[this.currentIndex].style.transform = 'rotateX(0deg)';
            this.option.items[this.currentIndex].style.msTransform = 'rotateX(0deg)';
            this.option.items[this.currentIndex].style.webkittransform = 'rotateX(0deg)';
        }
    },

    fadezoomout: function (playback) {
        var width = window.innerWidth;
        var height = window.innerHeight;
        this.fadein(playback);
        if (playback === 0) return;
        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.width = (playback + 1) * width + 'px'
        this.option.items[this.currentIndex].style.left = -(playback) * width / 2.0 + 'px';
        this.option.items[this.currentIndex].style.height = (playback + 1) * height + 'px'
        this.option.items[this.currentIndex].style.top = -(playback) * height / 2.0 + 'px';

        if (playback === 1) {
            this.option.items[this.currentIndex].style.width = '100%';
            this.option.items[this.currentIndex].style.left = '0px';
            this.option.items[this.currentIndex].style.height = '100vh';
            this.option.items[this.currentIndex].style.top = '0px';
        }
    },
    /*
     test : function (playback) {
     var width = window.innerWidth;
     var height = window.innerHeight;
     if(playback === 0){
     this.resetValue();

     this.option.items[this.currentIndex].style.zIndex = 10;
     this.option.items[this.nextIndex].style.zIndex = 9;
     this.option.items[this.nextIndex].style.opacity = 1.0;
     this.option.items[this.nextIndex].style.top = '0px';
     this.option.items[this.nextIndex].style.left = '0px';
     return;
     }
     if(playback > 1.0) playback = 1;

     this.option.items[this.currentIndex].style.opacity = 0.0;
     this.canvasContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
     this.canvasContext.drawImage(this.option.items[this.currentIndex], 0, 0, window.innerWidth, window.innerHeight);

     var currentPos = Math.round((playback) * 16);
     for(var i = 0; i < currentPos; i++){
     this.canvasContext.clearRect(i % 4, i / 4, width / 4.0, height / 4.0);
     }
     }
     */
};
