var jumper = document.getElementById("jumper").getContext("2d"); 
jumper.font = '30px Arial';

var HEIGHT = 500;
var WIDTH = 500;
var timeWhenGameStarted = Date.now();       //Time in ms
var timeSurvived;

var frameCount = 0;
var score = 0;
var paused = false;
var player;

var enemyList = {};
var upgradeList = {};
var bulletList = {};

var Img = {};
Img.player = new Image();
Img.player.src = "img/player.png";
Img.bat = new Image();
Img.bat.src = "img/bat.png";
Img.bee = new Image();
Img.bee.src = "img/bee.png";
Img.bullet = new Image();
Img.bullet.src = "img/bullet.png";
Img.upgrade1 = new Image();
Img.upgrade1.src = "img/upgrade1.png";
Img.upgrade2 = new Image();
Img.upgrade2.src = "img/upgrade2.png";
Img.map = new Image();
Img.map.src = "img/map.png";

Player = function() {
    var self = Actor('player', 'myId', 250, 250, 50, 70, Img.player, 10, 1);
  
    self.updatePosition = function(){
        if(self.pressingRight)
            self.x += 10;
        if(self.pressingLeft)
            self.x -= 10;  
        if(self.pressingDown)
            self.y += 10;  
        if(self.pressingUp)
            self.y -= 10;  

        //ispositionvalid
        if(self.x < self.width/2)
            self.x = self.width/2;
        if(self.x > currentMap.width-self.width/2)
            self.x = currentMap.width - self.width/2;
        if(self.y < self.height/2)
            self.y = self.height/2;
        if(self.y > currentMap.height - self.height/2)
            self.y = currentMap.height - self.height/2;
    };
    
    self.onDeath = function(){           
        timeSurvived = Date.now() - timeWhenGameStarted;				
        startNewGame();
    };
    
    self.pressingDown = false;
    self.pressingUp = false;
    self.pressingLeft = false;
    self.pressingRight = false;        

    return self;
};

Entity = function(type, id, x, y, width, height, img){
     var self = {
        type:type,
        id:id,
        x:x,
        y:y,
        width:width,
        height:height,
        img:img
    };
    
    self.update = function(){
        self.updatePosition();
        self.draw();
    };
    
    self.draw = function(){
        jumper.save();

        var x = self.x - player.x;
        var y = self.y - player.y;
        
        x += WIDTH / 2;
        y += HEIGHT / 2;
        x -= self.width/2;
        y -= self.height/2;
        
        jumper.drawImage(self.img, 0, 0, self.img.width, self.img.height, 
                         x, y, self.width, self.height);

        jumper.restore();
    };
    
    self.getDistance = function (entity2){
        var vx = self.x - entity2.x;
        var vy = self.y - entity2.y;
        
        return Math.sqrt(vx * vx + vy * vy);
    };

    self.testCollision = function (entity2){
        var rect1 = {
            x:self.x - self.width/2,
            y:self.y - self.height/2,
            width:self.width,
            height:self.height
        };

        var rect2 = {
            x:entity2.x - entity2.width/2,
            y:entity2.y - entity2.height/2,
            width:entity2.width,
            height:entity2.height
        };

        return testCollisionRectRect(rect1, rect2);
    };
    
    self.updatePosition = function(){ 
    };

    return self;
};

Actor = function(type, id, x, y, width, height, img, hp, atkSpd){
    var self = Entity(type, id, x, y, width, height, img);
    
    self.hp = hp;
    self.atkSpd = atkSpd;
    self.attackCounter = 0;
    self.aimAngle = 0;
    
    var super_update = self.update;
    self.update = function(){
        super_update();
        self.attackCounter += self.atkSpd;
        
        if(self.hp <= 0){
            self.onDeath();
        }
    };
    
    self.onDeath = function(){
        
    };
    
    self.performAttack = function(){
        if(self.attackCounter > 25){	//Every 1 second
            self.attackCounter = 0;
            generateBullet(self);
        }  
    };
    
    self.performSpecialAttack = function(){
        if(self.attackCounter > 50){
            self.attackCounter = 0;
            /*
            for(var angle = 0; angle < 360; angle++){
                generateBullet(player, angle);
            }
             */

            generateBullet(self, self.aimAngle - 5);
            generateBullet(self, self.aimAngle);
            generateBullet(self, self.aimAngle + 5);
        }
    };

    return self;
};

Enemy = function (id, x, y, width, height, img, hp, atkSpd){
    var self = Actor('enemy', id, x, y, width, height, img, hp, atkSpd);
    enemyList[id] = self;
  
    self.toRemove = false;
  
    var super_update = self.update;
    self.update = function(){
        super_update();
        self.updateAim();
        self.performAttack();
    };
    
    self.updateAim = function(){
        var diffX = player.x - self.x;
        var diffY = player.y - self.y;

        //Shoot at player
        self.aimAngle = Math.atan2(diffY, diffX) / Math.PI * 180;
    };

    self.updatePosition = function(){
        var diffX = player.x - self.x;
        var diffY = player.y - self.y;
        
        //Make enemies chase player
        if(diffX > 0){
            self.x += 3;
        }else{
            self.x -= 3;
        }

        if(diffY > 0){
            self.y += 3;
        }else{
            self.y -= 3;
        }
    }; 
    
    self.onDeath = function(){
        self.toRemove = true;
    };
};

randomlyGenerateEnemy = function(){
    var x = Math.random() * currentMap.width;
    var y = Math.random() * currentMap.height;
    var height = 64;
    var width = 64;
    var id = Math.random();
    
    if(Math.random() < 0.5){
        Enemy(id, x, y, width, height, Img.bat, 2, 1);
    }else{
        Enemy(id, x, y, width, height, Img.bee, 1, 3);
    }
};

Upgrade = function (id, x, y, width, height, category, img){
    var self = Entity('upgrade', id, x, y, width, height, img);

    self.category = category;
    upgradeList[id] = self;
};

randomlyGenerateUpgrade = function(){
    var x = Math.random() * currentMap.width;
    var y = Math.random() * currentMap.height;
    var height = 32;
    var width = 32;
    var id = Math.random();

    if(Math.random() < 0.5){
        var category = 'score';
        var img = Img.upgrade1;
    }else{
        var category = 'atkSpd';
        var img = Img.upgrade2;
    }

    Upgrade(id, x, y, width, height, category, img);
};

Bullet = function (id, x, y, spdX, spdY, width, height, combatType){
    var self = Entity('bullet', id, x, y, width, height, Img.bullet);

    self.timer = 0;
    self.combatType = combatType;
    self.spdX = spdX;
    self.spdY = spdY;
    
    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;

        if(self.x < 0 || self.x > currentMap.width){
            self.spdX = -self.spdX;
        }
        if(self.y < 0 || self.y > currentMap.height){
            self.spdY = -self.spdY;
        }
    };

    bulletList[id] = self;
};

generateBullet = function(actor, aimOverwrite){
    var x = actor.x;
    var y = actor.y;
    var height = 24;
    var width = 24;
    var id = Math.random();
    
    var angle; //Math.random() * 360;
    if(aimOverwrite !== undefined){
        angle = aimOverwrite;
    } else {
        angle = actor.aimAngle;
    }
    
    var spdX = Math.cos(angle / 180 * Math.PI) * 5;
    var spdY = Math.sin(angle / 180 * Math.PI) * 5;
    
    Bullet(id, x, y, spdX, spdY, width, height, actor.type);
};

testCollisionRectRect = function(rect1,rect2){
    return rect1.x <= rect2.x + rect2.width 
        && rect2.x <= rect1.x + rect1.width
        && rect1.y <= rect2.y + rect2.height
        && rect2.y <= rect1.y + rect1.height;
};

document.onclick = function(mouse){
    player.performAttack();
};

document.oncontextmenu = function(mouse){ //When right click
    player.performSpecialAttack();
    mouse.preventDefault();
};

document.onmousemove = function(mouse){
    var mouseX = mouse.clientX - 
            document.getElementById('jumper').getBoundingClientRect().left;
    var mouseY = mouse.clientY - 
            document.getElementById('jumper').getBoundingClientRect().top; 

    mouseX -= WIDTH/2;
    mouseY -= HEIGHT/2;
    
    player.aimAngle = Math.atan2(mouseY, mouseX) / Math.PI * 180;
}; 

document.onkeydown = function(event){
    if(event.keyCode === 68){            //D
        player.pressingRight = true;
    }
    else if(event.keyCode === 83){	 //S
        player.pressingDown = true;
    }
    else if(event.keyCode === 65){       //A
        player.pressingLeft = true;
    }
    else if(event.keyCode === 87){       //W
        player.pressingUp = true;
    }
    else if(event.keyCode === 80){       //P
       paused = !paused;
    }
};

document.onkeyup = function(event){
    if(event.keyCode === 68){            //D
        player.pressingRight = false;
    }
    else if(event.keyCode === 83){	 //S
        player.pressingDown = false;
    }
    else if(event.keyCode === 65){       //A
        player.pressingLeft = false;
    }
    else if(event.keyCode === 87){       //W
        player.pressingUp = false;
    }
};

update = function(){
    if(paused){
        jumper.fillText("Paused", WIDTH/2 - 50, HEIGHT/2 - 75);
        return;
    }
    
    jumper.clearRect(0, 0, WIDTH, HEIGHT);
    currentMap.draw();
    frameCount++;
    score++;

    updateBullet();
    updateUpgrade();
    updateEnemy();

    player.update();
    
    jumper.fillText(player.hp + " Hp", 0, 30);
    jumper.fillText('Score: ' + score, 100, 30); 
    //var timeSurvived = Date.now() - timeWhenGameStarted;
    //jumper.fillText("You have survived for: " + timeSurvived + "ms", 0, 60);
};

updateEnemy = function(){
    if(frameCount % 100 === 0){         //Every 4 seconds
     randomlyGenerateEnemy();
    }
    
    for(var key in enemyList){
        enemyList[key].update();
    }
    
    for(var key in enemyList){
        if(enemyList[key].toRemove){
            delete enemyList[key];
        }
    }
};

updateUpgrade = function(){
    if(frameCount % 75 === 0){          //Every 3 seconds
    randomlyGenerateUpgrade();
    }
    
    for(var key in upgradeList){
        upgradeList[key].update();

        var isColliding = player.testCollision(upgradeList[key]);

        if(isColliding){
            if(upgradeList[key].category === 'score'){
                score += 1000;
            }
            if(upgradeList[key].category === 'atkSpd'){
                player.atkSpd += 3;
            }
            
        delete upgradeList[key];
        }
    }
};

updateBullet = function(){
    for(var key in bulletList){
        var b = bulletList[key];
        b.update();

        var toRemove = false;
        b.timer++;
        
        if(b.timer > 75){
            toRemove = true;
        }

        if(b.combatType === 'player'){	//bullet was shot by player
            for(var key2 in enemyList){
                if(b.testCollision(enemyList[key2])){
                    toRemove = true;
                    enemyList[key2].hp -= 1;
                }				
            }
        } else if( b.combatType === 'enemy'){ //bullet was shot by enemy
            if(b.testCollision(player)){
                toRemove = true;
                player.hp -= 1;
            }
        }	

        if(toRemove){
            delete bulletList[key];
        }
    } 
};

startNewGame = function(){
    player.hp = 10;
    timeWhenGameStarted = Date.now();
    frameCount = 0;
    score = 0;
    enemyList = {};
    upgradeList = {};
    bulletList = {};

    randomlyGenerateEnemy();
    randomlyGenerateEnemy();
    randomlyGenerateEnemy();
};

Maps = function(id, imgSrc, width, height){
    var self = {
        id:id,
        image:new Image(),
        width:width,
        height
    };
    
    self.image.src = imgSrc;
    
    self.draw = function(){
        var x = WIDTH/2 - player.x;
        var y = HEIGHT/2 - player.y;

        jumper.drawImage(self.image, 0, 0, self.image.width, self.image.height,
                          x, y, self.image.width * 2, self.image.height * 2);  
    };
    
    return self;
};

var currentMap = Maps('field', 'img/map.png', 1280, 960);
player = Player();
startNewGame();
setInterval(update, 40);