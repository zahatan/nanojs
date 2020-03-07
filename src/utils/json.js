class NJsonUtils {
    static explode(arr) {
        let object = {};

        for (let key in arr) {
            let value = arr[key];
            let components = key.split('.');
            let k = components[0];
            if(components.length > 1) {
                components.shift();
                object[k] = NJsonUtils.traverse(components, value, object[k]);
            } else {
                object[k] = value;
            }
        }
        return object;
    }

    static traverse(components, value, object) {
        if(object === undefined) {
            object = {};
        }
        let k = components[0];
        if(components.length > 1) {
            components.shift();
            object[k] = NJsonUtils.traverse(components, value, object[k]);
        } else {
            object[k] = value;
        }
        return object;
    }
}