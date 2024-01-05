let notiSwitch = document.getElementById('noti-switch');
let switch2 = document.getElementById('switch2');
let flags = {};

function setSwitchState(targetSwitch, newState) {
    targetSwitch.checked = newState;
}

chrome.runtime.sendMessage({ action: 'getFlags' }, (response) => {
    const result = response;
    flags = result;
    console.log(flags);
    setSwitchState(notiSwitch, result.showNotification)
});

document.addEventListener('DOMContentLoaded', function () {
    notiSwitch.addEventListener('change', function (e) {
        let value = this.checked
        flags.showNotification = value;
        console.log(flags);
        chrome.runtime.sendMessage({ action: 'setFlags', flags: flags });
    });

    switch2.addEventListener('change', function () {
        console.log('Option 2: ' + (switch2.checked ? 'On' : 'Off'));
    });
});