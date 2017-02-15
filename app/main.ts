/**
 * Entry point for app drawing and logic.
 * @module main
 * @author Mathonet Grégoire
 */

'use strict';
import {platformBrowser} from '@angular/platform-browser';
import {AppModuleNgFactory} from '../aot/app/app.module.ngfactory';

platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);