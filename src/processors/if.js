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