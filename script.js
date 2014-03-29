//***********MAIN.js**********//

var gameBoard;
var snake;
var previousMoveDirection = "down";
var moveDirection = 'up';
var gameExecutor;
var gameSpeed=300;
var roundNum = 1;

var eatenItemsCount =0;
var MAX_FOOD_ITEMS = 12;

//actual field size(400px) divided by corresponding bodypart size(8px)
var gameFieldRelativeWidth = 50;
var gameFieldRelativeHeight = 50;

//width and height of snake body element
var snakeElementWidth = 8;
var snakeElementHeight = 8;

//game keys
var ESC = 27;
var SPACE = 32;


var food;

var previousFrame = null;
var controllerOptions = {enableGestures: true};
Leap.loop(controllerOptions, function(frame) {

  // Display Hand object data
  //var handOutput = document.getElementById("handData");
  var handString = "";
  if (frame.hands.length > 0) {
    for (var i = 0; i < frame.hands.length; i++) {
      var hand = frame.hands[i];
      // Hand motion factors
      if (previousFrame && previousFrame.valid) {
        var translation = hand.translation(previousFrame);
        //handString += "Translation: " + vectorToString(translation) + " mm<br />";
        console.log(detectMotion(translation));
        if(detectMotion(translation) == "undefined"){
        	moveDirection = previousMoveDirection;
        }
      	else{
      		moveDirection = detectMotion(translation);
      }
    }
  }

  // Store frame for motion functions
  previousFrame = frame;
}
	


	

})


$(document).ready(function() {
    $('body').keydown(keyPressedHandler);
});





function vectorToString(vector, digits) {
  if (typeof digits === "undefined") {
    digits = 1;
  }
  return "(" + vector[0].toFixed(digits) + ", "
             + vector[1].toFixed(digits) + ", "
             + vector[2].toFixed(digits) + ")";
}
function detectMotion(vector){
	var index = max(vector[0],vector[1]);
	var error = 15;
	if(index == 0){
		//positive x
		if(vector[0]>error){
			previousMoveDirection = "right";
			return "right";
		}
		//negative x
		else if (vector[0]< -error){
			previousMoveDirection = "left";
			return "left";
		}
	}
	else if (index == 1){
		if(vector[1]>error){
			previousMoveDirection ="up";
			return "up";
		}
		//negative x
		else if (vector[1] < -error){
			previousMoveDirection = "down";
			return "down";
		}
	}
	return previousMoveDirection;
}


function max(x,y){
	if(Math.abs(x) > Math.abs(y)){
		return 0;
	}
	else{
		return 1;
	}
}




function move() {
	generateFood();

		snake.move(moveDirection);
	
	if(snake.holdsPosition(food.xPos,food.yPos))
		eatFood();
		
	drawSnake();
};

function keyPressedHandler(e) {
	var code = (e.keyCode ? e.keyCode : e.which);
	
	switch(code) {
		
		case SPACE:
			startGame();
			break;
		case ESC:
			endGame();
			break;
	}
 }

function startGame() {
	gameBoard = new GameBoard();
	moveDirection = 'up';
	eatenItemsCount = 0;
	roundNum = 1;
	gameSpeed=200;
	endGame();
	gameBoard.clearGameInfo();
	
	snake = new Snake(80,80);
	snake.onCrash(snakeCrashHandler,{xPos:400,yPos:400});
	drawSnake();
	gameExecutor = setInterval(move,gameSpeed);
};
function endGame() {
	if(gameExecutor)
		clearInterval(gameExecutor);
	
	gameBoard.clearBoard();
};

function drawSnake() {
	gameBoard.removeSnakeBody();
	
	//draw the new snake
	var snakeBody = snake.getBody();
	
	for(var i=0; i<snakeBody.length; i++){
		gameBoard.drawElement('bodypart',snakeBody[i].xPos,snakeBody[i].yPos);
	}
};

function generateFood() {
	if(gameBoard.hasNoCreatedFood()){
		do{
			xpos = Math.floor(Math.random() * gameFieldRelativeWidth) * snakeElementWidth;
			ypos = Math.floor(Math.random() * gameFieldRelativeHeight)* snakeElementHeight;
		}
		while(snake.holdsPosition(xpos,ypos));
		food = {xPos:xpos,yPos:ypos};
		gameBoard.drawElement('food',xpos,ypos);
	}
};

function eatFood() {
	snake.eatFood();
	gameBoard.removeSnakeFood();
	
	eatenItemsCount++;
	if(eatenItemsCount >= MAX_FOOD_ITEMS)
		startNextRound();
	
	gameBoard.updateScore(roundNum);
};

function snakeCrashHandler() {
	endGame();
	gameBoard.showLoseMessage();
};

function startNextRound() {
	roundNum++;
	eatenItemsCount = 0;
	gameBoard.showNextRoundMsg();
	gameSpeed = Math.floor(gameSpeed * 0.8);
	clearInterval(gameExecutor);
	gameExecutor = setInterval(move,gameSpeed);
};
//***************************//
//*********SNAKE.js*********//
function BodyPart(xpos,ypos,direction) {
	this.xPos=xpos;
	this.yPos=ypos;
	this.direction=direction;;
};

function Snake(startX,startY) {
	var moveStep = 8;
	var bodyParts = [new BodyPart(startX,startY,'right')];
	var reverseDirections = {'right':'left','left':'right','up':'down','down':'up'};
	var gameRegion;
	var onCrashCallback;
	var self = this;
	
	this.eatFood = function() {
		bodyParts.push(getNewTail());
	};
	
	this.move = function(newDirection) {
		if(isReverseDirection(newDirection))
			reverseBodyMove();
			
		var newHead = getNewHead(newDirection);
		
		if(crash(newHead))
			onCrashCallback();
		else{		
			for(var i = bodyParts.length-1; i>0 ;i--){
				bodyParts[i] = bodyParts[i-1];
			}
			bodyParts[0] = newHead;
		}
	};
	
	this.getBody = function() {
		return bodyParts;
	};
	
	this.holdsPosition = function(xpos,ypos) {
		for(var i = 0; i< bodyParts.length; i++){
			if(bodyParts[i].xPos == xpos && bodyParts[i].yPos == ypos)
				return true;
		}
		return false;
	};
	
	this.onCrash = function(crashCallback,fieldSize) {
		gameRegion = fieldSize;
		onCrashCallback = crashCallback;
	};
	
	var getNewHead = function(direction){
		var currentHead = bodyParts[0];
		
		
		switch(direction){
			case 'right':
				return new BodyPart(currentHead.xPos+moveStep,currentHead.yPos,direction);
			case 'left':
				return new BodyPart(currentHead.xPos-moveStep,currentHead.yPos,direction);
			case 'up':
				return new BodyPart(currentHead.xPos,currentHead.yPos-moveStep,direction);
			case 'down':
				return new BodyPart(currentHead.xPos,currentHead.yPos+moveStep,direction);
		};
		
	};
	
	var getNewTail = function(){
		var currentTail = bodyParts[bodyParts.length-1];
		var tailDirection = currentTail.direction;
		
		switch(tailDirection){
			case 'right':
				return new BodyPart(currentTail.xPos-moveStep,currentTail.yPos,tailDirection);
			case 'left':
				return new BodyPart(currentTail.xPos+moveStep,currentTail.yPos,tailDirection);
			case 'up':
				return new BodyPart(currentTail.xPos,currentTail.yPos+moveStep,tailDirection);
			case 'down':
				return new BodyPart(currentTail.xPos,currentTail.yPos-moveStep,tailDirection);
		};
	};
	
	var crash = function(head){
		if(head.xPos >= gameRegion.xPos
			|| head.yPos >= gameRegion.yPos
			|| head.xPos < 0
			|| head.yPos < 0
			|| self.holdsPosition(head.xPos,head.yPos))
			return true;
		
		return false;
	};
	
	var isReverseDirection = function(newDirection) {
		var currentHeadDirection = bodyParts[0].direction;
		return newDirection == reverseDirections[currentHeadDirection];
	};
	
	var reverseBodyMove = function() {
		var tmpBodyPart;
		var halfBodyLength = Math.floor(bodyParts.length/2);
		var bodyLength = bodyParts.length -1;
		
		for(var i = 0; i< halfBodyLength; i++){
			tmpBodyPart = bodyParts[i];
			bodyParts[i] = bodyParts[bodyLength - i];
			bodyParts[bodyLength - i] = tmpBodyPart;
			bodyParts[i].direction = reverseDirections[bodyParts[i].direction];
			bodyParts[bodyLength - i].direction = reverseDirections[bodyParts[bodyLength - i]];
		}
	};
};
//**************************//
//*******GAMEBOARD.js******//
function GameBoard() {

	this.drawElement = function (classname, xpos,ypos) {
		var $element = $('<div/>').addClass(classname);
		$element.css('top',ypos+'px').css('left',xpos+'px');
		$('#gameField').append($element);
	};
	
	this.clearBoard = function(){
		$('div.bodypart').remove();
		$('.food').remove();
	};
	
	this.clearGameInfo = function() {
		$('#score').html('0');
		$('#loseMsg').css('visibility','hidden');
		$('#speed').html('1');
	};
	
	this.hasNoCreatedFood = function() {
		return $('.food').length == 0 ;
	};
	
	this.removeSnakeBody = function() {
		$('div.bodypart').remove();
	};
	
	this.removeSnakeFood = function() {
		$('.food').remove();
	};
	
	this.updateScore = function(currentRound) {
		var $currentScore = Number($('#score').html());
		$currentScore+=currentRound;
		$('#score').html($currentScore);
	};
	
	this.showLoseMessage = function(){
		$('#loseMsg').css('visibility','visible');
	};
	
	this.showNextRoundMsg = function() {
		$('#nextRndMsg').hide().css({visibility: 'visible'}).fadeIn(2000);
		$('#nextRndMsg').fadeOut(2000, function() {
				$(this).show().css({visibility: 'hidden'});
			});
			
		var $currentSpeed = Number($('#speed').html());
		$currentSpeed++;
		$('#speed').html($currentSpeed);
	};
}
//************************//