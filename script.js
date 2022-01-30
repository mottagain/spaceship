// From tutorial at: https://www.youtube.com/watch?v=jl29qI62XPg
//    Also see: https://opengameart.org/ and https://gamedeveloperstudio.com

const pixelsPerFrameKeyboardVelocity = 5;
const playerFireCooldownWait = 35;
const playerRespawnTime = 100;
const playerSpawnInvulnerabilityTime = 200;
const enemyFireCooldownWait = 200;
const enemyPushbackVelocity = 10;
const enemyPushbackOnHitTime = 20;


// Canvas setup
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 1600;

// Font setup
const myFont = new FontFace('Pixeloid Sans', 'url(PixeloidSans-nR3g1.ttf)');
myFont.load().then((font) => { 
    document.fonts.add(font); 
});

// Helpers
function drawCircle(x, y, radius, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}
function createImage(source) {
    const image = new Image();
    image.src = source;
    return image;
}

const inputKeys = {
    w: false,
    a: false,
    s: false,
    d: false,
    q: false,
    one: false,
    two: false,
    five: false,
    space: false,
}

canvas.addEventListener('keydown', event => {
    switch(event.key) {
        case 'a':
        case 'A':
            inputKeys.a = true;
            break;
        case 'd':
        case 'D':
            inputKeys.d = true;
            break;
        case 's':
        case 'S':
            inputKeys.s = true;
            break;
        case 'w':
        case 'W':
            inputKeys.w = true;
            break;
        case 'q':
        case 'Q':
            inputKeys.q = true;
            break;
        case '1':
            inputKeys.one = true;
            break;
        case '2':
            inputKeys.two = true;
            break;
        case '5':
            inputKeys.five = true;
            break;
        case ' ':
            inputKeys.space = true;
            break;
    }
});

canvas.addEventListener('keyup', event => {
    switch(event.key) {
        case 'a':
        case 'A':
            inputKeys.a = false;
            break;
        case 'd':
        case 'D':
            inputKeys.d = false;
            break;
        case 's':
        case 'S':
            inputKeys.s = false;
            break;
        case 'w':
        case 'W':
            inputKeys.w = false;
            break;
        case 'q':
        case 'Q':
            inputKeys.q = false;
            break;
        case '1':
            inputKeys.one = false;
            break;
        case '2':
            inputKeys.two = false;
            break;
        case '5':
            inputKeys.five = false;
            break;
        case ' ':
            inputKeys.space = false;
            break;
    }
});

const gamepadKeys = {
    left: false,
    right: false,
    up: false,
    down: false,
    a: false,
    b: false,
}

function pollGamepadState() {
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
    gamepadKeys.left = gamepadKeys.right = gamepadKeys.up = gamepadKeys.down = gamepadKeys.a = gamepadKeys.b = false;

    if (gamepads && gamepads.length > 0) {
        var gamepad = gamepads[0];
        if (gamepad) {

            var button0 = gamepad.buttons[0];
            if (button0) {
                gamepadKeys.a = button0.pressed;
            }

            var button1 = gamepad.buttons[1];
            if (button1) {
                gamepadKeys.b = button1.pressed;
            }

            if (gamepad.axes.length > 0) {
                var horizontalAxisStick0 = gamepad.axes[0];
                if (horizontalAxisStick0 < -.5) {
                    gamepadKeys.left = true;
                }
                else if (horizontalAxisStick0 > .5) {
                    gamepadKeys.right = true;
                }
                
                var verticalAxisStick0 = gamepad.axes[1];
                if (verticalAxisStick0 < -.5) {
                    gamepadKeys.up = true;
                }
                else if (verticalAxisStick0 > .5) {
                    gamepadKeys.down = true;
                }
            }
        }
    }
}

// ECS
class Component {
    constructor(entityId) {
        this.entityId = entityId;
    }

    className() {
        return this.constructor.name;
    }
}

class ComponentManager {
    constructor() {
        this.componentEntries = new Map();
        this.nextId = 0;
    }

    createEntity() {
        return this.nextId++;
    }

    // Returns tuples for each entity with all requested components (arguments should be the name of the components requested)
    getView() {
        let resultMap = new Map();
        for (const argument of arguments) {
            let componentArray = this.componentEntries.get(argument);
            if (componentArray) {
                for (let component of componentArray) {
                    if (resultMap.has(component.entityId)) {
                        resultMap.get(component.entityId).push(component);
                    } else {
                        resultMap.set(component.entityId, [component]);
                    }
                }
            }
        }

        let result = [];
        for (const [key, val] of resultMap.entries()) {
            if (val.length == arguments.length) {
                result.push(val);
            }
        }
        return result;
    }

    // Returns a map of component name -> component instance for components on an entity.
    getEntity(entityId) {
        let result = new Map();
        for (const [componentName, componentArray] of this.componentEntries.entries()) {
            if (componentArray) {
                const component = componentArray.find(component => component.entityId == entityId);
                if (component) {
                    result.set(componentName, component);
                }
            }
        }
        return result;
    }

    // Adds all passed components to the commonent manager (arguments should be component instnaces)
    addComponents() {
        for (const component of arguments) {
            let components = this.componentEntries.get(component.className());
            if (!components) {
                components = [];
                this.componentEntries.set(component.className(), components);
            }
            const existingComponent = components.find(c => c.entityId == component.entityId);
            if (existingComponent) {
                throw 'Attempt to add a second component of type ' + component.className() + ' to entity id: ' + component.entityId;
            }
            components.push(component);
        }
    }

    removeComponent(componentName, entityId) {
        const componentArray = this.componentEntries.get(componentName);
        if (componentArray) {
            for (let i = componentArray.length - 1; i >= 0; i--) {
                if (componentArray[i].entityId == entityId) {
                    componentArray.splice(i, 1);
                }
            }
        }
    }

    removeEntity(entityId) {

        for (const [key, componentArray] of this.componentEntries.entries()) {
            for (let i = componentArray.length - 1; i >= 0; i--) {
                const component = componentArray[i];
                if (component.entityId == entityId) {
                    componentArray.splice(i, 1);
                }
            }
        }
    }

    removeAllComponentInstances(componentName) {
        this.componentEntries.set(componentName, []);
    }

    getStats() {
        var result = [];
        for (const [key, componentArray] of this.componentEntries.entries()) {
            result.push([key, componentArray.length]);
        }
        return result;
    }
}


class Collision {
    constructor(otherEntityId, collisionGroup, isNew) {
        this.otherEntityId = otherEntityId;
        this.collisionGroup = collisionGroup;
        this.isNew = isNew;
    }
}


class AnimationStateComponent extends Component {
    constructor(entityId, animate, frameDelay, pauseAfterFrame, deleteAfterComplete) {
        super(entityId);
        this.animate = animate;
        this.frameDelay = frameDelay;
        this.pauseAfterFrame = pauseAfterFrame;
        this.deleteAfterComplete = deleteAfterComplete ?? false;
        this.animationComplete = false;
    }
}

class BackgroundComponent extends Component {}

class ChangePhaseComponent extends Component {
    constructor(entityId, targetPhase) {
        super(entityId);
        this.targetPhase = targetPhase;
    }
}

class CollidingWithComponent extends Component {
    constructor(entityId, collisions) {
        super(entityId);
        this.collisions = collisions ? collisions : [];
    }
}

class CollisionRadiusComponent extends Component {
    constructor(entityId, radius, collisionGroup) {
        super(entityId);
        this.radius = radius;
        this.collisionGroup = collisionGroup;
    }
}

class CreditsComponent extends Component {
    constructor(entityId) {
        super(entityId);
        this.credits = 0;
    }
}

class EnemyComponent extends Component {
    constructor(entityId, health, points) {
        super(entityId);
        this.health = health;
        this.points = points;
        this.fireCooldownTimer = 0;
    }
}

class ExtraLifeComponent extends Component {    
    constructor(entityId) {
        super(entityId);
    }
}

class ImpulseComponent extends Component {
    constructor(entityId, velocityX, velocityY, frames) {
        super(entityId);
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.frames = frames;
    }
}

class LaserComponent extends Component {
    constructor(entityId) {
        super(entityId);
    }
}

class ModifyScoreComponent extends Component {
    constructor(entityId, delta) {
        super(entityId);
        this.delta = delta;
    }
}

class PlayerComponent extends Component {
    constructor(entityId) {
        super(entityId);
        this.lives = 3;
        this.fireCooldownTimer = 0;
        this.respawnTimer = 0;
        this.invulnerableTimer = playerSpawnInvulnerabilityTime;
    }
}

class PlaySoundEffectComponent extends Component {
    constructor(entityId, soundName) {
        super(entityId);
        this.soundName = soundName;
    }
}

class PositionComponent extends Component {
    constructor(entityId, x, y) {
        super(entityId);
        this.positionX = x;
        this.positionY = y;
    }
}

class SoundEffectComponent extends Component {
    constructor(entityId, soundName, sound) {
        super(entityId);
        this.soundName = soundName;
        this.sound = sound;
    }
}

class SpriteSheetComponent extends Component {
    constructor(entityId, name, image, framesX, framesY, totalFrames, frameWidth, frameHeight) {
        super(entityId);
        this.name = name;
        this.image = image;
        this.framesX = framesX;
        this.framesY = framesY;
        this.totalFrames = totalFrames;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
    }
}

class SpriteComponent extends Component {
    constructor(entityId, spriteSheetName, startFrame, scaleFactor, smooth, flash, rotation) {
        super(entityId);
        this.spriteSheetName = spriteSheetName;
        this.frame = startFrame ?? 0;
        this.scaleFactor = scaleFactor ?? 1;
        this.smooth = smooth ?? true;
        this.flash = flash ?? false;
        this.rotation = rotation ?? 0;
    }
}

class TotalScoreComponent extends Component {
    constructor(entityId, totalScore) {
        super(entityId);
        this.totalScore = totalScore;
    }
}

class VelocityComponent extends Component {
    constructor(entityId, velocityX, velocityY) {
        super(entityId);
        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }
}


class System {
    constructor(phase) {
        this.phase = phase;
    }

    startup(componentManager) {
    }

    teardown(componentManager) {        
    }

    update(componentManager, gameFrame) {
    }
}

class SystemManager {
    constructor(componentManager) {
        this.systems = [];
        this.componentManager = componentManager;
        this.currentPhase = undefined;
        this.nextPhase = undefined;
    }

    registerSystem(system) {
        this.systems.push(system);
    }

    startup() {
        for (const system of this.systems) {
            if (system.phase == undefined) {
                system.startup(this.componentManager);
            }
        }
    }

    update(gameFrame) {
        for (const system of this.systems) {
            if (system.phase == undefined || system.phase == this.currentPhase) {
                system.update(this.componentManager, gameFrame);
            }
        }

        if (this.nextPhase) {
            for (const system of this.systems) {
                if (this.currentPhase != undefined && system.phase == this.currentPhase) {
                    system.teardown(this.componentManager);
                }
                if (system.phase == this.nextPhase) {
                    system.startup(this.componentManager);
                }
            }
    
            this.currentPhase = this.nextPhase;
            this.nextPhase = undefined;
        }
    }

    setPhase(phase) {
        if (phase != this.currentPhase) {
            this.nextPhase = phase;
        }
    }
}

class GamePhaseSystem extends System {
    constructor() {
        super(undefined);
        this.currentPhase = undefined;
    }

    startup(componentManager) {
        systemManager.setPhase('pregame');
    }

    update(componentManager, gameFrame) {
        
        const view = componentManager.getView('ChangePhaseComponent');
        for (const [changePhaseComponent] of view) {
            systemManager.setPhase(changePhaseComponent.targetPhase);
        }
    }
}

class RenderCollisionRegionsForDebugSystem extends System {

    update(componentManager, gameFrame) {
        const view = componentManager.getView('CollisionRadiusComponent', 'PositionComponent');

        for (const [collisionComponent, positionComponent] of view) {
            drawCircle(positionComponent.positionX, positionComponent.positionY, collisionComponent.radius, 'red');
        }
    }
}

function createSpriteSheetComponentMap() {
    return spriteSheetComponentMap;
}

class RenderSpritesSystem extends System {
    constructor() {
        super();
        this.spriteSheetComponentMap;
    }

    update(componentManager, gameFrame) {        
        const view = componentManager.getView('SpriteComponent', 'PositionComponent');
        
        for (const [spriteComponent, positionComponent] of view) {

            const  draw = !spriteComponent.flash || Math.trunc(gameFrame / 10) % 2;

            if (draw) {
                const spriteSheetComponent = this.getSpriteSheetComponent(spriteComponent.spriteSheetName);

                const frameNumber = spriteComponent.frame % spriteSheetComponent.totalFrames;

                const frameX = frameNumber % spriteSheetComponent.framesX;
                const frameY = Math.floor(frameNumber / spriteSheetComponent.framesX);
                const width = spriteSheetComponent.frameWidth * spriteComponent.scaleFactor;
                const height = spriteSheetComponent.frameHeight * spriteComponent.scaleFactor;

                ctx.save();
                ctx.imageSmoothingEnabled = spriteComponent.smooth;
                ctx.translate(positionComponent.positionX, positionComponent.positionY);
                ctx.rotate(spriteComponent.rotation);
                ctx.drawImage(
                    spriteSheetComponent.image, 
                    frameX * spriteSheetComponent.frameWidth, 
                    frameY * spriteSheetComponent.frameHeight, 
                    spriteSheetComponent.frameWidth, 
                    spriteSheetComponent.frameHeight, 
                    -width / 2,
                    -height / 2,
                    width,  
                    height);
                ctx.restore();
            }
        }
    }

    getSpriteSheetComponent(name) {
        if (!this.spriteSheetComponentMap) {
            this.spriteSheetComponentMap = new Map();
            const view = componentManager.getView('SpriteSheetComponent');
            for (const [spriteSheetComponent] of view) {
                this.spriteSheetComponentMap.set(spriteSheetComponent.name, spriteSheetComponent);
            }
        }
        return this.spriteSheetComponentMap.get(name);
    }
}

class PlayerSystem extends System {
    constructor() {
        super('game');
    }

    startup(componentManager) {
        const entityId = componentManager.createEntity();
        componentManager.addComponents(
            new PlayerComponent(entityId),
            new CollisionRadiusComponent(entityId, 50, 'Player'),
            new PositionComponent(entityId, canvas.width / 2, canvas.height - 50),
            new VelocityComponent(entityId, 0, 0),
            new SpriteComponent(entityId, 'Player', 0, 6, false),
            new AnimationStateComponent(entityId, true, 8)
        );
    }

    update(componentManager, gameFrme) {
        this.handleSpawn(componentManager);
        this.handleInput(componentManager);
        this.handleCollisions(componentManager);
    }

    handleSpawn(componentManager) {

        let view = componentManager.getView('PlayerComponent', 'SpriteComponent');
        if (view.length > 0) {
            const [playerComponent, spriteComponent] = view[0];

            if (playerComponent.respawnTimer > 0) {
                playerComponent.respawnTimer--;

                if (playerComponent.respawnTimer == 0) {
                    componentManager.addComponents(
                        new PositionComponent(playerComponent.entityId, canvas.width / 2, canvas.height - 50),
                    );
                    playerComponent.invulnerableTimer = playerSpawnInvulnerabilityTime;                }
            }
            else {
                if (playerComponent.invulnerableTimer > 0) {
                    spriteComponent.flash = true;
                    playerComponent.invulnerableTimer--;

                    if (playerComponent.invulnerableTimer == 0) {
                        spriteComponent.flash = false;
                    }
                }
            }
        }
    }

    handleInput(componentManager) {

        let view = componentManager.getView('PlayerComponent', 'PositionComponent', 'VelocityComponent');
        if (view.length > 0) {

            const [playerComponent, positionComponent, velocityComponent] = view[0];

            velocityComponent.velocityX = 0;
            velocityComponent.velocityY = 0;

            // Handle move
            if ((inputKeys.a || gamepadKeys.left) && positionComponent.positionX > 40) velocityComponent.velocityX -= pixelsPerFrameKeyboardVelocity;
            if ((inputKeys.d || gamepadKeys.right) && positionComponent.positionX < canvas.width - 40) velocityComponent.velocityX += pixelsPerFrameKeyboardVelocity;
            if ((inputKeys.w || gamepadKeys.up) && positionComponent.positionY > 50) velocityComponent.velocityY -= pixelsPerFrameKeyboardVelocity;
            if ((inputKeys.s || gamepadKeys.down) && positionComponent.positionY < canvas.height - 50) velocityComponent.velocityY += pixelsPerFrameKeyboardVelocity;

            // Handle fire
            if ((inputKeys.space || gamepadKeys.a) && playerComponent.fireCooldownTimer == 0) {

                const laserId = componentManager.createEntity();
                componentManager.addComponents(
                    new LaserComponent(laserId),
                    new PositionComponent(laserId, positionComponent.positionX, positionComponent.positionY - 25),
                    new VelocityComponent(laserId, 0, -20),
                    new SpriteComponent(laserId, 'Laser', 0, 5, false),
                    new CollisionRadiusComponent(laserId, 20, 'PlayerLaser'),
                );

                playerComponent.fireCooldownTimer = playerFireCooldownWait;
            }

            if (playerComponent.fireCooldownTimer > 0) playerComponent.fireCooldownTimer--;
        }
    }

    handleCollisions(componentManager) {
        let scoreDelta = 0;
        const view = componentManager.getView('PlayerComponent', 'PositionComponent', 'VelocityComponent', 'CollidingWithComponent');
        for (const [playerComponent, positionComponent, velocityComponent, collidingWithComponent] of view) {

            // If the player is not invulnerable
            if (playerComponent.invulnerableTimer == 0) {

                for (const collision of collidingWithComponent.collisions) {

                    // If the player collides with an enemy or enemy laser
                    if (collision.isNew && (collision.collisionGroup == 'Enemy' || collision.collisionGroup == 'EnemyLaser')) {
                        const explosionId = componentManager.createEntity();
                        componentManager.addComponents(
                            new PositionComponent(explosionId, positionComponent.positionX, positionComponent.positionY),
                            new VelocityComponent(explosionId, velocityComponent.velocityX, velocityComponent.velocityY),
                            new SpriteComponent(explosionId, 'Explosion', 0, 5, false),
                            new AnimationStateComponent(explosionId, true, 3, 5, true),
                        );

                        if (playerComponent.lives > 0) {
                            playerComponent.lives--;
                            playerComponent.respawnTimer = playerRespawnTime;
                            componentManager.removeComponent("PositionComponent", playerComponent.entityId);
                        }
                        if (playerComponent.lives == 0) {
                            componentManager.removeEntity(playerComponent.entityId);
                        }
                    }
                }
            }
        }
    }
}

class SpriteAnimateSystem extends System {

    update(componentManager, gameFrame) {
        const view = componentManager.getView('AnimationStateComponent', 'SpriteComponent');
        for (const [animationStateComponent, spriteComponent] of view) {

            if (animationStateComponent.animate) {
                if (animationStateComponent.pauseAfterFrame && spriteComponent.frame >= animationStateComponent.pauseAfterFrame) {
                    animationStateComponent.animationComplete = true;

                    if (animationStateComponent.deleteAfterComplete) {
                        componentManager.removeEntity(animationStateComponent.entityId);
                    }
                }
                else if (gameFrame % animationStateComponent.frameDelay == 0) {

                    spriteComponent.frame++;
                }
            }
        }
    }
}

class MovementSystem extends System {

    update(componentManager, gameFrame) {
        const impulseView = componentManager.getView('PositionComponent', 'ImpulseComponent');

        for (const [positionComponent, impulseComponent] of impulseView) {
            positionComponent.positionX += impulseComponent.velocityX;
            positionComponent.positionY += impulseComponent.velocityY;

            impulseComponent.frames--;
            if (impulseComponent.frames <= 0) {
                componentManager.removeComponent('ImpulseComponent', impulseComponent.entityId);
            }
        }

        const velocityView = componentManager.getView('PositionComponent', 'VelocityComponent');

        for (const [positionComponent, velocityComponent] of velocityView) {
            positionComponent.positionX += velocityComponent.velocityX;
            positionComponent.positionY += velocityComponent.velocityY;
        }
    }
}

class CollisionDetectionSystem extends System {
    constructor() {
        super('game');
    }

    update(componentManager, gameFrame) {
        // Set of previous collisions, key of form [entityId]=>[otherEntityId]
        const previousCollisions = new Map();

        // Snapshot already colliding
        const view = componentManager.getView('CollidingWithComponent');
        for (const [collidingWithComponent] of view) {
            for (const collision of collidingWithComponent.collisions) {
                previousCollisions.set('' + collidingWithComponent.entityId + '=>' + collision.otherEntityId);
            }
        }

        // Map of new collisions. Key is entity id, value is array of Collisions
        const newCollisions = new Map();

        // Update all collisions
        componentManager.removeAllComponentInstances('CollidingWithComponent');

        const view2 = componentManager.getView('PositionComponent', 'CollisionRadiusComponent');
        for (const [positionComponent, collisionRadiusComponent] of view2) {
            for (const [otherPositionComponent, otherCollisionRadiusComponent] of view2) {
                if (this.overlaps(positionComponent, collisionRadiusComponent, otherPositionComponent, otherCollisionRadiusComponent)) {
                    const isNew = !previousCollisions.has('' + positionComponent.entityId + '=>' + otherPositionComponent.entityId);

                    if (!newCollisions.has(positionComponent.entityId)) {
                        newCollisions.set(positionComponent.entityId, []);
                    }

                    const newCollision = new Collision(otherPositionComponent.entityId, otherCollisionRadiusComponent.collisionGroup, isNew);
                    newCollisions.get(positionComponent.entityId).push(newCollision);
                }
            }
        }

        // Now add all the components
        for (const [entityId, collisions] of newCollisions) {
            componentManager.addComponents(
                new CollidingWithComponent(entityId, collisions)
            );
        }
    }

    overlaps(positionComponent, collisionRadiusComponent, otherPositionComponent, otherCollisionRadiusComponent) {
        return (positionComponent.entityId != otherPositionComponent.entityId &&
               (Math.pow(positionComponent.positionX - otherPositionComponent.positionX, 2) +
                Math.pow(positionComponent.positionY - otherPositionComponent.positionY, 2)) < 
                Math.pow(collisionRadiusComponent.radius + otherCollisionRadiusComponent.radius, 2));

    }
}

class EnemySystem extends System {
    constructor() {
        super('game');
    }

    update(componentManager, gameFrame) {

        // Add new enemies
        if (gameFrame % 80 == 0) {

            const enemyType = Math.trunc(Math.random() * 3);
            var scale = 0;
            var points = 0;

            switch (enemyType) {
                case 0:
                    scale = 3;
                    points = 60;
                    break;
                case 1:
                    scale = 3;
                    points = 200;
                    break;
                case 2:
                    scale = 5;
                    points = 500;
                    break;
            }

            const radius = 14 * scale;
            var health = enemyType + 1;
            var spriteName = 'Enemy' + health;

            let entityId = componentManager.createEntity();
            componentManager.addComponents(
                new EnemyComponent(entityId, health, points), 
                new CollisionRadiusComponent(entityId, radius, 'Enemy'),
                new PositionComponent(entityId, (canvas.width - radius * 2) * Math.random() + radius, 0 - radius * 2),
                new VelocityComponent(entityId, 0, (Math.random() * 5 + 3)),
                new SpriteComponent(entityId, spriteName, 0, scale, false),
                new AnimationStateComponent(entityId, true, 10)
            );
        }

        // Handle enemy collisions
        let view = componentManager.getView('EnemyComponent', 'PositionComponent', 'VelocityComponent', 'CollidingWithComponent', 'AnimationStateComponent', 'SpriteComponent');

        for (const [enemyComponent, positionComponent, velocityComponent, collidingWithComponent, animationStateComponent, spriteComponent] of view) {
            for (const collision of collidingWithComponent.collisions) {
                var blowUp = false;
                if (collision.collisionGroup == 'PlayerLaser') {
                    enemyComponent.health -= 1;
                    if (enemyComponent.health == 0) { // Blow up                        
                        blowUp = true;
                        componentManager.addComponents(
                            new ModifyScoreComponent(componentManager.createEntity(), enemyComponent.points),
                        );
                    }
                    else { // Apply an impulse to create a bounce back effect
                        var entity = componentManager.getEntity(enemyComponent.entityId);
                        var impulseComponent = entity.get('ImpulseComponent');
                        if (impulseComponent) {
                            impulseComponent.velocityY -= enemyPushbackVelocity;
                            impulseComponent.frames += enemyPushbackOnHitTime;
                        }
                        else {
                            componentManager.addComponents(
                                new ImpulseComponent(enemyComponent.entityId, 0, -velocityComponent.velocityY - enemyPushbackVelocity, enemyPushbackOnHitTime),
                            );
                        }
                    }
                } else if (collision.collisionGroup == 'Player') {
                    blowUp = true;
                }
                if (blowUp) {
                    const explosionId = componentManager.createEntity();
                    componentManager.addComponents(
                        new PositionComponent(explosionId, positionComponent.positionX, positionComponent.positionY),
                        new VelocityComponent(explosionId, velocityComponent.velocityX, velocityComponent.velocityY),
                        new SpriteComponent(explosionId, 'Explosion', 0, 5, false),
                        new AnimationStateComponent(explosionId, true, 3, 5, true),
                    );
                    componentManager.removeEntity(enemyComponent.entityId);
                }
            }
        }

        // Remove enemies that have left the screen
        view = componentManager.getView('EnemyComponent', 'PositionComponent', 'CollisionRadiusComponent');

        for (const [enemyComponent, positionComponent, CollisionRadiusComponent] of view) {
            if (positionComponent.positionY > canvas.height + CollisionRadiusComponent.radius * 2) {
                componentManager.removeEntity(enemyComponent.entityId);
            }
        }

        // Fire weapons!
        view = componentManager.getView('EnemyComponent', 'PositionComponent');
        for (const [enemyComponent, positionComponent] of view) {            
            if (enemyComponent.fireCooldownTimer == 0) {
                const laserId = componentManager.createEntity();
                componentManager.addComponents(
                    new LaserComponent(laserId),
                    new PositionComponent(laserId, positionComponent.positionX, positionComponent.positionY + 25),
                    new VelocityComponent(laserId, 0, 15),
                    new SpriteComponent(laserId, 'Laser', 0, 5, false),
                    new CollisionRadiusComponent(laserId, 20, 'EnemyLaser'),
                );
                enemyComponent.fireCooldownTimer = enemyFireCooldownWait;
            }
            else {
                enemyComponent.fireCooldownTimer--;
            }
        }
    }
}

class LaserSystem extends System {
    constructor() {
        super('game');
    }

    update(componentManager, gameFrame) {

        // Handle laser collisions
        let view = componentManager.getView('LaserComponent', 'CollisionRadiusComponent', 'CollidingWithComponent');

        for (const [laserComponent, collisionRadiusComponent, collidingWithComponent] of view) {
            for (const collision of collidingWithComponent.collisions) {
                if ((collision.collisionGroup == 'Enemy' && collisionRadiusComponent.collisionGroup == 'PlayerLaser') ||
                    (collision.collisionGroup == 'Player' && collisionRadiusComponent.collisionGroup == 'EnemyLaser')) {

                    //TODO: Play proper sound effect

                    componentManager.removeEntity(laserComponent.entityId);
                }
            }
        }

        // Remove Lasers that have left the screen or collided and completed their animation
        view = componentManager.getView('LaserComponent', 'PositionComponent', 'CollisionRadiusComponent');

        for (const [laserComponent, positionComponent, collisionRadiusComponent] of view) {
            if ((positionComponent.positionY < 0 - collisionRadiusComponent.radius) ||
                (positionComponent.positionY > canvas.height + collisionRadiusComponent.radius)) {
                componentManager.removeEntity(laserComponent.entityId);
            }
        }
    }
}

class AudioSystem extends System {
    constructor() {
        super();
        this.soundEffectComponentMap;
    }

    update(componentManager, gameFrame) {
        const view = componentManager.getView('PlaySoundEffectComponent');
        for (const [playSoundEffectComponent] of view) { 
            const soundEffectComponent = this.getSoundEffectComponent(playSoundEffectComponent.soundName);
            //console.log('playing sound ' + playSoundEffectComponent.soundName);
            soundEffectComponent.sound.play();
        }

        componentManager.removeAllComponentInstances('PlaySoundEffectComponent');
    }

    getSoundEffectComponent(name) {
        if (!this.soundEffectComponentMap) {
            this.soundEffectComponentMap = new Map();
            const view = componentManager.getView('SoundEffectComponent');
            for (const [soundEffectComponent] of view) {
                this.soundEffectComponentMap.set(soundEffectComponent.soundName, soundEffectComponent);
            }
        }
        return this.soundEffectComponentMap.get(name);
    }
}

class BackgroundSystem extends System {
    constructor() {
        super('game');
    }

    startup(componentManager) {
        const bg1 = componentManager.createEntity();
        const bg2 = componentManager.createEntity();
        componentManager.addComponents(
            new BackgroundComponent(bg1),
            new PositionComponent(bg1, canvas.width / 2, canvas.height / 2),
            new VelocityComponent(bg1, 0, 1),
            new SpriteComponent(bg1, 'Background', 0, canvas.width / 256, false),
            new AnimationStateComponent(bg1, true, 25),

            new BackgroundComponent(bg2),
            new PositionComponent(bg2, canvas.width / 2, canvas.height / 2 - canvas.height),
            new VelocityComponent(bg2, 0, 1),
            new SpriteComponent(bg2, 'Background', 0, canvas.width / 256, false),
            new AnimationStateComponent(bg2, true, 25),
        );
    }

    update(componentManager, gameFrame) {
        const view = componentManager.getView('BackgroundComponent', 'PositionComponent');
        for (const [backgroundComponent, positionComponent] of view) {
            if (positionComponent.positionY >= canvas.height + canvas.height / 2) {
                positionComponent.positionY -= canvas.height * 2;
            }
        }
    }
}

class ScoreSystem extends System {

    startup(componentManager) {
        const entityId = componentManager.createEntity();
        componentManager.addComponents(
            new TotalScoreComponent(entityId, 0)
        );
    }

    update(componentManager, gameFrame) {
        const totalScoreView = componentManager.getView('TotalScoreComponent');
        if (totalScoreView.length > 0) {
            const [totalScoreComponent] = totalScoreView[0];

            const view = componentManager.getView('ModifyScoreComponent');
            for (const [modifyScoreComponent] of view) {
                totalScoreComponent.totalScore += modifyScoreComponent.delta;
            }
            componentManager.removeAllComponentInstances('ModifyScoreComponent');
        }
    }
}

class HudSystem extends System {
    constructor() {
        super('game');
    }

    update(componentManager, gameFrame) {
        const score = this.getTotalScore();
        const lives = this.getRemainingLives();

        this.updateExtraLifeGlyphs(lives);
        this.updateHighScore(score);
        this.updateDebugComponentCounts();
        
        if (lives == 0) {
            this.showGameOver();
        }
    }

    getTotalScore() {
        var score = 0;
        const totalScoreView = componentManager.getView('TotalScoreComponent');
        if (totalScoreView.length > 0) {
            const [totalScoreComponent] = totalScoreView[0];
            score = totalScoreComponent.totalScore;
        }
        return score;
    }

    getRemainingLives() {
        var lives = 0;
        const livesView = componentManager.getView('PlayerComponent');
        if (livesView.length > 0) {
            const [playerComponent] = livesView[0];

            lives = playerComponent.lives;
        }
        return lives;
    }

    updateExtraLifeGlyphs(lives) {
        const extraLivesView = componentManager.getView('ExtraLifeComponent');
        if (extraLivesView.length != lives) {
            for (var [extraLifeComponent] of extraLivesView) {
                componentManager.removeEntity(extraLifeComponent.entityId);
            }

            for (var i = 0; i < lives; i++) {
                const entityId = componentManager.createEntity();
                componentManager.addComponents(
                    new ExtraLifeComponent(entityId),
                    new PositionComponent(entityId, 760 - i * 64, 40),
                    new SpriteComponent(entityId, 'Player', 0, 4, false),
                );
            }
        }
    }

    updateHighScore(score) {
        ctx.font = '50px "Pixeloid Sans"';
        ctx.fillStyle = 'white';
        ctx.fillText('score: ' + score, 10, 50);
    }

    updateDebugComponentCounts() {
        if (inputKeys.q) {
            ctx.fillStyle = 'grey';
            var stats = componentManager.getStats();
            var yOffset = 100;
            if (stats) {
                for (const [componentName, count] of stats) {
                    ctx.fillText(componentName + ': ' + count, 10, yOffset);
                    yOffset += 50;
                }
            }
        }
    }

    showGameOver() {
        ctx.font = '100px "Pixeloid Sans"';
        ctx.fillStyle = 'white';
        ctx.fillText('Game Over', 130, 700);
    }
}

class PregameSystem extends System {
    constructor() {
        super('pregame');
    }

    startup(componentManager) {
        const entityId = componentManager.createEntity();
        componentManager.addComponents(
            new PositionComponent(entityId, canvas.width / 2, canvas.height / 2),
            new SpriteComponent(entityId, 'StartScreen', 0, canvas.width / 256),
            new AnimationStateComponent(entityId, true, 10),
            new CreditsComponent(componentManager.createEntity()),
        );
    }

    update(componentManager, gameFrame) {
        if (inputKeys.one || inputKeys.two) {
            componentManager.addComponents(
                new ChangePhaseComponent(componentManager.createEntity(), 'game'),
            );
        }

        var view = componentManager.getView('CreditsComponent');
        var [creditsComponent] = view[0];

        if (inputKeys.five) {
            creditsComponent.credits++;
        }

        if (creditsComponent.credits > 0) {
            ctx.font = '50px "Pixeloid Sans"';
            ctx.fillStyle = 'white';
            ctx.fillText('CREDITS: ' + creditsComponent.credits, 240, 1500);
        }
    }
}

// Initialization
let gameFrame = 0;

const componentManager = new ComponentManager();
const systemManager = new SystemManager(componentManager);
systemManager.registerSystem(new GamePhaseSystem());
systemManager.registerSystem(new BackgroundSystem());
systemManager.registerSystem(new PlayerSystem());
systemManager.registerSystem(new MovementSystem());
systemManager.registerSystem(new CollisionDetectionSystem());
systemManager.registerSystem(new LaserSystem());
systemManager.registerSystem(new EnemySystem());
systemManager.registerSystem(new SpriteAnimateSystem());
//systemManager.registerSystem(new AudioSystem());
systemManager.registerSystem(new RenderSpritesSystem());
//systemManager.registerSystem(new RenderCollisionRegionsForDebugSystem());
systemManager.registerSystem(new ScoreSystem());
systemManager.registerSystem(new HudSystem());
systemManager.registerSystem(new PregameSystem());

const playerImage = createImage('player.png');
const backgroundImage = createImage('stars.png');
const laserImage = createImage('laser.png');
const enemy1Image = createImage('enemy1.png');
const enemy2Image = createImage('enemy2.png');
const enemy3Image = createImage('enemy3.png');
const explosionImage = createImage('boom.png');
const startScreenImage = createImage('startscreen.png');

componentManager.addComponents(
    new SpriteSheetComponent(componentManager.createEntity(), 'Player', playerImage, 4, 4, 13, 16, 16),
    new SpriteSheetComponent(componentManager.createEntity(), 'Background', backgroundImage, 3, 2, 5, 256, 512),
    new SpriteSheetComponent(componentManager.createEntity(), 'Laser', laserImage, 1, 1, 1, 32, 32),
    new SpriteSheetComponent(componentManager.createEntity(), 'Enemy1', enemy1Image, 2, 2, 4, 32, 32),
    new SpriteSheetComponent(componentManager.createEntity(), 'Enemy2', enemy2Image, 3, 4, 12, 32, 32),
    new SpriteSheetComponent(componentManager.createEntity(), 'Enemy3', enemy3Image, 2, 3, 6, 32, 32),
    new SpriteSheetComponent(componentManager.createEntity(), 'Explosion', explosionImage, 3, 3, 7, 32, 32),
    new SpriteSheetComponent(componentManager.createEntity(), 'StartScreen', startScreenImage, 2, 2, 3, 256, 512),
);

systemManager.startup(componentManager);

// Animation Loop
function animate(params) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    systemManager.update(gameFrame);

    pollGamepadState();

    gameFrame++;
    requestAnimationFrame(animate);
}
animate();
