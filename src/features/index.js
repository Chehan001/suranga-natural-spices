import { dashboard } from './dashboard/index.js';
import { purchases } from './purchases/index.js';
import { inventory } from './inventory/index.js';
import { sales } from './sales/index.js';
import { processing, processingActions } from './processing/index.js';
import { moneyRoute, moneyActions } from './money/index.js';
import { people, peopleActions } from './people/index.js';
import { reports } from './reports/index.js';
import { settings, settingsActions } from './settings/index.js';
import { tradeActions } from './trade/trade.js';

/** Navigation order (matches the UI reference). */
export const routes = [dashboard, purchases, inventory, sales, processing, moneyRoute, people, reports, settings];

export const featureActions = { ...tradeActions, ...processingActions, ...moneyActions, ...peopleActions, ...settingsActions };
