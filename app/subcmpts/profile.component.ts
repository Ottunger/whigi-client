/**
 * Component displaying the welcome screen.
 * @module profile.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/profile.html';

@Component({
    template: template
})
export class Profile implements OnInit {

    public new_name: string;
    public current_pwd: string;
    public password: string;
    public password2: string;
    public ask_data: string;
    public revoke_id: string;
    public use_file: boolean;
    private onEid: boolean;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     * @param backend Backend service.
     * @param router Router service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService, private backend: Backend,
        private router: Router, private dataservice: Data) {
        this.use_file = false;
        this.onEid = true;
    }

    /**
     * Called upon displaying.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        if(this.onEid && /eidok/.test(window.location.href)) {
            //Back from eID
            this.onEid = false;
            this.notif.success(this.translate.instant('success'), this.translate.instant('profile.eidRead'));
            this.backend.getProfile().then(function(profile) {
                self.backend.profile = profile;
                self.dataservice.newData('profile/address/eid', self.backend.profile.company_info.address, false, 0).then(function() {
                    self.dataservice.newData('profile/rrn', self.backend.profile.company_info.rrn, false, 0);
                });
            });
        }
        this.dataservice.listData(true).then(function() {
            if(!!sessionStorage.getItem('return_url') && sessionStorage.getItem('return_url').length > 1) {
                var ret = sessionStorage.getItem('return_url');
                ret = JSON.parse(ret);
                sessionStorage.removeItem('return_url');
                self.router.navigate(ret);
            }
        });
    }

    /**
     * Remove a granted OAuth token.
     * @function remove
     * @public
     * @param {String} id Token id.
     */
    remove(id: string) {
        var self = this;
        this.backend.removeOAuth(id).then(function() {
            for(var i = 0; i < self.backend.profile.oauth.length; i++) {
                if(self.backend.profile.oauth[i].id == id) {
                    delete self.backend.profile.oauth[i];
                    break;
                }
            }
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noRevoke'));
        });
    }

    /**
     * Updates the profile.
     * @function update
     * @public
     */
    update() {
        var self = this;
        window.$('.inewpass').removeClass('has-error');
        if(this.password == this.password2) {
            if(this.password.length >= 8) {
                this.backend.updateProfile(this.password, this.current_pwd).then(function() {
                    self.dataservice.modifyData('keys/pwd/mine1', self.password.slice(0, 4), false, 0, self.backend.profile.data['keys/pwd/mine1'].shared_to).then(function() {
                        self.dataservice.modifyData('keys/pwd/mine2', self.password.slice(4), false, 0, self.backend.profile.data['keys/pwd/mine2'].shared_to).then(function() {
                            self.current_pwd = '';
                            self.password = '';
                            self.password2 = '';
                            localStorage.setItem('key_decryption', window.sha256(self.password + self.backend.profile.salt));
                            localStorage.setItem('psha', window.sha256(self.password));
                            self.notif.success(self.translate.instant('success'), self.translate.instant('profile.changed'));
                        }, function(e) {
                            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.warnChange'));
                        });
                    }, function(e) {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('profile.warnChange'));
                    });
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noChange'));
                });
            } else {
                self.notif.error(self.translate.instant('error'), self.translate.instant('login.tooShort'));
                window.$('.inewpass').addClass('has-error');
            }
        } else {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noMatch'));
            window.$('.inewpass').addClass('has-error');
        }
    }

    /**
     * Change username.
     * @function changeUname
     * @public
     */
    changeUname() {
        var self = this;
        window.$('#inewname').removeClass('has-error');
        if(this.dataservice.isWhigi(this.new_name)) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.usedWhigi'));
            window.$('.inewname').addClass('has-error');
            return;
        }
        if(/[^a-zA-Z0-9\-]/.test(this.new_name)) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.badChars'));
            window.$('.inewname').addClass('has-error');
            return;
        }
        this.backend.changeUsername(this.new_name).then(function() {
            localStorage.removeItem('token');
            self.backend.forceReload();
            self.router.navigate(['/llight']);
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noChange'));
            window.$('#inewname').addClass('has-error');
        });
    }

    /**
     * Revoke all accesses.
     * @function revokeAll
     * @public
     */
    revokeAll() {
        var self = this, keys = Object.getOwnPropertyNames(this.backend.profile.data);
        this.backend.getUser(this.revoke_id).then(function(user) {
            keys.forEach(function(val) {
                if(user._id in self.backend.profile[val].shared_to) {
                    self.backend.revokeVault(self.backend.profile.data[val].shared_to[user._id]).then(function() {
                        delete self.backend.profile.data[val].shared_to[user._id];
                    }, function(e) {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noRevoke'));
                    });
                }
            });
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.noUser'));
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
            self.password2 = self.password;
        }
        r.readAsText(file);
    }
    
}
