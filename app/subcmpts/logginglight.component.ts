/**
 * Component displaying a logging screen lightened.
 * @module logginglight.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/logginglight.html';

@Component({
    template: template
})
export class Logginglight implements OnInit {

    public username: string;
    public password: string;
    public use_pwd: boolean;
    public persistent: boolean;
    private onEnd: boolean;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param dataservice Data service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router, private notif: NotificationsService, private dataservice: Data) {
        this.onEnd = true;
        this.persistent = false;
        this.use_pwd = true;
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     * @param {Boolean} set Set the decryption key.
     */
    ngOnInit(set: boolean): void {
        var self = this;
        if(this.onEnd && /end/.test(window.location.href)) {
            //Session has expired
            this.onEnd = false;
            localStorage.removeItem('token');
            localStorage.removeItem('key_decryption');
            localStorage.removeItem('psha');
            window.setTimeout(function() {
                self.notif.alert(self.translate.instant('error'), self.translate.instant('sessionExpired'));
            }, 1500);
        }
        if('token' in localStorage) {
            this.backend.getProfile().then(function(profile) {
                //Router.go...
                self.backend.profile = profile;
                if(!!set) {
                    localStorage.setItem('key_decryption', window.sha256(self.password + profile.salt));
                    localStorage.setItem('psha', window.sha256(self.password));
                }
                if(!!sessionStorage.getItem('return_url') && sessionStorage.getItem('return_url').length > 1) {
                    var ret = sessionStorage.getItem('return_url');
                    ret = JSON.parse(ret);
                    sessionStorage.removeItem('return_url');
                    self.router.navigate(ret);
                } else {
                    sessionStorage.removeItem('return_url');
                    self.router.navigate(['/profile']);
                }
            }, function(e) {
                localStorage.removeItem('token');
            });
        }
    }

    /**
     * Tries to log in.
     * @function enter
     * @public
     */
    enter() {
        var self = this;
        this.backend.createToken(this.username, this.password, this.persistent).then(function(ticket) {
            localStorage.setItem('token', ticket._id);
            self.ngOnInit(true);
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noLogin'));
        });
    }

    /**
     * Loads a file as password.
     * @function fileLoad
     * @public
     * @param {Event} e The change event.
     */
    fileLoad(e: any) {
        var self = this;
        var file: File = e.target.files[0]; 
        var r: FileReader = new FileReader();
        r.onloadend = function(e) {
            if(/^data:;base64,/.test(r.result))
                self.password = atob(r.result.split(',')[1]);
            else
                self.password = r.result;
        }
        r.readAsText(file);
    }
    
}
