// 删除 button.js 和 switch.js 两行，换成这一行
import '@fluentui/web-components/web-components.js';

import { setTheme } from '@fluentui/web-components';
import { webLightTheme } from '@fluentui/tokens';

setTheme({
    ...webLightTheme,
    colorBrandBackground: '#6B8E23',
    colorBrandBackgroundHover: '#556B2F',
    colorBrandBackgroundPressed: '#9ACD32',
});