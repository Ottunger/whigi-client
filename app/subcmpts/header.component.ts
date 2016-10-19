/**
 * Component to display the header.
 * @module header.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, EventEmitter, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/header.html';

@Component({
    selector: 'header',
    template: template
})
export class Header implements OnInit {

    private running: number;
    private current: number;
    @Input() run: EventEmitter<number> | number;
    @Input() cur: EventEmitter<number> | number;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param router Routing service.
     * @param backend App service.
     * @param translate Translation service.
     * @param notif Event service.
     * @param dataservice Data service
     */
    constructor(private router: Router, private backend: Backend, private translate: TranslateService, private notif: NotificationsService,
        private dataservice: Data) {
        this.run = 0;
        this.cur = 0;
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        if(typeof this.run === 'number') {
            this.running = this.run;
        } else if(typeof this.run !== 'undefined') {
            this.run.asObservable().subscribe(function(vals) {
                self.running = vals;
            });
        }
        if(typeof this.cur === 'number') {
            this.current = this.cur;
        } else if(typeof this.cur !== 'undefined') {
            this.cur.asObservable().subscribe(function(vals) {
                self.current = vals;
                window.$('#showpg').css('width', vals + '%');
            });
        }
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

    /**
     * Toggle main menu.
     * @function toggleMenu
     * @public
     */
    toggleMenu() {
        window.$('#mainDiv').toggleClass('page-sidebar-closed');
        window.$('#mainSidebar').toggleClass('page-sidebar-menu-closed');
    }

}
