import '@fluentui/web-components/button.js';
// Import with side-effectful Custom Element definitions
import '@fluentui/web-components/switch.js';
import { setTheme } from '@fluentui/web-components';
import { webLightTheme } from '@fluentui/tokens';

setTheme(webLightTheme);

document.querySelector('#save-button').addEventListener('click', () => {
    document.querySelector('#status').textContent = '按钮已点击';
});