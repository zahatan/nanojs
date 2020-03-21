class NObject {

    prototypes = undefined;

    constructor() {
    }

    listPrototypes(prefix) {
        if(this.prototypes === undefined) {
            this.prototypes = this._getPrototypes(Object.getPrototypeOf(this));
        }
        return this.prototypes.filter(function (p) {
            return p.startsWith(prefix);
        });
    }

    hasPrototype(name) {
       return this[name] !== undefined;
    }

    _getPrototypes(prototype) {

        let prototypes = Object.getOwnPropertyNames(prototype).filter(function (p) {
            return typeof prototype[p] === 'function'
        });

        let constructor = Object.getPrototypeOf(prototype.constructor);
        if(constructor.name !== 'NObject') {
            if(constructor.prototype) {
                let tmp = this._getPrototypes(constructor.prototype);
                prototypes = prototypes.concat(tmp);
            }
        }
        return prototypes;
    }

}
