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