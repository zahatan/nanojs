class NView extends NListenable {
    constructor(selector, options) {
        super(options);

        if(selector instanceof Element) {
            this.elt = selector;
        } else {
            this.elt = document.querySelector(selector);
        }

        if(this.elt) {
            this._setupViewID();
            this.elt.setAttribute('nano-view', '');

            this.registerListeners();
        } else {
            console.error('View element not found');
        }
    }

    /**
     *
     * @private
     */
    _setupViewID()
    {
        if(this.elt.hasAttribute('id')) {
            let elt_id = this.elt.getAttribute('id');
            if(elt_id.trim() !== '') {
                this.id = elt_id;
            } else {
                this.id = NViewBuilder.generateViewId();
                this.elt.setAttribute('id', this.id);
            }
        } else {
            this.id = NViewBuilder.generateViewId();
            this.elt.setAttribute('id', this.id);
        }
    }

    getElement() {
        return this.elt;
    }
}

class NViewBuilder {

    static id_index = 0;

    /**
     *
     * @param selector
     * @param options
     */
    static setup(selector, options) {
        let elements = document.querySelectorAll(selector);
        elements.forEach(function(element, index) {
            if(!element.hasAttribute('nano-view')) {
                let view = new NView(element, options);
            }
        });
    }

    /**
     *
     */
    static generateViewId()
    {
        let rand = 100000 + Math.floor(899999 * Math.random());
        let id = '_nano_id_' + NViewBuilder.id_index + '_' + rand;
        NViewBuilder.id_index++;
        return id;
    }
}
