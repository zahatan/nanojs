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