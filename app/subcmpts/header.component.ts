/**
 * Component to display the header.
 * @module header.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
enableProdMode();
import * as template from './templates/header.html';

@Component({
    selector: 'header',
    template: template
})
export class Header {

    @Input() running: number;
    @Input() current: number;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param router Routing service.
     * @param backend App service.
     * @param translate I18N service.
     * @param notif Event service.
     */
    constructor(private router: Router, private backend: Backend, private translate: TranslateService, private notif: NotificationsService) {

    }

    /**
     * Log out.
     * @function logout
     * @public
     * @param {Boolean} all To log out all tokens.
     */
    logout(all: boolean) {
        var self = this;
        this.backend.removeTokens(all).then(function() {
            localStorage.removeItem('token');
            localStorage.removeItem('key_decryption');
            localStorage.removeItem('psha');
            self.backend.forceReload();
            delete self.backend.profile;
            self.router.navigate(['/']);
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noLogout'));
        });
    }

}
