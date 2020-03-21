class NForm extends NView {

    constructor(selector, request) {
        super(selector);
        if(request !== undefined) {
            this.request = new request();
        } else {
            this.request = new NRequest();
        }

        this.elt.setAttribute('nn-form', '');

        this.request.prepare(this.elt.method || 'post', this.elt.action);
        this.registerListener(NFormListener);
    }

    submit() {
        let data = new FormData(this.elt);
        this.request.send(data);
    }

    static register_all() {
        const forms = document.querySelectorAll('form');
        forms.forEach(function(form){
            if(!form.hasAttribute('nn-form')) {
                let f = new this(form);
            }
        }, this);
    }
}

class NFormListener extends NListener {
    on_submit(event) {
        event.preventDefault();
        this.target.submit();
    }
}
