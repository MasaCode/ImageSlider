'use strict';

function ImageSlider(option) {
    this.initialize(option);
    return this;
}

ImageSlider.prototype = {
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
    imageOrder: [],
    orderLength: null,
    currentOrderIndex: 0,
    resizeIntervalId: 0,
    canvas: null,
    canvasContext: null,
    layer: null,
    isReset: false,
    currentScreen: {
        width: 0,
        height: 0,
    },
    previousScreen: {
        width: 0,
        height: 0,
    },
    imageSize: {
        width: 0,
        height: 0,
    },
    autoResize: true,
    resizeOption: {
        canResizeCurrent: true,
        canResizeNext: true,
        canSetCurrentPos: true,
        canSetNextPos: true
    },

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
        this.changeInterval = (option.interval * (1 / option.step));

        if (!option.imageOrder || !Array.isArray(option.imageOrder)) {
            for (var i = 0; i < option.itemLength; i++) {
                this.imageOrder[i] = i;
            }
        } else {
            this.imageOrder = option.imageOrder;
        }
        this.orderLength = this.imageOrder.length;
        this.currentOrderIndex = 0;
        this.currentIndex = this.imageOrder[0];
        this.prevIndex = this.imageOrder[this.orderLength - 1];
        this.nextIndex = 1 < this.orderLength ? this.imageOrder[1] : this.imageOrder[0];
        option.items[this.currentIndex].style.zIndex = 0;

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

        if (this.orderLength === 1) {
            console.log('Error : Invalid image order...Please Enter more than 1');
            return null;
        }
        if (!isValid) {
            console.log('Error : Invalid function name');
            return null;
        }

        this.option = option;
        this.createCanvas();
        this.createLayer();
        this[this.option.func[this.funcIndex]](0);
        this.timeoutId = setTimeout(this.start.bind(this), this.option.showTime[this.timeIndex] - this.changeInterval);
        if (this.autoResize) {
            this.resizeIntervalId = setInterval(this.onResize.bind(this), 100);
        } else {
            // setting window onresize event to execute onResize function.
            this.setResizeEvent();
        }
    },

    start: function () {
        this.startedAt = 0;
        if (this.autoResize) clearInterval(this.resizeIntervalId);
        this[this.option.func[this.funcIndex]](0);
        this.intervalId = setInterval(this.update.bind(this), this.option.interval);
        this.isReset = true;
    },

    update: function () {
        this.startedAt += ((this.option.interval) / this.changeInterval) + (((this.option.interval) / this.changeInterval) * (this.startedAt * (this.acceleration - 1)));

        this[this.option.func[this.funcIndex]](this.startedAt);

        if (this.startedAt > 1.0) {
            this.timeIndex = this.timeIndex + 1 < this.option.timeLength ? this.timeIndex + 1 : 0;
            this.currentOrderIndex = this.currentOrderIndex + 1 < this.orderLength ? this.currentOrderIndex + 1 : 0;
            this.funcIndex = (this.funcIndex + 1 < this.option.func.length) ? this.funcIndex + 1 : 0;
            this.option.items[this.currentIndex].style.zIndex = -3;
            this.option.items[this.nextIndex].style.zIndex = 0;
            this.isReset = false;
            this.setResizeOption();
            clearInterval(this.intervalId);
            if (this.autoResize) this.resizeIntervalId = setInterval(this.onResize.bind(this), 100);
            var tempIndex = this.currentOrderIndex + 1 < this.orderLength ? this.currentOrderIndex + 1 : 0;
            if (this.imageOrder[tempIndex] !== null) {
                this.prevIndex = this.currentIndex;
                this.currentIndex = this.nextIndex;
                this.nextIndex = this.imageOrder[tempIndex];
                this.timeoutId = setTimeout(this.start.bind(this), this.option.showTime[this.timeIndex]);
            }
        }
    },

    setResizeEvent: function () {
        var timer = false;
        var _self = this;
        window.onresize = function () {
            if (timer !== false) {
                clearTimeout(timer);
            }
            timer = setTimeout(function () {
                _self.onResize();
            }, 25);
        };
    },

    onResize: function () {
        var size;
        this.setScreenSize();
        if (this.currentScreen.width === this.previousScreen.width && this.currentScreen.height === this.previousScreen.height && this.autoResize) {
            return;
        }
        if (this.canvas) {
            this.canvas.width = this.currentScreen.width;
            this.canvas.height = this.currentScreen.height;
            this.canvasContext = this.canvas.getContext('2d');
        }

        if (this.resizeOption.canResizeCurrent) {
            size = this.scaleToFit(this.option.items[this.currentIndex], this.resizeOption.canSetCurrentPos);
        }
        if (this.resizeOption.canResizeNext) {
            size = this.scaleToFit(this.option.items[this.nextIndex], this.resizeOption.canSetNextPos);
        }

        if (!this.autoResize) {
            this.setImageSize(size);
        }
    },

    scaleToFit: function (image, canSetPosition) {
        var rasio = 0;
        var imageWidth;
        var imageHeight;
        var top = 0, left = 0;
        var cssText = '';

        rasio = this.currentScreen.width / image.width;
        imageWidth = image.width * rasio;
        imageHeight = image.height * rasio;

        if (imageHeight < this.currentScreen.height) {
            rasio = this.currentScreen.height / imageHeight;
            imageWidth = rasio * imageWidth;
            imageHeight = rasio * imageHeight;
        }

        image.width = imageWidth.toString();
        image.height = imageHeight.toString();
        cssText += 'width : ' + imageWidth + 'px;';
        cssText += 'height : ' + imageHeight + 'px;';

        if (canSetPosition !== false) {
            top = (this.currentScreen.height - imageHeight) / 2.0;
            left = (this.currentScreen.width - imageWidth) / 2.0;
            cssText += 'top : ' + top + 'px;';
            cssText += 'left : ' + left + 'px;';
        }
        image.style.cssText += cssText;
        return {width: imageWidth, height: imageHeight};
    },

    setScreenSize: function () {
        this.previousScreen.width = this.currentScreen.width;
        this.previousScreen.height = this.currentScreen.height;
        this.currentScreen.width = window.innerWidth;
        this.currentScreen.height = window.innerHeight;
    },

    setImageSize: function (imageSize) {
        if (!imageSize.width || !imageSize.height) return;

        this.imageSize.width = imageSize.width;
        this.imageSize.height = imageSize.height;
    },

    setResizeOption: function () {
        this.resizeOption.canResizeCurrent = true;
        this.resizeOption.canResizeNext = true;
        this.resizeOption.canSetCurrentPos = true;
        this.resizeOption.canSetNextPos = true;
    },

    resetValue: function () {
        if (this.prevIndex !== null) {
            this.option.items[this.prevIndex].style.opacity = 1.0;
        }
        this.option.items[this.currentIndex].style.opacity = 1.0;

        this.setScreenSize();

        for (var i = 0; i < this.option.itemLength; i++) {
            this.scaleToFit(this.option.items[i]);
        }

        this.imageSize.width = this.option.items[this.currentIndex].width;
        this.imageSize.height = this.option.items[this.currentIndex].height;
    },

    createCanvas: function () {
        this.canvas = document.createElement('canvas');
        var wrapper = document.createElement('div');
        this.option.element.appendChild(wrapper);
        wrapper.appendChild(this.canvas);
        wrapper.style.cssText = ''.concat(
            'left : 0px;', 'top : 0px;', 'bottom : 0px;', 'right : 0px;', 'z-index : 11;', 'position : fixed;'
        );

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.cssText = ''.concat(
            'left : 0px;', 'left : 0px;', 'bottom : 0px;', 'right : 0px;', 'z-index : 12;'
        );
        this.canvasContext = this.canvas.getContext('2d');
    },

    createLayer: function () {
        this.layer = document.createElement('div');
        this.layer.style.cssText = ''.concat(
            'width : 100%;', 'height : 100vh;', 'position : absolute;', 'z-index : -2;', 'left : 0px;', 'top : 0px;', 'background-color : black;', 'opacity : 1.0;'
        );
        this.option.element.appendChild(this.layer);
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //// Effects Functions                                                                                                                   ///
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    change: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.zIndex = -1;
        }
        if (this.autoResize) {
            this.setScreenSize();
            this.scaleToFit(this.option.items[this.currentIndex]);
            this.scaleToFit(this.option.items[this.nextIndex]);
        }

        if (playback > 1.00) {
            this.option.items[this.currentIndex].style.zIndex = -3;
            this.option.items[this.nextIndex].style.zIndex = 0;
        }
    },

    fadein: function (playback) {

        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.opacity = 1.0;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            this.scaleToFit(this.option.items[this.currentIndex]);
            this.scaleToFit(this.option.items[this.nextIndex]);
        }

        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.opacity = 1 - playback;
    },

    slideleftfadein: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : 0;', 'opacity : 0.0;', 'left : ' + (-this.option.items[this.nextIndex].width) + 'px;'
            );
            this.resizeOption.canSetNextPos = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            this.scaleToFit(this.option.items[this.currentIndex]);
            var size = this.scaleToFit(this.option.items[this.nextIndex], false);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var diff = (this.imageSize.width - window.innerWidth) / 2.0;
        var left = (1 - playback) * -this.imageSize.width - diff;
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'left : ' + left + 'px;', 'top : ' + this.option.items[this.currentIndex].style.top + ';', 'opacity : ' + playback + ';'
        );
    },

    sliderightfedein: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : 0;', 'opacity : 0.0;', 'left : ' + this.option.items[this.nextIndex].width + 'px;'
            );
            this.resizeOption.canSetNextPos = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            this.scaleToFit(this.option.items[this.currentIndex]);
            var size = this.scaleToFit(this.option.items[this.nextIndex], false);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var diff = (this.imageSize.width - window.innerWidth) / 2.0;
        var left = (1 - playback) * this.imageSize.width - diff;
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'left : ' + left + 'px;', 'top : ' + this.option.items[this.currentIndex].style.top + ';', 'opacity : ' + playback + ';'
        );
    },

    slidetopfadein: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : 0;', 'opacity : 0.0;', 'top : ' + (-this.option.items[this.nextIndex].height) + 'px;'
            );
            this.resizeOption.canSetNextPos = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            this.scaleToFit(this.option.items[this.currentIndex]);
            var size = this.scaleToFit(this.option.items[this.nextIndex], false);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var diff = (this.imageSize.height - window.innerHeight) / 2.0;
        var top = (1 - playback) * -(this.imageSize.height) - diff;
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'top : ' + top + 'px;', 'left : ' + this.option.items[this.currentIndex].style.left + ';', 'opacity : ' + playback + ';'
        );
    },

    slidebottomfadein: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : 0;', 'opacity : 0.0;', 'top : ' + (-this.option.items[this.nextIndex].height) + 'px;'
            );
            this.resizeOption.canSetNextPos = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            this.scaleToFit(this.option.items[this.currentIndex]);
            var size = this.scaleToFit(this.option.items[this.nextIndex], false);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var diff = (this.imageSize.height - window.innerHeight) / 2.0;
        var top = (1 - playback) * this.imageSize.height - diff;
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'top : ' + top + 'px;', 'left : ' + this.option.items[this.currentIndex].style.left + ';', 'opacity : ' + playback + ';'
        );
    },

    fadesmallerout: function (playback) {
        var width = window.innerWidth;
        var height = window.innerHeight;
        var cssText = '';
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : -1;', 'opacity : 1.0;'
            );
            this.resizeOption.canResizeCurrent = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.nextIndex]);
            this.setImageSize(size);
        }
        if (playback > 1.00) playback = 1;
        var range = (1 - playback);
        cssText += 'opacity : ' + range + ';';
        cssText += 'width : ' + range * this.imageSize.width + 'px;';
        cssText += 'height : ' + range * this.imageSize.height + 'px;';

        if (playback === 1) {
            cssText += 'width : ' + this.imageSize.width + 'px;';
            cssText += 'height : ' + this.imageSize.height + 'px;';
        }
        this.option.items[this.currentIndex].style.cssText += cssText;
    },

    fadebiggerin: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : 0;', 'opacity : 0.0;', 'width : 0px;', 'height : 0px;'
            );
            this.resizeOption.canResizeNext = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.currentIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'opacity : ' + playback + ';', 'width : ' + playback * this.imageSize.width + 'px;', 'height : ' + playback * this.imageSize.height + 'px;',
            'left : ' + this.option.items[this.currentIndex].style.left + ';', 'top : ' + this.option.items[this.currentIndex].style.top + ';'
        );
    },

    rotatefadeout: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : -1;', 'opacity : 1.0;'
            );
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            this.scaleToFit(this.option.items[this.currentIndex]);
            this.scaleToFit(this.option.items[this.nextIndex]);
        }
        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'opacity : ' + (1 - playback) + ';', 'transform : rotate(' + playback * 360 + 'deg);',
            'msTransform : rotate(' + playback * 360 + 'deg);', 'webkittransform rotate(' + playback * 360 + 'deg);'
        );
    },

    rotatesmallerout: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : -1;', 'opacity : 1.0;'
            );
            this.resizeOption.canResizeCurrent = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.nextIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var range = (1 - playback);
        var cssText = '';
        cssText += 'opacity : ' + (1 - playback) + ';';
        cssText += 'transform : rotate(' + playback * 360 + 'deg);';
        cssText += 'msTransform : rotate(' + playback * 360 + 'deg);';
        cssText += 'webkittransform : rotate(' + playback * 360 + 'deg);';
        cssText += 'width : ' + range * this.imageSize.width + 'px;';
        cssText += 'height : ' + range * this.imageSize.height + 'px;';

        if (playback === 1) {
            cssText += 'width : ' + this.imageSize.width + 'px;';
            cssText += 'height : ' + this.imageSize.height + 'px;';
        }
        this.option.items[this.currentIndex].style.cssText += cssText;
    },

    rotatebiggerin: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : 0;', 'opacity : 0.0;', 'width : 0px;', 'height : 0px;'
            );
            this.resizeOption.canResizeNext = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.currentIndex]);
            this.setImageSize(size);
        }

        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'opacity : ' + playback + ';', 'transform : rotate(' + playback * 360 + 'deg);', 'msTransform : rotate(' + playback * 360 + 'deg);',
            'webkittransform : rotate(' + playback * 360 + 'deg);', 'width : ' + playback * this.imageSize.width + 'px;',
            'height : ' + playback * this.imageSize.height + 'px;', 'left : ' + this.option.items[this.currentIndex].style.left + ';',
            'top : ' + this.option.items[this.currentIndex].style.top + ';'
        );
    },

    fadeintocenter: function (playback) {
        var width = window.innerWidth;
        var height = window.innerHeight;
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : -1;', 'opacity : 1.0;'
            );
            this.resizeOption.canResizeCurrent = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.nextIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var diffX = (this.imageSize.width - width) / 2.0;
        var diffY = (this.imageSize.height - height) / 2.0;
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'opacity : ' + (1 - playback) + ';', 'left : ' + (playback * width / 2.0 - ((1 - playback) * diffX)) + 'px;',
            'top : ' + (playback * height / 2.0 - ((1 - playback) * diffY)) + 'px;', 'width : ' + ((1 - playback) * this.imageSize.width) + 'px;',
            'height : ' + ((1 - playback) * this.imageSize.height) + 'px;'
        );

        if (playback === 1) {
            this.option.items[this.currentIndex].style.width = this.imageSize.width + 'px';
            this.option.items[this.currentIndex].style.height = this.imageSize.height + 'px';
        }
    },

    fadeoutfromcenter: function (playback) {
        var width = window.innerWidth;
        var height = window.innerHeight;
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : 0;', 'opacity : 1.0;', 'top : ' + height / 2.0 + 'px;',
                'left : ' + width / 2.0 + 'px;', 'width : 0px;', 'height : 0px;'
            );
            this.resizeOption.canResizeNext = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.currentIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var diffX = (this.imageSize.width - width) / 2.0;
        var diffY = (this.imageSize.height - height) / 2.0;
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'opacity : ' + playback + ';', 'width : ' + playback * this.imageSize.width + 'px;', 'height : ' + playback * this.imageSize.height + 'px;',
            'left : ' + ((1 - playback) * this.imageSize.width / 2.0 - (playback) * diffX) + 'px;',
            'top : ' + ((1 - playback) * this.imageSize.height / 2.0 - (playback) * diffY) + 'px;'
        );

        if (playback === 1) {
            this.option.items[this.nextIndex].style.width = this.imageSize.width + 'px';
            this.option.items[this.nextIndex].style.height = this.imageSize.height + 'px';
        }
    },

    modalin: function (playback) {
        var width = window.innerWidth;
        if (playback === 0 && !this.isReset) {
            if (this.option.items[this.nextIndex].style.width === '0px') return;
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : 0;', 'opacity : 0.0;', 'width : 0px;', 'left : ' + this.imageSize.width / 2.0 + 'px;'
            );
            this.resizeOption.canResizeNext = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.currentIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var diff = (this.imageSize.width - width) / 2.0;
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'opacity : ' + playback + ';', 'left : ' + ((1 - playback) * width / 2.0 - diff) + 'px;', 'width : ' + playback * this.imageSize.width + 'px;',
            'height : ' + this.imageSize.height + 'px;', 'top : ' + this.option.items[this.currentIndex].style.top + ';'
        );

        if (playback === 1) {
            this.option.items[this.nextIndex].style.width = this.imageSize.width + 'px';
        }
    },

    modalout: function (playback) {
        var width = window.innerWidth;
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : -1;', 'opacity : 1.0;'
            );
            this.resizeOption.canResizeCurrent = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.nextIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        var diff = (this.imageSize.width - width) / 2.0;
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'opacity : ' + range + ';', 'width : ' + range * this.imageSize.width + 'px;', 'height : ' + this.imageSize.height + 'px;',
            'left : ' + (playback * this.imageSize.width / 2.0 - (1 - playback) * diff) + 'px;',
            'top : ' + this.option.items[this.nextIndex].style.top + ';'
        );

        if (playback === 1) {
            this.option.items[this.currentIndex].style.width = this.imageSize.width + 'px';
        }
    },

    doorleftout: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : -1;', 'opacity : 1.0;'
            );
            this.resizeOption.canResizeCurrent = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.nextIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'opacity : ' + range + ';', 'width : ' + range * this.imageSize.width + 'px;',
            'top : ' + this.option.items[this.nextIndex].style.top + ';', 'left : ' + this.option.items[this.nextIndex].style.left + ';',
            'height : ' + this.imageSize.height + 'px;'
        );

        if (playback === 1) {
            this.option.items[this.currentIndex].style.width = this.imageSize.width + 'px';
        }
    },

    doorrightout: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : -1;', 'opacity : 1.0;'
            );
            this.resizeOption.canResizeCurrent = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.nextIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        var diff = (this.imageSize.width - window.innerWidth) / 2.0;
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'opacity : ' + range + ';', 'top : ' + this.option.items[this.nextIndex].style.top + ';',
            'left : ' + (playback * this.imageSize.width - diff) + 'px;',
            'width : ' + range * this.imageSize.width + 'px;', 'height : ' + this.imageSize.height + 'px;'
        );

        if (playback === 1) {
            this.option.items[this.currentIndex].style.width = this.imageSize.width + 'px';
        }
    },

    doorupout: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : -1;', 'opacity : 1.0;'
            );
            this.resizeOption.canResizeCurrent = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.nextIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'opacity : ' + range + ';', 'height : ' + range * this.imageSize.height + 'px;',
            'width : ' + this.imageSize.width + 'px;', 'left : ' + this.option.items[this.nextIndex].style.left + ';',
            'top : ' + this.option.items[this.nextIndex].style.top + ';'
        );

        if (playback === 1) {
            this.option.items[this.currentIndex].style.height = this.imageSize.height + 'px';
        }
    },

    doordownout: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : -1;', 'opacity : 1.0;'
            );
            this.resizeOption.canResizeCurrent = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.nextIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        var diff = (this.imageSize.height - window.innerHeight) / 2.0;
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'opacity : ' + range + ';', 'top : ' + (playback * this.imageSize.height - diff) + 'px;',
            'left : ' + this.option.items[this.nextIndex].style.left + ';',
            'height : ' + range * this.imageSize.height + 'px;', 'width : ' + this.imageSize.width + 'px;'
        );

        if (playback === 1) {
            this.option.items[this.currentIndex].style.height = this.imageSize.height + 'px';
        }
    },

    shutfadeout: function (playback) {
        var height = window.innerHeight;
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : -1;', 'opacity : 1.0;'
            );
            this.resizeOption.canResizeCurrent = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.nextIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        var diff = (this.imageSize.height - height) / 2.0;
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'opacity : ' + range + ';', 'height : ' + range * this.imageSize.height + 'px;',
            'width : ' + this.imageSize.width + 'px;', 'top : ' + (playback * height / 2.0 - (1 - playback) * diff) + 'px;',
            'left : ' + this.option.items[this.nextIndex].style.left + ';'
        );

        if (playback === 1) {
            this.option.items[this.currentIndex].style.height = this.imageSize.height + 'px';
        }
    },

    shutfadein: function (playback) {
        var height = window.innerHeight;
        if (playback === 0 && !this.isReset) {
            if (this.option.items[this.nextIndex].style.height === '0px') return;
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : 0;', 'opacity : 0.0;', 'top : ' + (height / 2.0) + 'px;', 'height : 0px;'
            );
            this.resizeOption.canResizeNext = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.currentIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var range = 1 - playback;
        var diff = (this.imageSize.height - height) / 2.0;
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'opacity : ' + playback + ';', 'height : ' + (playback * this.imageSize.height) + 'px;',
            'width : ' + this.imageSize.width + 'px;', 'top : ' + (range * height / 2.0 - (playback * diff)) + 'px;',
            'left : ' + this.option.items[this.currentIndex].style.left + ';'
        );

        if (playback === 1) {
            this.option.items[this.nextIndex].style.height = this.imageSize.height + 'px';
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
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : 0;', 'opacity : 1.0;', 'left : ' + (-this.option.items[this.nextIndex].width) + 'px;'
            );
            this.resizeOption.canSetCurrentPos = false;
            this.resizeOption.canSetNextPos = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            this.scaleToFit(this.option.items[this.currentIndex], false);
            var size = this.scaleToFit(this.option.items[this.nextIndex], false);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var diff = (this.option.items[this.nextIndex].width - window.innerWidth) / 2.0;
        var left = (1 - playback) * -this.option.items[this.nextIndex].width - diff;
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'left : ' + left + 'px;', 'height : ' + this.imageSize.height + 'px;'
        );
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'left : ' + ((playback * 0.75) * this.imageSize.width - (1 - playback) * 0.75 * diff) + 'px;',
            'height : ' + this.imageSize.height + 'px;'
        );
    },

    pushinright: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : 0;', 'opacity : 1.0;', 'left : ' + (this.option.items[this.nextIndex].width) + 'px;'
            );
            this.resizeOption.canSetCurrentPos = false;
            this.resizeOption.canSetNextPos = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            this.scaleToFit(this.option.items[this.currentIndex], false);
            var size = this.scaleToFit(this.option.items[this.nextIndex], false);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var diff = (this.option.items[this.nextIndex].width - window.innerWidth) / 2.0;
        var left = (1 - playback) * this.option.items[this.nextIndex].width - diff;
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'left : ' + left + 'px;', 'height : ' + this.imageSize.height + 'px;'
        );
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'left : ' + ((playback * 0.75) * -this.imageSize.width - (1 - playback) * 0.75 * diff) + 'px;',
            'height : ' + this.imageSize.height + 'px;'
        );
    },

    pushintop: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : 0;', 'opacity : 1.0;', 'top : ' + (-this.option.items[this.nextIndex].height) + 'px;'
            );
            this.resizeOption.canSetCurrentPos = false;
            this.resizeOption.canSetNextPos = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            this.scaleToFit(this.option.items[this.currentIndex], false);
            var size = this.scaleToFit(this.option.items[this.nextIndex], false);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var diff = (this.option.items[this.nextIndex].height - window.innerHeight) / 2.0;
        var top = (1 - playback) * -(this.option.items[this.nextIndex].height) - diff;
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'top : ' + top + 'px;', 'width : ' + this.imageSize.width + 'px;'
        );
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'top : ' + ((playback * 0.75) * this.imageSize.height - (1 - playback) * 0.75 * diff) + 'px;',
            'width : ' + this.imageSize.width + 'px;'
        );
    },

    pushinbottom: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : 0;', 'opacity : 1.0;', 'top : ' + (this.option.items[this.nextIndex].height) + 'px;'
            );
            this.resizeOption.canSetCurrentPos = false;
            this.resizeOption.canSetNextPos = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            this.scaleToFit(this.option.items[this.currentIndex], false);
            var size = this.scaleToFit(this.option.items[this.nextIndex], false);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var diff = (this.imageSize.height - window.innerHeight) / 2.0;
        var top = (1 - playback) * this.option.items[this.nextIndex].height - diff;
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'top : ' + top + 'px;', 'width : ' + this.imageSize.width + 'px;'
        );
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'top : ' + ((playback * 0.75) * -this.imageSize.height - (1 - playback) * 0.75 * diff) + 'px;',
            'width : ' + this.imageSize.width + 'px;'
        );
    },

    turninhorizontal: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : -1;', 'opacity : 1.0;', 'transform : rotateY(180deg);',
                'msTransform : rotateY(180deg);', 'webkittransform : rotateY(180deg);'
            );
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            this.scaleToFit(this.option.items[this.currentIndex]);
            var size = this.scaleToFit(this.option.items[this.nextIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'transform : rotateY(' + playback * 180 + 'deg);',
            'msTransform : rotateY(' + playback * 180 + 'deg);',
            'webkittransform : rotateY(' + playback * 180 + 'deg);'
        );
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'transform : rotateY(' + (180 - playback * 180) + 'deg);',
            'msTransform : rotateY(' + (180 - playback * 180) + 'deg);',
            'webkittransform : rotateY(' + (180 - playback * 180) + 'deg);'
        );
        if (playback > 0.500) {
            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.zIndex = 0;
        }

        if (playback === 1) {
            this.option.items[this.currentIndex].style.transform = 'rotateY(0deg)';
            this.option.items[this.currentIndex].style.msTransform = 'rotateY(0deg)';
            this.option.items[this.currentIndex].style.webkittransform = 'rotateY(0deg)';
        }
    },

    turninvertical: function (playback) {
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : -1;', 'opacity : 1.0;', 'transform : rotateX(180deg);',
                'msTransform : rotateX(180deg);', 'webkittransform : rotateX(180deg);'
            );
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            this.scaleToFit(this.option.items[this.currentIndex]);
            var size = this.scaleToFit(this.option.items[this.nextIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'transform : rotateX(' + playback * 180 + 'deg);',
            'msTransform : rotateX(' + playback * 180 + 'deg);',
            'webkittransform : rotateX(' + playback * 180 + 'deg);'
        );
        this.option.items[this.nextIndex].style.cssText += ''.concat(
            'transform : rotateX(' + (180 - playback * 180) + 'deg);',
            'msTransform : rotateX(' + (180 - playback * 180) + 'deg);',
            'webkittransform : rotateX(' + (180 - playback * 180) + 'deg);'
        );
        if (playback > 0.500) {
            this.option.items[this.currentIndex].style.zIndex = -1;
            this.option.items[this.nextIndex].style.zIndex = 0;
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
        if (playback === 0 && !this.isReset) {
            this.resetValue();

            this.option.items[this.currentIndex].style.zIndex = 0;
            this.option.items[this.nextIndex].style.cssText += ''.concat(
                'z-index : -1;', 'opacity : 1.0;'
            );
            this.resizeOption.canResizeCurrent = false;
            return;
        }
        if (this.autoResize) {
            this.setScreenSize();
            var size = this.scaleToFit(this.option.items[this.nextIndex]);
            this.setImageSize(size);
        }

        if (playback > 1.00) playback = 1;
        var diffX = (this.imageSize.width - width) / 2.0;
        var diffY = (this.imageSize.height - height) / 2.0;
        this.option.items[this.currentIndex].style.cssText += ''.concat(
            'width : ' + (playback + 1) * this.imageSize.width + 'px;', 'left : ' + (-(playback) * this.imageSize.width / 2.0 - (1 - playback) * diffX) + 'px;',
            'height : ' + (playback + 1) * this.imageSize.height + 'px;',
            'top : ' + (-(playback) * this.imageSize.height / 2.0 - (1 - playback) * diffY) + 'px;',
            'opacity : ' + (1 - playback) + ';'
        );

        if (playback === 1) {
            this.option.items[this.currentIndex].style.width = this.imageSize.width + 'px';
            this.option.items[this.currentIndex].style.height = this.imageSize.height + 'px';
        }
    },
    /*
     test : function (playback) {
     var width = window.innerWidth;
     var height = window.innerHeight;
     if(playback === 0){
     this.resetValue();

     this.option.items[this.currentIndex].style.zIndex = 0;
     this.option.items[this.nextIndex].style.zIndex = -1;
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
