class NListenable {

    constructor(options) {
        this.options = new NOption(options);


    }

    registerListeners() {
        /**
         * Register listeners from options
         */

         let _options = this.options.getOptions();

         if(this.elt) {
             if(_options.hasOwnProperty('listeners')) {
                 for(const i in _options.listeners) {
                     this.registerListener(_options.listeners[i]);
                 }
             }
         }
    }

    registerListener(listener) {

        try {
            let instance = new listener(this.elt);
            instance.target = this;
        } catch (e) {
            console.error(e);
            console.error('Listener MUST be a constructable');
        }
    }
}
