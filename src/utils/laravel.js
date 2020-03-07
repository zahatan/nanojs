class LaravelRequest extends NRequest {
    constructor(options) {
        super(options);
        let header = document.querySelector('meta[name="csrf-token"]');
        if(header) {
            this.headers['X-CSRF-TOKEN'] = header.getAttribute('content');
        }

    }
}