const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CANVAS_HEIGHT = canvas.height;
const CANVAS_WIDTH = canvas.width;

const BOARD_Y = 50;
const BOARD_P1_X = 300;
const BOARD_P2_X = 500;

const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;
const PADDLE_P1_X = 10;
const PADDLE_P2_X = 770;
const PADDLE_START_Y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
const PADDLE_STEP = 3;

const BALL_R = 15;
const BALL_START_X = CANVAS_WIDTH / 2;
const BALL_START_Y = CANVAS_HEIGHT / 2;
const BALL_START_DX = 4.5; // początkowa prędkość lotu piłeczki po x
const BALL_START_DY = 1.5;  // początkowa prędkość lotu piłeczki po y

const STATE_CHANGE_INTERVAL = 20; // 20

const UP_ACTION = "up";
const DOWN_ACTION = "down";
const STOP_ACTION = "stop";

const P1_UP_BUTTON = 'KeyQ';
const P1_DOWN_BUTTON = 'KeyA';
const P2_UP_BUTTON = 'KeyP';
const P2_DOWN_BUTTON = 'KeyL';
const PAUSE_BUTTON = "KeyB";


function coerceIn (value, min, max) {
    if (value <= min) {
        return min;
    } else if (value >= max) {
        return max;
    } else {
        return value;
    }
}

function isInBetween (value, min, max) {
    return value >= min && value <= max;
}


ctx.font = "30px Arial";

function drawPoints(text, x) {
    ctx.fillText(text, x, BOARD_Y);
}

function drawCircle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
}

function clearCanvas (){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}


class Ball {
    constructor() {
        this.x = BALL_START_X;
        this.y = BALL_START_Y;
        this.dx = BALL_START_DX;
        this.dy = BALL_START_DY;
    }

    move(p1, p2) {

        if (this.shouldBounceFromTopWall() ||
            this.shouldBounceFromBottomWall()) {
            this.bounceFromWall();
        }
        if (this.shouldBounceFromLeftPaddle(p1.paddle) ||
            this.shouldBounceFromRightPaddle(p2.paddle)) {
            this.bounceFromPaddle();
        }
        if (this.isOutsideOnLeft()) {
            this.moveToStart();
            p2.points++;
        } else if (this.isOutsideOnRight()) {
            this.moveToStart();
            p1.points++;
        }
        this.x += this.dx;
        this.y += this.dy;
    }

    draw (){
        drawCircle(this.x, this.y, BALL_R)
    }

    shouldBounceFromTopWall(){
        return this.y < BALL_R && this.dy < 0;
    }

    shouldBounceFromBottomWall() {
        return this.y + BALL_R > CANVAS_HEIGHT && this.dy > 0;
    }

    bounceFromWall() {
        this.dy = -this.dy;
    }

    bounceFromPaddle() {
        this.dx = -this.dx;
    }

    moveToStart(){
        this.x = BALL_START_X;
        this.y = BALL_START_Y;
    }

    isOutsideOnLeft () {
        return this.x + BALL_R < 0;
    }

    isOutsideOnRight() {
        return this.x - BALL_R > CANVAS_WIDTH;
    }

    isOnTheSameHeightAsPaddle (paddleY) {
        return isInBetween(this.y, paddleY, paddleY + PADDLE_HEIGHT);
    }

    shouldBounceFromLeftPaddle(paddle){
        return this.dx < 0 && 
        isInBetween(this.x - BALL_R, PADDLE_P1_X, PADDLE_P1_X + PADDLE_WIDTH) && 
        this.isOnTheSameHeightAsPaddle(paddle.y);
    }

    shouldBounceFromRightPaddle(paddle) {
        return this.dx > 0 && 
        isInBetween(this.x + BALL_R, PADDLE_P2_X, PADDLE_P2_X + PADDLE_WIDTH) && 
        this.isOnTheSameHeightAsPaddle(paddle.y);
    }


}
 



class Paddle {
    constructor(paddleX) {
        this.x = paddleX;
        this.y = PADDLE_START_Y;
    }

    setY(newY) {
        const maxPaddleY = 0;
        const minPaddleY = CANVAS_HEIGHT - PADDLE_HEIGHT;
        this.y = coerceIn(newY, maxPaddleY, minPaddleY);
    }

    stepDown() {
        this.setY(this.y + PADDLE_STEP);
    }
    stepUp() {
        this.setY(this.y - PADDLE_STEP);
    }
    draw(){
        ctx.fillRect(this.x, this.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    }
}

class Player {

    constructor(paddleX, boardX) {
        this.points = 0;
        this.boardX = boardX;
        this.action = STOP_ACTION;
        this.paddle = new Paddle(paddleX);
    }

    makeAction() {
        if (this.action === UP_ACTION) {
            this.paddle.stepUp();
        } else if (this.action === DOWN_ACTION) {
            this.paddle.stepDown();
        }
    }

    drawPoints() {
        drawPoints(this.points.toString(), this.boardX);
    }

    draw() {
        this.drawPoints();
        this.paddle.draw();
    }

}

class Game {

    

    constructor() {
        this.paused = false;
        this.ball = new Ball();
        this.p1 = new Player(PADDLE_P1_X, BOARD_P1_X);
        this.p2 = new Player(PADDLE_P2_X, BOARD_P2_X);
    }

    nextState() {
        this.ball.move(this.p1, this.p2);
        this.p1.makeAction();
        this.p2.makeAction();
    }

    drawState () {
        clearCanvas();
        this.ball.draw();
        this.p1.draw();
        this.p2.draw();
    }

    updateAndDrawState() {
        if (this.paused) return;
        this.nextState();
        this.drawState();
    }

    setupControl() {
        window.addEventListener("keydown", function (event) {
            const code = event.code;
            if (code === P1_UP_BUTTON) {
                this.p1.action = UP_ACTION;
            } else if (code === P1_DOWN_BUTTON) {
                this.p1.action = DOWN_ACTION;
            } else if (code === P2_UP_BUTTON) {
                this.p2.action = UP_ACTION;
            } else if (code === P2_DOWN_BUTTON) {
                this.p2.action = DOWN_ACTION;
            } else if (code === PAUSE_BUTTON) {
                this.paused = !paused;
            }
        }.bind(this));

        window.addEventListener("keyup",function (event) {
            const code = event.code;
            if (
                (code === P1_UP_BUTTON && this.p1.action === UP_ACTION) ||
                (code === P1_DOWN_BUTTON && this.p1.action === DOWN_ACTION)
            ) {
                this.p1.action = STOP_ACTION;
            } else if (
                (code === P2_UP_BUTTON && this.p2.action === UP_ACTION) ||
                (code === P2_DOWN_BUTTON && this.p2.action === DOWN_ACTION)
            ) {
                this.p2.action = STOP_ACTION;
            }
        }.bind(this));
    }

    start() {
        setInterval(this.updateAndDrawState.bind(this), STATE_CHANGE_INTERVAL);
        this.setupControl();
    }

}

const game = new Game();
game.start();

