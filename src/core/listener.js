class NListener extends NObject {

    /**
     *
     * @param selector
     */
    constructor(selector) {
        super();
        if(selector instanceof Element) {
            this.elt = selector;
        } else {
            this.elt = document.querySelector(selector);
        }
        if(this.elt) {
            let prototypes = this.listPrototypes('on_');
            prototypes.forEach(function(p, index){
                let event = p.substr(3);
                this.elt.addEventListener(event, this[p].bind(this));
            }, this);
        }
    }
}
