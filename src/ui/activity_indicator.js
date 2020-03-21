/**
 *
 */
class NActivityIndicator {

    constructor(selector) {
        this.elt = document.querySelector(selector);
    }

    onRequestStateChange(request, state, xhr) {
        switch (state) {
            case XMLHttpRequest.OPENED:
                if(this.elt) {
                    this.elt.style.display = 'inline-block';
                }
                break;
            case XMLHttpRequest.HEADERS_RECEIVED:
                break;
            case XMLHttpRequest.LOADING:
                break;
            case XMLHttpRequest.DONE:
                if(this.elt) {
                    this.elt.style.display = 'none';
                }
                break;
        }
    }
}