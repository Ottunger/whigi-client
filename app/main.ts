/**
 * Entry point for app drawing and logic.
 * @module main
 * @author Mathonet Grégoire
 */

'use strict';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {AppModule} from './app.module';

platformBrowserDynamic().bootstrapModule(AppModule);
/*
import {platformBrowser} from '@angular/platform-browser';
import {AppModuleNgFactory} from './app.module.ngfactory';

platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);
*/