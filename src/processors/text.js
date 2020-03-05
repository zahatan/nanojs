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