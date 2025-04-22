export class Transform2d{
    //represents a combination of 2d translation, rotation, and scaling
    /*
        [ a c e ][ x ]   [ x' ]      x' = ax + cy + e
        [ b d f ][ y ] = [ y' ]      y' = bx + dy + f
        [ 0 0 1 ][ 1 ]   [ 1  ]
    */
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
    constructor(a, b, c, d, e, f){
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.e = e;
        this.f = f;
    }
    applyTo(vec: {x: number, y: number}){
        return {
            x: this.a * vec.x + this.c * vec.y + this.e,
            y: this.b * vec.x + this.d * vec.y + this.f,
        }
    }
    then(other: Transform2d): Transform2d{
        /*
        [ a c e ][ a c e ]
        [ b d f ][ b d f ]
        [ 0 0 1 ][ 0 0 1 ]
        */
        return new Transform2d(
            other.a * this.a + other.c * this.b,
            other.b * this.a + other.d * this.b,
            other.a * this.c + other.c * this.d, 
            other.b * this.c + other.d * this.d,
            other.a * this.e + other.c * this.f + other.e,
            other.b * this.e + other.d * this.f + other.f)
    }
    composeWith(other: Transform2d){
            this.a = other.a * this.a + other.c * this.b
            this.b = other.b * this.a + other.d * this.b
            this.c = other.a * this.c + other.c * this.d
            this.d = other.b * this.c + other.d * this.d
            this.e = other.a * this.e + other.c * this.f + other.e
            this.f = other.b * this.e + other.d * this.f + other.f
            return this;
    }
    inverse():Transform2d{
       /*([ a c e ]
          [ b d f ]
          [ 0 0 1 ]*/
        let det = this.a * this.d - this.b * this.c;
        if(det == 0){
            return this;
        }
        return new Transform2d(
            this.d / det,
            -this.b / det,
            -this.c / det,
            this.a / det,
            (-this.d * this.e + this.c * this.f) / det,
            (-this.a * this.f + this.b * this.e) / det
        );
    }
    toSvgString(){
        return `matrix(${this.a} ${this.b} ${this.c} ${this.d} ${this.e} ${this.f})`
    }
    static translation(x: number, y: number): Transform2d{
        return new Transform2d(1,0,0,1,x,y);
    }
    static rotation(angle){
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        return new Transform2d(cos, -sin, cos, sin, 0, 0);
    }
    static scale(scale){
        return new Transform2d(scale, 0,0, scale, 0, 0);
    }
    static scaleXY(scaleX, scaleY){
        return new Transform2d(scaleX, 0, 0, scaleY, 0, 0);
    }
    static nothing(){
        return new Transform2d(1,0,0,1,0,0);
    }
}
