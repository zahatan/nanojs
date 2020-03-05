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