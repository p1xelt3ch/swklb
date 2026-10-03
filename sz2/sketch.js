var h;
var w;

var b;
var wpnL;
var wpnR;

var axe;
var knife;
var chainsaw;

var weaponType = "gun";

var meleeAttacking = false;
var meleeAttackTimer = 0;
var meleeAttackLength = 35;
var meleeAttackID = 0;

var facing = "right";

var meleeX = 0;
var meleeY = 0;

var platLvl;

var mcX;
var mcY;
var mcBob = 0;

var wpnX;
var wpnY;

var mcHealth = 5;
var maxHealth = 5;

var lastDamageFrame = 0;
var damageDelay = 60; //about 1 second at 60fps

var gameOver = false;

var mcSpeed = 10;

var mcVelocityY = 0;
var gravity = 1.5;
var jumpPower = -30;

var zombies = [];

var zombieSpawnTimer = 0;
var zombieSpawnDelay = 75;

var onGround = true;

var currentWpn;

var bloodParticles = [];

var maxZombies = 30;

var zombieKills = 0;


function preload()
{
    //background
    b = loadImage("assets/bg.png");

    //gun
    wpnL = loadImage("assets/gunL.png");
    wpnR = loadImage("assets/gunR.png");

    //melee weapons
    axe = loadImage("assets/axe.png");
    knife = loadImage("assets/knife.png");
    chainsaw = loadImage("assets/chainsaw.png");
}


function setup()
{
    h = windowHeight;
    w = windowWidth;

    createCanvas(w, h);

    platLvl = h / 1.3;

    mcX = w / 2;
    mcY = platLvl - 120;

    wpnX = mcX - 70;
    wpnY = mcY + 5;

    currentWpn = wpnR;

    spawnZombie();
}


function draw()
{
    background(50);

    //background image
    tint(255, 80);
    image(b, 0, 0, w, h);
    noTint();

    //ground
    fill(0);
    rect(0, platLvl, w, h);

    if (!gameOver)
    {
        controls();
        spawnZombies();
        followMC();
        checkZombieDamage();
    }

    //MC walking bounce
    if (keyIsDown(65) || keyIsDown(68))
    {
        mcBob = sin(frameCount * 0.25) * 3;
    }
    else
    {
        mcBob = 0;
    }

    drawMC();
    drawWpn();
    drawMuzzleFlash();

    drawZombies();

    drawBlood();
    drawKillCounter();
    drawHealthBar();

    if (gameOver)
    {
        drawGameOver();
    }

    drawCrosshair();
    drawWebsiteLink();
}


function drawMC()
{
    var y = mcY + mcBob;

    stroke(0);
    strokeWeight(1);
    fill(255);

    //head
    ellipse(mcX, y, 50, 50);

    //body
    rect(mcX - 21, y + 25, 40, 60);

    //feet
    ellipse(mcX - 21, y + 100, 25, 15);
    ellipse(mcX + 19, y + 100, 25, 15);

    //face
    strokeWeight(3);

    if (facing == "right")
    {
        ellipse(mcX - 10, y, 10, 10);
        ellipse(mcX + 10, y - 1, 10, 12);
    }
    else
    {
        ellipse(mcX - 10, y - 1, 10, 12);
        ellipse(mcX + 10, y, 10, 10);
    }

    noStroke();
}


function drawWpn()
{
    //GUN
    if (weaponType == "gun")
    {
        image(currentWpn, wpnX, wpnY + mcBob, 180, 100);
        return;
    }


    //MELEE WEAPONS

    //default resting position
    if (facing == "right")
    {
        meleeX = mcX + 50;
    }
    else
    {
        meleeX = mcX - 50;
    }

    meleeY = mcY + mcBob + 45;

    var rotation = 0;


    //attack animation
    if (meleeAttacking)
    {
        meleeAttackTimer++;

        var attackLength = meleeAttackLength;

        //chainsaw attacks faster
        if (weaponType == "chainsaw")
        {
            attackLength = 25;
        }

        var progress = meleeAttackTimer / attackLength;


        if (weaponType == "chainsaw")
        {
            //chainsaw moves vertically
            var chainsawSwing = sin(progress * TWO_PI);

            meleeY += chainsawSwing * 45;

            //only rotate upward, never downward
            if (chainsawSwing < 0)
            {
                rotation = chainsawSwing * HALF_PI;
            }
            else
            {
                rotation = 0;
            }
        }
        else
        {
            //axe + knife rotate 360 degrees
            rotation = progress * TWO_PI;

            //left/right swoosh
            if (facing == "right")
            {
                meleeX += sin(progress * TWO_PI) * 80;
            }
            else
            {
                meleeX -= sin(progress * TWO_PI) * 80;
            }

            //small vertical movement
            meleeY += sin(progress * TWO_PI * 2) * 20;
        }


        checkMeleeHits();


        //attack finished
        if (meleeAttackTimer >= attackLength)
        {
            meleeAttacking = false;
            meleeAttackTimer = 0;
        }
    }


    push();

    translate(meleeX, meleeY);

    //mirror melee weapon when facing left
    if (facing == "left")
    {
        scale(-1, 1);
    }

    imageMode(CENTER);


    if (weaponType == "axe")
    {
        rotate(rotation);
        image(axe, 0, 0, 100, 100);
    }
    else if (weaponType == "knife")
    {
        rotate(rotation);
        image(knife, 0, 0, 90, 90);
    }
    else if (weaponType == "chainsaw")
    {
        rotate(rotation);
        image(chainsaw, 0, 0, 150, 90);
    }


    imageMode(CORNER);

    pop();
}


function drawVln(z)
{
    var zy = z.y + sin(frameCount * 0.18 + z.bobPhase) * 3;

    stroke(0);
    strokeWeight(1);
    fill(100, 255, 150);

    //head
    ellipse(z.x, zy, 50, 50);
    noFill();

    //body
    fill(120, 100, 100);
    rect(z.x - 21, zy + 25, 40, 60);
    noFill();

    //feet
    fill(100, 255, 150);
    ellipse(z.x - 21, zy + 100, 25, 15);
    ellipse(z.x + 19, zy + 100, 25, 15);
    noFill();

    //face
    strokeWeight(3);
    fill(150, 0, 0);
    ellipse(z.x - 10, zy - 3, 10, 10);
    ellipse(z.x + 10, zy - 4, 10, 12);
    noFill();

    fill(255, 100, 100);
    ellipse(z.x, zy + 11, 20, 12);

    fill(255);
    rect(z.x - 7, zy + 6, 5, 5);
    rect(z.x + 2, zy + 9, 5, 5);

    noStroke();

    //blood patches
    fill(200, 0, 0);

    rect(z.x, zy - 25, 5, 5);
    rect(z.x + 5, zy - 20, 5, 5);
    rect(z.x + 10, zy - 17, 5, 5);
    rect(z.x + 14, zy - 17, 5, 5);
    rect(z.x + 10, zy - 20, 5, 5);
    rect(z.x + 2, zy - 25, 5, 5);
    rect(z.x + 6, zy - 23, 5, 5);
    rect(z.x + 8, zy - 22, 5, 5);
    rect(z.x + 12, zy - 19, 5, 5);

    rect(z.x + 9, zy + 27, 10, 20);
    rect(z.x, zy + 27, 10, 10);
    rect(z.x - 2, zy + 35, 5, 10);
    rect(z.x + 9, zy + 50, 5, 5);
    rect(z.x - 10, zy + 27, 5, 5);
    rect(z.x - 20, zy + 75, 20, 10);
    rect(z.x - 17, zy + 65, 5, 10);
}


function drawBigVln(z)
{
    var zy = z.y + sin(frameCount * 0.12 + z.bobPhase) * 4;

    stroke(0);
    strokeWeight(3);


    //========================
    // HEAD
    //========================

    fill(55, 125, 70);
    ellipse(z.x, zy, 150, 150);


    //damaged / darker skin patches
    noStroke();

    fill(45, 100, 60);

    ellipse(z.x - 45, zy - 35, 35, 25);
    ellipse(z.x + 50, zy + 20, 30, 40);
    ellipse(z.x - 20, zy + 50, 25, 20);


    //========================
    // BODY / SHIRT
    //========================

    stroke(0);
    strokeWeight(3);

    fill(70, 60, 60);

    rect(
        z.x - 63,
        zy + 75,
        120,
        180
    );


    //========================
    // FEET
    //========================

    fill(55, 125, 70);

    ellipse(
        z.x - 63,
        zy + 300,
        75,
        45
    );

    ellipse(
        z.x + 57,
        zy + 300,
        75,
        45
    );


    //========================
    // EYES
    //========================

    fill(150, 0, 0);

    ellipse(
        z.x - 30,
        zy - 10,
        25,
        25
    );

    ellipse(
        z.x + 30,
        zy - 15,
        35,
        35
    );


    //small pupils
    fill(20);

    ellipse(
        z.x - 27,
        zy - 8,
        7,
        7
    );

    ellipse(
        z.x + 34,
        zy - 12,
        9,
        9
    );


    //========================
    // MOUTH
    //========================

    fill(80, 0, 0);

    ellipse(
        z.x,
        zy + 35,
        75,
        40
    );


    //teeth
    fill(230);

    rect(
        z.x - 25,
        zy + 20,
        15,
        20
    );

    rect(
        z.x - 5,
        zy + 30,
        14,
        18
    );

    rect(
        z.x + 15,
        zy + 22,
        15,
        20
    );


    //========================
    // FACE BLOOD
    //========================

    noStroke();

    fill(180, 0, 0);

    rect(z.x - 65, zy - 50, 30, 12);
    rect(z.x - 55, zy - 42, 15, 25);
    rect(z.x - 45, zy - 35, 20, 10);

    rect(z.x + 38, zy + 5, 15, 30);
    rect(z.x + 45, zy + 25, 12, 25);


    //blood under mouth
    rect(z.x - 12, zy + 48, 10, 30);
    rect(z.x + 4, zy + 45, 8, 40);
    rect(z.x + 15, zy + 48, 7, 20);


    //========================
    // SHIRT BLOOD STAINS
    //========================

    fill(170, 0, 0);


    //upper-left stain
    rect(z.x - 55, zy + 85, 25, 18);
    rect(z.x - 48, zy + 100, 18, 25);
    rect(z.x - 35, zy + 92, 15, 20);
    rect(z.x - 57, zy + 110, 15, 12);


    //upper-right stain
    rect(z.x + 20, zy + 90, 30, 20);
    rect(z.x + 30, zy + 105, 22, 35);
    rect(z.x + 15, zy + 115, 18, 20);
    rect(z.x + 40, zy + 135, 10, 20);


    //middle blood stain
    rect(z.x - 15, zy + 130, 35, 25);
    rect(z.x - 25, zy + 145, 25, 30);
    rect(z.x + 5, zy + 150, 25, 20);
    rect(z.x - 5, zy + 168, 15, 25);


    //large lower-left stain
    rect(z.x - 58, zy + 185, 35, 30);
    rect(z.x - 45, zy + 205, 40, 25);
    rect(z.x - 25, zy + 220, 25, 25);
    rect(z.x - 55, zy + 225, 18, 20);


    //lower-right stain
    rect(z.x + 20, zy + 190, 32, 25);
    rect(z.x + 30, zy + 210, 20, 35);
    rect(z.x + 10, zy + 225, 25, 18);


    //========================
    // BLOOD DRIPS
    //========================

    fill(120, 0, 0);

    rect(z.x - 35, zy + 230, 8, 30);
    rect(z.x - 5, zy + 210, 7, 45);
    rect(z.x + 35, zy + 225, 8, 35);


    //========================
    // TORN SHIRT HOLES
    //========================

    fill(30);

    rect(z.x - 50, zy + 150, 18, 12);
    rect(z.x + 32, zy + 165, 20, 15);
    rect(z.x - 15, zy + 235, 25, 15);


    //========================
    // ARM / BODY SCRATCHES
    //========================

    fill(120, 0, 0);

    rect(z.x - 70, zy + 110, 10, 45);
    rect(z.x + 57, zy + 135, 10, 50);


    noStroke();
}


function controls()
{
    //left
    if (keyIsDown(65)) //A
    {
        mcX -= mcSpeed;
    }

    //right
    if (keyIsDown(68)) //D
    {
        mcX += mcSpeed;
    }


    //gravity
    mcVelocityY += gravity;
    mcY += mcVelocityY;


    //ground collision
    if (mcY >= platLvl - 120)
    {
        mcY = platLvl - 120;
        mcVelocityY = 0;
        onGround = true;
    }


    //keep gun attached
    if (currentWpn == wpnL)
    {
        wpnX = mcX - 111;
    }
    else
    {
        wpnX = mcX - 70;
    }

    wpnY = mcY + 5;
}


function keyPressed()
{
    //A
    if (keyCode == 65)
    {
        facing = "left";

        if (weaponType == "gun")
        {
            currentWpn = wpnL;
        }
    }


    //D
    if (keyCode == 68)
    {
        facing = "right";

        if (weaponType == "gun")
        {
            currentWpn = wpnR;
        }
    }


    //W = jump
    if (keyCode == 87 && onGround)
    {
        mcVelocityY = jumpPower;
        onGround = false;
    }


    //ENTER = restart
    if (keyCode == ENTER && gameOver)
    {
        restartGame();
        return;
    }


    //1 = gun
    if (keyCode == 49)
    {
        weaponType = "gun";

        if (facing == "left")
        {
            currentWpn = wpnL;
        }
        else
        {
            currentWpn = wpnR;
        }
    }


    //2 = axe
    if (keyCode == 50)
    {
        weaponType = "axe";
        meleeAttacking = false;
        meleeAttackTimer = 0;
    }


    //3 = knife
    if (keyCode == 51)
    {
        weaponType = "knife";
        meleeAttacking = false;
        meleeAttackTimer = 0;
    }


    //4 = chainsaw
    if (keyCode == 52)
    {
        weaponType = "chainsaw";
        meleeAttacking = false;
        meleeAttackTimer = 0;
    }
}


function followMC()
{
    for (var i = 0; i < zombies.length; i++)
    {
        var z = zombies[i];

        if (z.alive)
        {
            var stopDistance = 40;

            if (z.big)
            {
                stopDistance = 100;
            }


            if (z.x < mcX - stopDistance)
            {
                z.x += z.speed;
            }

            if (z.x > mcX + stopDistance)
            {
                z.x -= z.speed;
            }
        }
    }
}


function drawCrosshair()
{
    stroke(255);
    strokeWeight(2);
    noFill();

    //circle
    ellipse(mouseX, mouseY, 20, 20);

    //horizontal lines
    line(mouseX - 15, mouseY, mouseX - 5, mouseY);
    line(mouseX + 5, mouseY, mouseX + 15, mouseY);

    //vertical lines
    line(mouseX, mouseY - 15, mouseX, mouseY - 5);
    line(mouseX, mouseY + 5, mouseX, mouseY + 15);

    noStroke();
}


function mousePressed()
{
    //swook.dev link
    textSize(30);

    var linkX = w - 250;
    var linkY = h - 90;
    var linkWidth = textWidth("swook.dev");

    if (
        mouseX >= linkX &&
        mouseX <= linkX + linkWidth &&
        mouseY >= linkY - 30 &&
        mouseY <= linkY + 5
    )
    {
        window.open("https://swook.dev", "_blank");
        return;
    }


    if (gameOver)
    {
        return;
    }


    //MELEE ATTACK
    if (weaponType != "gun")
    {
        if (!meleeAttacking)
        {
            meleeAttacking = true;
            meleeAttackTimer = 0;
            meleeAttackID++;
        }

        return;
    }


    //GUN: face towards mouse
    if (mouseX < mcX)
    {
        currentWpn = wpnL;
        facing = "left";
    }
    else
    {
        currentWpn = wpnR;
        facing = "right";
    }


    //shoot zombie
    for (var i = zombies.length - 1; i >= 0; i--)
    {
        var z = zombies[i];

        if (!z.alive)
        {
            continue;
        }


        var hitWidth;
        var hitTop;
        var hitBottom;


        if (z.big)
        {
            hitWidth = 90;
            hitTop = 90;
            hitBottom = 330;
        }
        else
        {
            hitWidth = 30;
            hitTop = 30;
            hitBottom = 110;
        }


        if (
            mouseX > z.x - hitWidth &&
            mouseX < z.x + hitWidth &&
            mouseY > z.y - hitTop &&
            mouseY < z.y + hitBottom
        )
        {
            //gun = 1 damage
            z.hits++;

            if (z.hits >= z.maxHits)
            {
                killVln(z);
            }
            else
            {
                shootVln();
            }

            break;
        }
    }
}


function shootVln()
{
    for (var i = 0; i < 50; i++)
    {
        bloodParticles.push({
            x: mouseX,
            y: mouseY,

            vx: random(-10, 10),
            vy: random(-12, -2),

            size: random(3, 8),
            life: 255
        });
    }
}


function drawBlood()
{
    for (var i = bloodParticles.length - 1; i >= 0; i--)
    {
        var p = bloodParticles[i];

        //movement
        p.x += p.vx;
        p.y += p.vy;

        //gravity
        p.vy += 0.4;

        //fade
        p.life -= 5;

        //draw blood
        noStroke();
        fill(200, 0, 0, p.life);
        ellipse(p.x, p.y, p.size, p.size);

        //remove dead particles
        if (p.life <= 0)
        {
            bloodParticles.splice(i, 1);
        }
    }
}


function drawMuzzleFlash()
{
    if (gameOver || weaponType != "gun")
    {
        return;
    }


    if (mouseIsPressed)
    {
        var flashX;
        var flashY = wpnY + mcBob + 48;

        //tip of gun depends on direction
        if (currentWpn == wpnR)
        {
            flashX = wpnX + 170;
        }
        else
        {
            flashX = wpnX + 10;
        }

        fill(255, 255, 0);
        stroke(255, 220, 0);
        strokeWeight(2);

        drawStar(flashX, flashY, 6, 15, 8);

        noStroke();
    }
}


function drawStar(x, y, radius1, radius2, points)
{
    var angle = TWO_PI / points;
    var halfAngle = angle / 2;

    beginShape();

    for (var a = 0; a < TWO_PI; a += angle)
    {
        vertex(
            x + cos(a) * radius2,
            y + sin(a) * radius2
        );

        vertex(
            x + cos(a + halfAngle) * radius1,
            y + sin(a + halfAngle) * radius1
        );
    }

    endShape(CLOSE);
}


function killVln(z)
{
    z.alive = false;

    zombieKills++;

    var bloodY = z.y + 40;

    if (z.big)
    {
        bloodY = z.y + 150;
    }

    for (var i = 0; i < 100; i++)
    {
        bloodParticles.push({
            x: z.x,
            y: bloodY,

            vx: random(-12, 12),
            vy: random(-15, 5),

            size: random(4, 12),
            life: 255
        });
    }
}


function spawnZombie()
{
    //left zombie
    zombies.push({
        x: -60,
        y: platLvl - 120,

        speed: random(1.5, 3),

        hits: 0,
        maxHits: 3,

        alive: true,
        big: false,

        bobPhase: random(0, TWO_PI),
        lastMeleeAttackHit: -1
    });


    //right zombie
    zombies.push({
        x: w + 60,
        y: platLvl - 120,

        speed: random(1.5, 3),

        hits: 0,
        maxHits: 3,

        alive: true,
        big: false,

        bobPhase: random(0, TWO_PI),
        lastMeleeAttackHit: -1
    });
}


function spawnBigZombie()
{
    var spawnX;

    if (random(1) < 0.5)
    {
        spawnX = -150;
    }
    else
    {
        spawnX = w + 150;
    }


    zombies.push({
        x: spawnX,

        //higher because he is much taller
        y: platLvl - 335,

        //big zombie is slower
        speed: random(0.7, 1.3),

        hits: 0,

        //about double the health of a normal zombie
        maxHits: 15,

        alive: true,
        big: true,

        bobPhase: random(0, TWO_PI),
        lastMeleeAttackHit: -1
    });
}


function spawnZombies()
{
    zombieSpawnTimer++;

    var aliveCount = 0;

    for (var i = 0; i < zombies.length; i++)
    {
        if (zombies[i].alive)
        {
            aliveCount++;
        }
    }


    if (zombieSpawnTimer >= zombieSpawnDelay)
    {
        //5% chance of spawning one big zombie
        if (random(1) < 0.05 && aliveCount < maxZombies)
        {
            spawnBigZombie();
        }

        //otherwise spawn two regular zombies
        else if (aliveCount <= maxZombies - 2)
        {
            spawnZombie();
        }

        zombieSpawnTimer = 0;
    }
}


function drawZombies()
{
    for (var i = 0; i < zombies.length; i++)
    {
        if (zombies[i].alive)
        {
            if (zombies[i].big)
            {
                drawBigVln(zombies[i]);
            }
            else
            {
                drawVln(zombies[i]);
            }
        }
    }
}


function drawKillCounter()
{
    fill(255);
    stroke(0);
    strokeWeight(3);

    textSize(25);
    textAlign(LEFT);

    text("Zombies Killed: " + zombieKills, 20, 40);

    noStroke();
}


function checkZombieDamage()
{
    if (gameOver)
    {
        return;
    }


    for (var i = 0; i < zombies.length; i++)
    {
        var z = zombies[i];

        if (z.alive)
        {
            var zHalfWidth;
            var zTop;
            var zBottom;


            if (z.big)
            {
                zHalfWidth = 90;
                zTop = z.y - 75;
                zBottom = z.y + 330;
            }
            else
            {
                zHalfWidth = 25;
                zTop = z.y - 25;
                zBottom = z.y + 110;
            }


            //MC/zombie overlap
            if (
                z.x + zHalfWidth > mcX - 25 &&
                z.x - zHalfWidth < mcX + 25 &&
                zBottom > mcY - 25 &&
                zTop < mcY + 110
            )
            {
                //only damage once per second
                if (frameCount - lastDamageFrame >= damageDelay)
                {
                    mcHealth--;
                    lastDamageFrame = frameCount;

                    if (mcHealth <= 0)
                    {
                        gameOver = true;
                    }
                }

                break;
            }
        }
    }
}


function drawHealthBar()
{
    var barX = 20;
    var barY = 60;
    var barWidth = 200;
    var barHeight = 20;

    //background
    fill(80);
    stroke(255);
    strokeWeight(2);
    rect(barX, barY, barWidth, barHeight);

    //health
    noStroke();
    fill(255, 0, 0);

    var healthWidth = map(
        mcHealth,
        0,
        maxHealth,
        0,
        barWidth
    );

    rect(barX, barY, healthWidth, barHeight);

    //text
    fill(255);
    textSize(16);
    textAlign(LEFT);

    text(
        "Health",
        barX,
        barY + 40
    );
}


function drawGameOver()
{
    fill(0, 0, 0, 180);
    rect(0, 0, w, h);

    fill(255, 0, 0);
    textAlign(CENTER);
    textSize(60);
    text("GAME OVER", w / 2, h / 2);

    fill(255);
    textSize(25);

    text(
        "Zombies killed: " + zombieKills,
        w / 2,
        h / 2 + 50
    );

    textSize(20);

    text(
        "Press ENTER to restart",
        w / 2,
        h / 2 + 100
    );
}


function restartGame()
{
    gameOver = false;

    mcHealth = maxHealth;

    mcX = w / 2;
    mcY = platLvl - 120;

    mcVelocityY = 0;
    onGround = true;

    facing = "right";

    weaponType = "gun";
    currentWpn = wpnR;

    meleeAttacking = false;
    meleeAttackTimer = 0;

    zombies = [];
    bloodParticles = [];

    zombieKills = 0;

    zombieSpawnTimer = 0;
    lastDamageFrame = frameCount;

    spawnZombie();
}


function drawWebsiteLink()
{
    fill(255);
    textSize(30);
    textAlign(LEFT);

    text("swook.dev", w - 250, h - 90);

    noFill();
}


function checkMeleeHits()
{
    for (var i = 0; i < zombies.length; i++)
    {
        var z = zombies[i];

        if (!z.alive)
        {
            continue;
        }


        var targetY;
        var hitRange;


        if (z.big)
        {
            targetY = z.y + 150;
            hitRange = 180;
        }
        else
        {
            targetY = z.y + 40;
            hitRange = 80;
        }


        var distance = dist(
            meleeX,
            meleeY,
            z.x,
            targetY
        );


        //weapon touching zombie
        if (
            distance < hitRange &&
            z.lastMeleeAttackHit != meleeAttackID
        )
        {
            z.lastMeleeAttackHit = meleeAttackID;

            //melee = 2 damage
            z.hits += 2;


            //blood from zombie
            for (var j = 0; j < 50; j++)
            {
                bloodParticles.push({
                    x: z.x,
                    y: targetY,

                    vx: random(-10, 10),
                    vy: random(-12, -2),

                    size: random(3, 8),
                    life: 255
                });
            }


            if (z.hits >= z.maxHits)
            {
                killVln(z);
            }
        }
    }
}