class NView {
    constructor(selector, options) {

        if(selector instanceof Element) {
            this.elt = selector;
        } else {
            this.elt = document.querySelector(selector);
        }

        this.listeners = [];

        this._setupViewID();
        this.options = options;
        this.elt.setAttribute('nano-view', '');

        this.options = new NOption(options);

        let globalOptions = NOption.unload(selector);
        this.options.merge(globalOptions);
        this._setupListeners();
    }

    /**
     *
     * @private
     */
    _setupListeners() {

        let objectOptions = this.options.getOptions();

        if(objectOptions.hasOwnProperty('listeners')) {
            this.listeners = objectOptions.listeners;
            for(const i in this.listeners) {
                let listener = this.listeners[i];
                this.registerListener(listener);
            }
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

    registerListener(listener) {
        let instance = new listener(this);
        instance.view = this;

        let prototypes = Object.getOwnPropertyNames(listener.prototype).filter(function (p) {
            return typeof listener.prototype[p] === 'function';
        });

        prototypes.forEach(function(p, index){
            if(p.startsWith('on_')) {
                let event = p.substr(3);
                this.elt.addEventListener(event, listener.prototype[p].bind(instance));
            }
        }, this);

        this.listeners.push(instance);
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

class NViewListener {
    constructor() {
        this.view = undefined;
    }
}