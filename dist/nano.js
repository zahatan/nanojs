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