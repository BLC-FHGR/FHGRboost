
/**
 * tiny jquery plugin for getting url parameters
 */
define(["jquery"], function($) {
    // get params of the url to get dataset id
    $.urlParam = function (name) {
        var results = new RegExp("[\?&]" + name + "=([^&#]*)").exec(window.location.href);

        if (results === null) {
            return null;
        }
        return results[1] || 0;
    };
});
