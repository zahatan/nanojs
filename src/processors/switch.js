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