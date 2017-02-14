function masaCharacter(canvasID) {
    this.initialize(canvasID);
}

masaCharacter.prototype = {
    startedAt: null,
    currentIndex: 0,
    startIndex: 0,
    totalLength: 0,
    directionLength: 0,
    direction: 0,
    prevDirection: 0,
    step: 0,
    canvas: null,
    context: null,
    tickCount: 0,
    maxTick: 0,
    isMoving: false,

    position: {
        x: 0,
        y: 0,
    },
    screen: {
        width: 0,
        height: 0,
    },
    character: {
        width: 0,
        height: 0,
        src: 'common/images/character.png',
        image: null,
    },

    initialize: function (canvasID) {

        this.totalLength = 36;
        this.directionLength = this.totalLength / 4;
        this.step = 10;
        this.character.width = 40;
        this.character.height = 52;
        this.screen.width = window.innerWidth;
        this.screen.height = window.innerHeight;
        this.currentIndex = 18;
        this.startedAt = 18;
        this.direction = 2;

        this.canvas = document.querySelector(canvasID);
        this.canvas.width = this.screen.width;
        this.canvas.height = this.screen.height;
        this.context = this.canvas.getContext('2d');
        this.maxTick = 4;

        this.events();

        this.character.image = new Image();
        this.character.image.addEventListener('load', this.gameLoop.bind(this));
        this.character.image.src = this.character.src;
    },

    events: function () {
        var _self = this;
        document.onkeydown = function (event) {
            if (event.key === 'ArrowUp') {
                _self.movingUp(event);
            } else if (event.key === 'ArrowDown') {
                _self.movingDown(event);
            } else if (event.key === 'ArrowLeft') {
                _self.movingLeft(event);
            } else if (event.key === 'ArrowRight') {
                _self.movingRight(event);
            }
        };
    },

    gameLoop: function () {
        window.requestAnimationFrame(this.gameLoop.bind(this));

        this.update();
        this.draw();
        this.prevDirection = this.direction;
    },

    update: function () {
        this.tickCount++;
        if (this.tickCount > this.maxTick) {
            this.tickCount = 0;
            if (this.currentIndex + 1 < this.startIndex + this.directionLength) {
                this.currentIndex++;
            } else {
                this.currentIndex = this.startIndex;
            }

        }

        if (this.prevDirection !== this.direction) {
            this.startIndex = this.direction * this.directionLength;
            this.currentIndex = this.startIndex;
            this.tickCount = 0;
        }

        if(this.position.x + this.character.width > window.innerWidth){
            this.position.x = window.innerWidth - this.character.width;
        }
        if(this.position.y + this.character.height > window.innerHeight){
            this.position.y = window.innerHeight - this.character.height;
        }
    },

    draw: function () {
        this.context.clearRect(0, 0, this.screen.width, this.screen.height);
        this.context.drawImage(
            this.character.image,
            (this.currentIndex % this.directionLength) * this.character.width,
            Math.floor(this.currentIndex / this.directionLength) * this.character.height,
            this.character.width,
            this.character.height,
            this.position.x,
            this.position.y,
            this.character.width,
            this.character.height
        );
    },

    movingUp: function (event) {
        event.preventDefault();
        this.direction = 0;
        this.position.y -= this.step;
        if (this.position.y < 0) this.position.y = 0;
    },

    movingLeft: function (event) {
        event.preventDefault();
        this.direction = 1;
        this.position.x -= this.step;
        if (this.position.x < 0) this.position.x = 0;
    },

    movingDown: function (event) {
        event.preventDefault();
        this.direction = 2;
        this.position.y += this.step;
        if (this.position.y + this.character.height > window.innerHeight) {
            this.position.y = window.innerHeight - this.character.height;
        }
    },

    movingRight: function (event) {
        event.preventDefault();
        this.direction = 3;
        this.position.x += this.step;
        if (this.position.x + this.character.width > window.innerWidth) {
            this.position.x = window.innerWidth - this.character.width;
        }
    },
};