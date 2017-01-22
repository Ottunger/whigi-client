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
import {Auth} from '../auth.service';
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
     * @param dataservice Data service.
     * @param auth Auth service.
     */
    constructor(private router: Router, private backend: Backend, private translate: TranslateService, private notif: NotificationsService,
        private dataservice: Data, private auth: Auth) {
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
        function complete() {
            self.auth.deleteUid(undefined, true);
            self.backend.forceReload();
            delete self.backend.profile;
            self.dataservice.navigate(self.router, ['/']);
        }
        this.backend.removeTokens(all).then(function() {
            complete();
        }, function(e) {
            if(e.status == 403) {
                //We were OAuthing...
                complete();
            } else {
                self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noLogout'));
            }
        });
    }

    /**
     * Allows switching accounts.
     * @function switch
     * @public
     */
    switch() {
        this.auth.emptyUid();
        this.backend.forceReload();
        delete this.backend.profile;
        this.dataservice.navigate(this.router, ['/']);
    }

    /**
     * Toggle main menu.
     * @function toggleMenu
     * @public
     */
    toggleMenu() {
        window.$('#mainDiv').toggleClass('page-sidebar-closed');
        window.$('#mainSidebar').toggleClass('page-sidebar-menu-closed');
        window.$('#divSidebar').toggleClass('in');
    }

    /**
     * Show help.
     * @function showIntro
     * @public
     */
    showIntro() {
        window.introJs.introJs().setOptions({
            nextLabel: this.translate.instant('next'),
            prevLabel: this.translate.instant('prev'),
            skipLabel: this.translate.instant('skip'),
            doneLabel: this.translate.instant('done'),
            hintButtonLabel: this.translate.instant('hint'),
            exitOnOverlayClick: false,
            disableInteraction: true
        }).start();
    }

}
