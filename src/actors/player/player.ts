import { Actor, Color, Engine, vec, Input, CollisionType  } from 'excalibur';
import { Resources } from '../../resources';

export class Player extends Actor {
    constructor() {
        super({
            pos: vec(150, 150),
            width: 25,
            height: 25,
            color: new Color(255, 255, 255)
        });

        this.body.collisionType = CollisionType.Active;
    }

    public onInitialize(engine: Engine) {
        
        this.graphics.add(Resources.Sword)
        
        engine.input.pointers.primary.on("move", (evt) => {
            this.pos.x = evt.worldPos.x
            this.pos.y = evt.worldPos.y
        })
        

        engine.input.keyboard.on("hold",(press) => {

            switch(press.key) {
                case Input.Keys.Up:
                case Input.Keys.W:
                    this.pos.y = this.pos.y - 10
                    break
                case Input.Keys.Down:
                case Input.Keys.S:
                    this.pos.y = this.pos.y + 10
                    break
                case Input.Keys.Left:
                case Input.Keys.A:
                    this.pos.x = this.pos.x - 10
                    break
                case Input.Keys.Right:
                case Input.Keys.D:
                    this.pos.x = this.pos.x + 10
                    break
            }
        })
    }
}
