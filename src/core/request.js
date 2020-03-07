
class NRequest {

    method = 'post';
    url = '';
    state_listeners = [];
    response_handlers = [];

    headers = {
        'Content-Type' : 'application/json; charset=utf-8',
        'Accept' : 'application/json'
    };

    /**
     *
     */
    constructor(options) {
        this.xhr = new XMLHttpRequest();
        this.xhr.withCredentials = true;
        this.xhr.onreadystatechange = this.onStateChanged.bind(this);

        this.options = new NOption(options);

        this.registerStateListener(new NRequestStateListener());

        this._setupHandlers();
    }

    _setupHandlers() {

        let options = this.options.getOptions();

        if(options.hasOwnProperty('response_handlers')) {
            for(const i in options.response_handlers) {
                let handler = options.response_handlers[i];
                this.registerResponseHandler(handler);
            }
        }
    }

    onStateChanged(){
        this.dispatchState(this.xhr.readyState, this.xhr);
    }

    registerResponseHandler(handler) {
        this.response_handlers.push(handler);
    }

    registerStateListener(listener) {
        this.state_listeners.push(listener);
    }

    dispatchState(state, xhr) {
        for(let i in this.state_listeners) {
            let listener = this.state_listeners[i];
            if(listener.onRequestStateChange) {
                listener.onRequestStateChange.call(listener, this, state, this.xhr);
            }
        }
    }

    /**
     *
     */
    prepare(method, url, headers) {

        this.method = method;
        this.url = url;

        // Prepare custom headers
        if(headers) {
            for(const header in headers) {
                this.headers[header] = headers[header];
            }
        }
    }

    /**
     *
     */
    send(data) {

        if(data !== undefined && !(data instanceof NRequestData)) {
            console.error();
        }

        let url = this.url;
        let method = this.method.toUpperCase();

        if(this.xhr.readyState !== XMLHttpRequest.OPENED) {
            if(method === 'GET' && data !== undefined) {
                let queryString = data.toQueryString();
                if(queryString) {
                    url = url + '?' + queryString;
                }
            }
            this.xhr.open(this.method, url, true);
        }

        if(method === 'GET') {
            this.xhr.send();
        } else {
            this.xhr.send(data.toFormData());
        }
    }
}

class NRequestData {

    data = {};

    attachments = {};

    constructor() {
    }

    append(name, value) {
        if(value instanceof File) {
            this._append(name, value, this.attachments);
        } else {
            this._append(name, value, this.data);
        }
    }

    _append(name, value, destination) {
        if(!destination.hasOwnProperty(name)) {
            destination[name] = value;
        } else {
            if(Array.isArray(destination[name])) {
                destination[name].push(value);
            } else {
                destination[name] = [destination[name], value];
            }
        }
    }

    set(name, value) {
        if(value instanceof File) {
            this.attachments[name] = value;
        } else {
            this.data[name] = value;
        }
    }

    toQueryString() {
        if(Object.keys(this.data).length > 0) {
            let components = [];
            for (let p in this.data) {
                if (this.data.hasOwnProperty(p)) {
                    components.push(this._fixURIComponent(p) + '=' + this._fixURIComponent(this.data[p]));
                }
            }
            return components.join("&");
        } else {
            return null;
        }
    }

    toFormData() {
        let fdata = new FormData();

        if(Object.keys(this.data).length > 0) {
            fdata.set('data', JSON.stringify(this.data));
        } else {
            fdata.set('data', null);
        }

        if(Object.keys(this.attachments).length > 0) {
            for (let p in this.attachments) {
                let attachment = this.attachments[p];
                if(Array.isArray(attachment)) {
                    for(let i = 0; i < attachment.length; i++) {
                        fdata.append(p, attachment[i]);
                    }
                } else {
                    fdata.set(p, attachment);
                }
            }
        }

        return fdata;
    }

    _fixURIComponent(str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
            return '%' + c.charCodeAt(0).toString(16);
        });
    };

}

class NRequestStateListener {
    onRequestStateChange(request, state, xhr) {

        switch (state) {
            case XMLHttpRequest.OPENED:
                // request headers can be updated here
                for(const header in request.headers) {
                    xhr.setRequestHeader(header, request.headers[header]);
                }
                break;
            case XMLHttpRequest.HEADERS_RECEIVED:
                break;
            case XMLHttpRequest.LOADING:
                break;
            case XMLHttpRequest.DONE:

                if(request.response_handlers.length > 0) {

                    let response_json = null;

                    for(let i in request.response_handlers) {
                        let handler = request.response_handlers[i];
                        if(handler) {

                            if(handler instanceof JsonResponseHandler) {
                                try {
                                    response_json = JSON.parse(xhr.responseText);
                                }
                                catch(error) {
                                }
                            }

                            if(xhr.status >= 200 && xhr.status < 400) {
                                if(handler.on_request_success) {
                                    handler.on_request_success.call(handler, xhr.status, xhr.responseText, response_json);
                                }

                            } else if(xhr.status >= 400) {
                                if(handler.on_request_error) {
                                    handler.on_request_error.call(handler, xhr.status, xhr.responseText, response_json);
                                }
                            }
                        }
                    }
                }

                break;
        }
    }
}

class JsonResponseHandler {

}