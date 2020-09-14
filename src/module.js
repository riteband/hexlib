import _ from "understreck";

/**
 * services are a list of service objects, including
 * - url
 * **/
export function init({
    services
}) {
    let state = {
        services: {}
    };
    services.forEach(function (service) {
       state.services[service.url] = {
           data: null,
           fetching: null,
           statusCode: null,
           ok: null
       }
    });

    return state;
}

// TODO: Needs to be fixed
export function performSideEffects(state) {
    _.keys[state.services].forEach(function (url) {
       let service = state.services[url];
       if (!service.data && !service.fetching) {
           fetch(url)
               .then(function (response) {
                   service.statusCode = response.status;
                   return response.json();
               })
               .then(function (json) {
                   service.data = json;
                   service.ok = true;
           }).catch(function (e) {
               service.ok = false;
           }).finally(function () {
               service.fetching = false;
           });
           service.fetching = true;
       }
    });
}
