class LaravelRequest extends NRequest {
    constructor(options) {
        super(options);
        let header = document.querySelector('meta[name="csrf-token"]');
        if(header) {
            this.headers['X-CSRF-TOKEN'] = header.getAttribute('content');
        }

    }
}

class LaravelForm extends NForm {
    constructor(selector) {
        super(selector, LaravelRequest);

        this.request.options.set('type', 'json');

        this.request.registerResponseHandler(this);
    }

    on_request_error(xhr, response, json) {
        console.log('error', response);
    }
}