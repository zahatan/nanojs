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