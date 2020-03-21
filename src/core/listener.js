class NListenable {

    listeners = [];

    constructor(selector) {

        if(selector instanceof Element) {
            this.elt = selector;
        } else {
            this.elt = document.querySelector(selector);
        }

    }

}