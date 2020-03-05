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
