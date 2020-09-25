import _ from "understreck";

/**
 * services is a list of service objects, including
 * - id
 * - url
 * - shouldFetch function (optional)
 *
 * form is a list of input objects, including
 * - id
 * - isValid function (optional)
 * **/
export function createState({
    services = [],
    form = []
}) {
    let state = {
        services: {},
        form: {
            liveFormFeedback: false,
            submittedSinceLastEdit: false,
            submitted: false,
            inputs: {}
        }
    };
    services.forEach(function (service) {
        state.services[service.id] = _.merge(service, {
            fetching: false,
            data: null,
            ok: null,
            statusCode: null
        })
    });
    form.forEach(function (input) {
        state.form.inputs[input.id] = _.merge(input, {
            value: ""
        });
    })

    return state;
}

export function getService(state, serviceId) {
    return state.services[serviceId];
}

export function shouldFetchService(state, serviceId) {
    let service = getService(state, serviceId);
    return !service.fetching && !service.data && (service.shouldFetch ? service.shouldFetch() : true);
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

export function shouldShowModuleLoading(state) {
    return _.keys(state.services).reduce(function (isLoading, serviceId) {
        return isLoading || shouldShowServiceLoading(state, serviceId);
    }, false);
}

export function getServiceData(state, serviceId) {
    return getService(state, serviceId).data;
}

export function getServiceError(state, serviceId) {
    return getService(state, serviceId).error;
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

export function getInput(state, inputId) {
    return state.form.inputs[inputId];
}

export function getInputValue(state, inputId) {
    return getInput(state, inputId).value;
}

export function onInputValueChange(state, inputId, value) {
    state.form.submittedSinceLastEdit = false;
    getInput(state, inputId).value = value;
    return state;
}

export function isInputValid(state, inputId) {
    let isValid = getInput(state, inputId).isValid;
    return isValid ? isValid(getInputValue(state, inputId)) : true;
}

export function getInputInvalidText(state, inputId) {
    if (isInputValid(state, inputId) || !state.form.liveFormFeedback) {
        return;
    }
    return "invalid";
}

export function isFormValid(state) {
    return _.keys(state.form.inputs).reduce(function (isValid, inputId) {
        return isValid && isInputValid(state, inputId);
    }, true);
}

export function getFormInvalidText(state) {
    if (isFormValid(state) || !state.form.submittedSinceLastEdit) {
        return;
    }
    return "something wrong"
}

export function onSubmitForm(state) {
    state.form.submittedSinceLastEdit = true;

    if (isFormValid(state)) {
        state.form.liveFormFeedback = false;
        state.form.submitted = true;
    } else {
        state.form.liveFormFeedback = true;
    }

    return state;
}

export function isFormSubmitted(state) {
    // TODO: Naming not very good, submitted in this instance means a valid submit
    return state.form.submitted;
}
