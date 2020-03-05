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