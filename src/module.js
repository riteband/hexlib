import _ from "understreck";

/**
 * services are a list of service objects, including
 * - id
 * - url
 * **/
export function createState({
    services
}) {
    let state = {
        services: {}
    };
    services.forEach(function (service) {
        state.services[service.id] = {
            url: service.url,
            fetching: false,
            data: null,
            ok: null,
            statusCode: null
        }
    });

    return state;
}

export function getService(state, serviceId) {
    return state.services[serviceId];
}

export function shouldFetchService(state, serviceId) {
    let service = getService(state, serviceId);
    return !service.fetching && !service.data;
}

export function fetchServiceStarted(state, serviceId) {
    getService(state, serviceId).fetching = true;
    return state;
}

export function receiveService(state, serviceId, data, ok, statusCode) {
    let service = getService(state, serviceId);
    service.fetching = false;
    service.data = data;
    service.ok = ok;
    service.statusCode = statusCode;

    return state;
}

export function shouldShowServiceLoading(state, serviceId) {
    return shouldFetchService(state, serviceId) || getService(state, serviceId).fetching;
}

export function performSideEffects({state, swapState, system}) {
    _.keys(state.services).forEach(function (serviceId) {
        if (shouldFetchService(state, serviceId)) {
            let service = getService(state, serviceId);
            system.fetch(service.url).then(function (response) {
                response.json().then(function (data) {
                    swapState(receiveService, serviceId, data, response.ok, response.status);
                }).catch(function (e) {
                    swapState(receiveService, serviceId, null, false, -1);
                });
            }).catch(function (e) {
                swapState(receiveService, serviceId, null, false, 0);
            });
            swapState(fetchServiceStarted, serviceId);
        }
    });
}
