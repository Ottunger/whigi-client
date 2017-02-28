/**
 * Entry point for app drawing and logic.
 * @module main
 * @author Mathonet Grégoire
 */

'use strict';
import {enableProdMode} from '@angular/core';
import {platformBrowser} from '@angular/platform-browser';
import {AppModuleNgFactory} from '../aot/app/app.module.ngfactory';

enableProdMode();
platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);