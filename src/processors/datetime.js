/**
 * Datetime processor use: https://momentjs.com/
 */

class NDatetimeTagProcessor {
    static _name = 'datetime';
    constructor() {
    }

    process(context, elt, attributes) {
        context.hide();
        let date = context.get(attributes['with'], true);
        date = moment(date);
        let format;

        if(attributes.hasOwnProperty('format')) {
            format = attributes['format'];
        } else {
            format = 'DD/MM/YYYY'
        }

        // Create a new text content

        let text_node = document.createTextNode(date.format(format));

        let child_context = new NTemplateContext({}, text_node, context.parent);
        child_context.process();
    }
}

class NDatetimeDiffTagProcessor {
    static _name = 'datetime-diff';
    constructor() {
    }

    process(context, elt, attributes) {
        context.hide();
        let date = context.get(attributes['with'], true);

        date = moment(date);

        let diff = moment().diff(date);

        if(attributes.hasOwnProperty('auto-update')) {
            let child_node = document.createElement('span');
            child_node.classList.add('--nano-update-time-diff');
            child_node.dataset['time0'] = date.toDate().getTime();
            child_node.innerHTML = moment.duration(diff).humanize();

            let child_context = new NTemplateContext({}, child_node, context.parent);
            child_context.process();

        } else {
            // Create a new text content

            let text_node = document.createTextNode(moment.duration(diff).humanize());

            let child_context = new NTemplateContext({}, text_node, context.parent);
            child_context.process();
        }
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    NTemplateProcessor.registerTag(NDatetimeTagProcessor);
    NTemplateProcessor.registerTag(NDatetimeDiffTagProcessor);

    setInterval(function(){
        let time_displays = document.querySelectorAll('.--nano-update-time-diff');

        time_displays.forEach(function(elt){
            let time_0 = (new Date()).setTime(parseInt(elt.dataset.time0));
            let diff = moment().diff(moment(time_0));
            elt.innerHTML = moment.duration(diff).humanize();
        });
    }, 30000);
});