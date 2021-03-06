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

class NOption {

    static option_registry = {};

    constructor(options) {
        this.values = options || {};
    }

    getOptions() {
        return this.values;
    }

    merge(options) {
        if(options !== undefined) {
            for(let name in options) {
                let value = options[name];
                if(!this.values.hasOwnProperty(name)) {
                    this.values[name] = value;
                } else {
                    this.mergeWith(this.values[name], value);
                }
            }
        }
    }

    mergeWith(dest, options) {
        if(Array.isArray(dest)) { // merge array
            if(Array.isArray(options)) {
                dest = dest.concat(options);
            } else {
                dest.push(options);
            }
        } else if(typeof dest === 'object' && dest !== null) { // merge object
            for(let name in options) {
                let value = options[name];
                if(!dest.hasOwnProperty(name)) {
                    dest[name] = value;
                } else {
                    this.mergeWith(dest[name], value);
                }
            }
        } else { // merge scalar
            dest = options;
        }
    }

    get(name) {
        return this.values.hasOwnProperty(name) ? this.values[name] : undefined;
    }

    set(name, value) {
        this.values[name] = value;
    }

    static unload(selector) {
        return NOption.option_registry.hasOwnProperty(selector) ? NOption.option_registry[selector] : undefined;
    }

    static load(selector, options){
        NOption.option_registry[selector] = options;
    }
}
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

class NModel {

}

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

        let url = this.url;
        let method = this.method.toUpperCase();

        if(this.xhr.readyState !== XMLHttpRequest.OPENED) {
            if(method === 'GET' && data !== undefined) {
                let queryString = this.toQueryString(data);
                if(queryString) {
                    url = url + '?' + queryString;
                }
            }
            this.xhr.open(this.method, url, true);
        }

        if(method === 'GET') {
            this.xhr.send();
        } else {
            if(data instanceof NRequestData) {
                data = data.toFormData();
            }
            this.xhr.send(data);
        }
    }

    toQueryString(data) {
        if(data instanceof NRequestData) {
            return data.toQueryString();
        } else {
            let rdata = new NRequestData();
            for (let key of data.keys()) {
                rdata.append(key, data.get(key));
            }
            return rdata.toQueryString();
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

                            if(request.options.get('type') === 'json') {
                                try {
                                    response_json = JSON.parse(xhr.responseText);
                                }
                                catch(error) {
                                }
                            }

                            if(xhr.status >= 200 && xhr.status < 400) {
                                if(handler.on_request_success) {
                                    handler.on_request_success.call(handler, xhr.status, response_json || xhr.responseText);
                                }

                            } else if(xhr.status >= 400) {
                                if(handler.on_request_error) {
                                    handler.on_request_error.call(handler, xhr.status, response_json || xhr.responseText);
                                }
                            }
                        }
                    }
                }

                break;
        }
    }
}

class RedirectResponseHandler {
    on_request_success(xhr, response, json) {
        if(response.hasOwnProperty('next')) {
            window.location.href = response.next;
        } else {
            window.location.reload();
        }
    }

    on_request_error(xhr, response, json) {

    }
}

class ReloadResponseHandler {
    on_request_success(xhr, response, json) {
        window.location.reload();
    }

    on_request_error(xhr, response, json) {

    }
}

class NTemplate {
    /**
     *
     * @type {string}
     */
    static prefix = 'nn';

    /**
     *
     * @type {string}
     */
    static namespace = 'https://github.com/zahatan/nanojs';

    /**
     *
     * @param selector
     */
    constructor(selector) {
        this._element = document.querySelector(selector);
    }

    render(data, target) {

        let xml = this.prepareXML();

        let context = new NTemplateContext(data, xml);

        if(!(target instanceof Element)) {
            target = document.querySelector(target);
        }

        if(target instanceof Element) {
            context.process();
            context.render(target);
        }
    }

    /**
     *
     * @returns {Element}
     */
    prepareXML() {
        let parser = new DOMParser();
        let template_source = '<template xmlns:' + NTemplate.prefix + '="' + NTemplate.namespace + '">' + this._element.innerHTML + '</template>';
        let xml = parser.parseFromString(template_source, "text/xml");
        return xml.children.item(0);
    }
}
class NTemplateContext {

    attributes = {};

    children = [];

    constructor(data, node, parent) {
        this.data = data;
        this.node = node;
        this.parent = parent;
        this.tag = this.node.tagName;
        this.content = '';
        this.add = true;
    }

    hide() {
        this.add = false;
    }

    process() {
        this.process_self();

        let children = this.node.childNodes;

        if(children.length > 0) {
            children.forEach(function(child, index){
                let context = new NTemplateContext({}, child, this);
                context.process();
            }, this);
        }

        if(this.parent !== undefined && this.add) {
            this.parent.append_child(this);
        }
    }

    process_self()
    {
        switch (this.node.nodeType) {

            case Node.ELEMENT_NODE:
                if(this.node.prefix === NTemplate.prefix) {
                    this.process_nano_tag();
                } else {
                    this.process_html_tag();
                }
                break;

            case Node.TEXT_NODE:
                let text = this.node.textContent.trim();
                if(text.length > 0) {
                    this.content = ' ' + this.eval_string(text) + ' ';
                }
                break;

            case Node.CDATA_SECTION_NODE:
                this.content = '<![CDATA[  ' + this.node.nodeValue + ' ]]>';
                break;
        }
    }

    process_nano_tag() {

        let attributes = {};

        // copy HTML attributes
        for(let i = 0; i < this.node.attributes.length; i++) {
            let attr = this.node.attributes[i];
            attributes[attr.localName] = attr.value;
        }

        let processor = NTemplateProcessor.getTag(this.node.localName);
        if(processor !== undefined) {
            let instance = new processor();
            instance.process(this, this.node, attributes);
        }
    }

    /**
     *
     * @param elt
     * @private
     */
    process_html_tag() {

        let html_attributes = {};
        let nano_attributes = {};

        // copy HTML attributes
        for(let i = 0; i < this.node.attributes.length; i++) {
            let attr = this.node.attributes[i];
            if(attr.prefix === null) {
                html_attributes[attr.localName] = attr.value;
            } else if(attr.prefix === NTemplate.prefix) {
                nano_attributes[attr.localName] = attr.value;
            }
        }

        if(Object.keys(nano_attributes).length > 0) {
            this.process_nano_attr(nano_attributes, html_attributes);
        } else {
            this.process_html_attr(html_attributes);
        }
    }

    process_nano_attr(nano_attributes, html_attributes) {

        for(let attr in nano_attributes) {
            let processor = NTemplateProcessor.getAttr(attr);
            if(processor !== undefined) {
                let instance = new processor();
                instance.process(this, this.node, nano_attributes, html_attributes);
            }
        }
        if(this.add) {
            for(let attr in html_attributes) {
                this.attributes[attr] = this.eval_string(html_attributes[attr]);
            }
        }
    }

    process_html_attr(html_attributes) {
        for(let attr in html_attributes) {
            this.attributes[attr] = this.eval_string(html_attributes[attr]);
        }
    }

    append_child(child) {
        if(Array.isArray(child)) {
            if(child.length > 0) {
                for(let i = 0; i < child.length; i++) {
                    this.children.push(child[i]);
                }
            }
        } else {
            this.children.push(child);
        }
    }

    have_nano_attribute(name) {
        for(let i = 0; i < this.node.attributes.length; i++) {
            let attr = this.node.attributes[i];
            if(attr.prefix === NTemplate.prefix && attr.localName === name){
                return true;
            }
        }
        return false;
    }

    static clear_nano_attributes(elt, nano_attributes) {
        for(let attr in nano_attributes) {
            elt.removeAttributeNS(NTemplate.namespace, attr);
        }
    }

    /**
     *
     * @param target
     * @returns {Window}
     */
    render(target) {

        if(this.parent === undefined) {
            if(this.children.length > 0) {
                for(let i = 0; i < this.children.length; i++) {
                    let child = this.children[i];
                    child.render(target);
                }
            }
        } else {
            let element = undefined;
            if(this.tag !== undefined) {
                element = document.createElement(this.tag);
                element.innerHTML = this.content;
                for(let attr in this.attributes) {
                    element.setAttribute(attr, this.attributes[attr]);
                }
                if(this.children.length > 0) {
                    for(let i = 0; i < this.children.length; i++) {
                        let child = this.children[i];
                        child.render(element);
                    }
                }
                target.appendChild(element);

            } else {
                element = document.createTextNode(this.content);
                target.appendChild(element);
            }
        }
    }

    /**
     *
     * @param name
     * @returns {*}
     */
    get(name, strict = false) {
        let done = [];
        let paths = name.split('.');
        let current = this.data;
        while(paths.length > 0) {
            let key = paths.shift();
            done.push(key);
            current = current[key];
            if(current === undefined) {
                break;
            }
        }

        if(current === undefined && this.parent !== undefined) {
            current = this.parent.get(name);
        }

        if(strict && current === undefined) {
            current = name;
        }

        return current;
    }

    set(name, value) {
        this.data[name] = value;
    }

    /**
     *
     * @param value
     * @returns {Node}
     * @private
     */
    eval_string(value) {
        const regex = /{{([^}]+)}}/g;
        let original_value = value;
        let matches = value.match(regex);
        if(matches && matches.length > 0) {
            for(let i = 0; i < matches.length; i++) {
                let match = matches[i];
                let key = match.substring(2, match.length - 2).trim();
                value = value.replace(match, this.get(key));
            }
        }

        return (value !== undefined) ? value : original_value;
    }

    /**
     *
     */
    eval_attributes() {
        for(let attr in this.attributes) {
            this.attributes[attr] = this.eval_string(this.attributes[attr]);
        }
    }
}
class NTemplateProcessor {

    static _tag_registry = {};

    static _attribute_registry = {};

    static getAttr(name) {
        if(NTemplateProcessor._attribute_registry.hasOwnProperty(name)) {
            return NTemplateProcessor._attribute_registry[name];
        } else {
            return undefined;
        }
    }

    static registerAttr(processor) {
        let name = processor._name;
        if(name !== undefined) {
            if(!NTemplateProcessor._attribute_registry.hasOwnProperty(name)) {
                NTemplateProcessor._attribute_registry[name] = processor;
            } else {
                console.log('Processor for attribute [' + NTemplate.prefix + ':' + name + '] already registered. Ignoring current request.');
            }
        } else {
            console.error('Attribute processor must set static _name value');
        }
    }

    static getTag(name) {
        if(NTemplateProcessor._tag_registry.hasOwnProperty(name)) {
            return NTemplateProcessor._tag_registry[name];
        } else {
            return undefined;
        }
    }

    static registerTag(processor) {
        let name = processor._name;
        if(name !== undefined) {
            if(!NTemplateProcessor._tag_registry.hasOwnProperty(name)) {
                NTemplateProcessor._tag_registry[name] = processor;
            } else {
                console.log('Processor for tag [' + NTemplate.prefix + ':' + name + '] already registered. Ignoring current request.');
            }
        } else {
            console.error('Tag processor must set static _name value');
        }
    }
}

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

class NCallableTagProcessor {

    static _name = 'callable';

    constructor() {
        this.args = [];
    }

    /**
     *
     * @param context
     * @param elt
     * @param attributes
     */
    process(context, elt, attributes) {

        context.hide();

        /**
         * Prepare callable arguments
         * @type {NodeListOf<ChildNode> | ActiveX.IXMLDOMNodeList}
         */
        let children = context.node.childNodes;

        if(children.length > 0) {
            children.forEach(function(child, index){
                if(child.prefix === NTemplate.prefix && child.localName === 'arg') {
                    let value = context.eval_string(child.textContent.trim());
                    this.args.push(value);
                }
            }, this);
        }

        let callable = attributes['function'];

        let content = document.createTextNode(this.execute(callable, window, this.args));

        let child_context = new NTemplateContext({}, content, context.parent);
        child_context.process();
    }

    /**
     *
     * @param name
     * @param context
     * @param args
     * @returns {*}
     */
    execute(name, context , args) {
        let namespaces = name.split(".");
        let func = namespaces.pop();
        for(let i = 0; i < namespaces.length; i++) {
            context = context[namespaces[i]];
        }
        return context[func].apply(context, args);
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    NTemplateProcessor.registerTag(NCallableTagProcessor);
});
/**
 * Datetime processor use: https://momentjs.com/
 */

class NDatetimeTagProcessor {
    static _name = 'datetime';
    constructor() {
    }

    process(context, elt, attributes) {
        context.hide();
        let date = context.get(attributes['with'], true);
        date = moment(date);
        let format;

        if(attributes.hasOwnProperty('format')) {
            format = attributes['format'];
        } else {
            format = 'DD/MM/YYYY'
        }

        // Create a new text content

        let text_node = document.createTextNode(date.format(format));

        let child_context = new NTemplateContext({}, text_node, context.parent);
        child_context.process();
    }
}

class NDatetimeDiffTagProcessor {
    static _name = 'datetime-diff';
    constructor() {
    }

    process(context, elt, attributes) {
        context.hide();
        let date = context.get(attributes['with'], true);

        date = moment(date);

        let diff = moment().diff(date);

        if(attributes.hasOwnProperty('auto-update')) {
            let child_node = document.createElement('span');
            child_node.classList.add('--nano-update-time-diff');
            child_node.dataset['time0'] = date.toDate().getTime();
            child_node.innerHTML = moment.duration(diff).humanize();

            let child_context = new NTemplateContext({}, child_node, context.parent);
            child_context.process();

        } else {
            // Create a new text content

            let text_node = document.createTextNode(moment.duration(diff).humanize());

            let child_context = new NTemplateContext({}, text_node, context.parent);
            child_context.process();
        }
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    NTemplateProcessor.registerTag(NDatetimeTagProcessor);
    NTemplateProcessor.registerTag(NDatetimeDiffTagProcessor);

    setInterval(function(){
        let time_displays = document.querySelectorAll('.--nano-update-time-diff');

        time_displays.forEach(function(elt){
            let time_0 = (new Date()).setTime(parseInt(elt.dataset.time0));
            let diff = moment().diff(moment(time_0));
            elt.innerHTML = moment.duration(diff).humanize();
        });
    }, 30000);
});
class NIfTagProcessor {

    static _name = 'if';

    process(context, elt, attributes) {
        let value = context.get(attributes['test']);
        context.hide();

        if(value === true) {
            let children = context.node.childNodes;
            if(children.length > 0) {
                children.forEach(function(child, index) {
                    let child_context = new NTemplateContext({}, child, context.parent);
                    child_context.process();
                }, this);
            }
        }
    }
}


class NIfAttributeProcessor {

    static _name = 'if';

    process(context, elt, nano_attributes, html_attributes) {
        let value = context.get(nano_attributes[NIfAttributeProcessor._name]);

        if(value === true) {
            NTemplateContext.clear_nano_attributes(elt, nano_attributes);
        } else {
            context.hide();
        }
    }
}

class NIfNotTagProcessor {

    static _name = 'if-not';

    process(context, elt, attributes) {
        let value = context.get(attributes['test']);
        context.hide();

        if(value === false) {
            let children = context.node.childNodes;
            if(children.length > 0) {
                children.forEach(function(child, index) {
                    let child_context = new NTemplateContext({}, child, context.parent);
                    child_context.process();
                }, this);
            }
        }
    }
}

class NIfNotAttributeProcessor {

    static _name = 'if-not';

    process(context, elt, nano_attributes, html_attributes) {
        let value = context.get(nano_attributes[NIfNotAttributeProcessor._name]);

        if(value === false) {
            NTemplateContext.clear_nano_attributes(elt, nano_attributes);
        } else {
            context.hide();
        }
    }
}



window.addEventListener('DOMContentLoaded', (event) => {
    NTemplateProcessor.registerTag(NIfTagProcessor);
    NTemplateProcessor.registerTag(NIfNotTagProcessor);

    NTemplateProcessor.registerAttr(NIfAttributeProcessor);
    NTemplateProcessor.registerAttr(NIfNotAttributeProcessor);
});
class NLoopAttributeProcessor {

    static _name = 'loop';

    constructor() {
    }

    process(context, elt, nano_attributes, html_attributes) {

        let data = context.get(nano_attributes[NLoopAttributeProcessor._name], true);
        let variable = nano_attributes['as'];

        context.add = false;

        // remove all nano attributes
        NTemplateContext.clear_nano_attributes(elt, nano_attributes);

        for(let i = 0; i < data.length; i++) {
            let context_data = {_index_: i};
            let child_context = new NTemplateContext(context_data, elt, context.parent);
            child_context.set(variable, data[i]);
            child_context.process();
        }
    }
}

class NLoopTagProcessor {

    static _name = 'loop';

    constructor() {
    }

    process(context, elt, attributes) {

        let data = context.get(attributes['on'], true);

        let variable = attributes['as'];

        context.hide();

        // remove all nano attributes
        NTemplateContext.clear_nano_attributes(elt, attributes);

        for(let i = 0; i < data.length; i++) {
            let children = context.node.childNodes;
            let context_data = {_index_: i};
            if(children.length > 0) {
                children.forEach(function(child, index){
                    let child_context = new NTemplateContext(context_data, child, context.parent);
                    child_context.set(variable, data[i]);
                    child_context.process();
                }, this);
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    NTemplateProcessor.registerAttr(NLoopAttributeProcessor);
    NTemplateProcessor.registerTag(NLoopTagProcessor);
});
class NSwitchTagProcessor {

    static _name = 'switch';

    process(context, elt, attributes) {

        context.hide();

        let children = context.node.childNodes;

        let data = context.get(attributes['on']);

        if(children.length > 0) {
            children.forEach(function(child, index) {
                if(child.nodeType === Node.ELEMENT_NODE) {
                    if(child.prefix === NTemplate.prefix && child.localName === 'case'
                        ||  child.hasAttributeNS(NTemplate.namespace, 'case')) {
                        let child_context = new NTemplateContext({__switch_data: data}, child, context.parent);
                        child_context.process();
                    }
                }
            }, this);
        }
    }
}

class NSwitchCaseTagProcessor {

    static _name = 'case';

    process(context, elt, attributes) {
        let value = context.eval_string(attributes['value']);

        let __switch_data = context.get('__switch_data');
        context.hide();

        if(__switch_data === value) {
            let children = context.node.childNodes;
            if(children.length > 0) {
                children.forEach(function(child, index) {
                    let child_context = new NTemplateContext({}, child, context.parent);
                    child_context.process();
                }, this);
            }
        }
    }
}

class NSwitchCaseAttributeProcessor {

    static _name = 'case';

    process(context, elt, nano_attributes, html_attributes) {
        let value = context.eval_string(nano_attributes['case']);

        let __switch_data = context.get('__switch_data');

        if(__switch_data !== value) {
            context.hide();
        }
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    NTemplateProcessor.registerTag(NSwitchTagProcessor);
    NTemplateProcessor.registerTag(NSwitchCaseTagProcessor);
    NTemplateProcessor.registerAttr(NSwitchCaseAttributeProcessor);
});
class NTextAttributeProcessor {

    static _name = 'text';

    process(context, elt, nano_attributes, html_attributes) {
        let variable = nano_attributes[NTextAttributeProcessor._name];
        let content = context.get(variable);
        context.content = content !== undefined ? content : '';
    }
}

class NTextEscapeAttributeProcessor {

    static _name = 'text-escape';

    process(context, elt, nano_attributes, html_attributes) {
        let variable = nano_attributes[NTextEscapeAttributeProcessor._name];
        let content = context.get(variable);

        let escape = document.createElement('textarea');
        escape.textContent = content;
        context.content = escape.innerHTML !== undefined ? escape.innerHTML : '';
    }
}


window.addEventListener('DOMContentLoaded', (event) => {
    NTemplateProcessor.registerAttr(NTextAttributeProcessor);
    NTemplateProcessor.registerAttr(NTextEscapeAttributeProcessor);
});
class NJsonUtils {
    static explode(arr) {
        let object = {};

        for (let key in arr) {
            let value = arr[key];
            let components = key.split('.');
            let k = components[0];
            if(components.length > 1) {
                components.shift();
                object[k] = NJsonUtils.traverse(components, value, object[k]);
            } else {
                object[k] = value;
            }
        }
        return object;
    }

    static traverse(components, value, object) {
        if(object === undefined) {
            object = {};
        }
        let k = components[0];
        if(components.length > 1) {
            components.shift();
            object[k] = NJsonUtils.traverse(components, value, object[k]);
        } else {
            object[k] = value;
        }
        return object;
    }
}
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