/**
 * Component displaying the welcome screen.
 * @module profile.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {NotificationsService} from 'angular2-notifications';
import {Auth} from '../auth.service';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/profile.html';

@Component({
    template: template
})
export class Profile implements OnInit {

    public pwd: string;
    public new_name: string;
    public new_name2: string;
    public current_pwd: string;
    public password: string;
    public password2: string;
    public ask_data: string;
    public revoke_id: string;
    public use_file: boolean;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param notif Notification service.
     * @param backend Backend service.
     * @param router Router service.
     * @param auth Auth service.
     */
    constructor(private notif: NotificationsService, private backend: Backend,
        private router: Router, private dataservice: Data, private auth: Auth) {
        this.use_file = false;
    }

    /**
     * Called upon displaying.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        if(/pass/.test(window.location.href)) {
            this.pwd = this.current_pwd = window.location.href.replace(/.+\//, '');
            window.$(`
                <div class="modal">
                    <h3>` + self.backend.transform('help') + `</h3>
                    <p>` + self.backend.transform('profile.doChange') + `</p>
                </div>
            `).appendTo('body').modal();
        } else {
            this.pwd = '';
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
                    self.dataservice.modifyData('keys/pwd/mine1', self.password.slice(0, 4), false, 0, self.backend.profile.data['keys/pwd/mine1'].shared_to, false, undefined).then(function() {
                        self.dataservice.modifyData('keys/pwd/mine2', self.password.slice(4), false, 0, self.backend.profile.data['keys/pwd/mine2'].shared_to, false, undefined).then(function() {
                            self.current_pwd = self.pwd;
                            self.password = '';
                            self.password2 = '';
                            self.auth.regPuzzle(undefined, window.sha256(self.password + self.backend.profile.salt), window.sha256(self.password));
                            self.notif.success(self.backend.transform('success'), self.backend.transform('profile.changed'));
                        }, function(e) {
                            self.notif.error(self.backend.transform('error'), self.backend.transform('profile.warnChange'));
                        });
                    }, function(e) {
                        self.notif.error(self.backend.transform('error'), self.backend.transform('profile.warnChange'));
                    });
                }, function(e) {
                    self.notif.error(self.backend.transform('error'), self.backend.transform('profile.noChange'));
                });
            } else {
                self.notif.error(self.backend.transform('error'), self.backend.transform('login.tooShort'));
                window.$('.inewpass').addClass('has-error');
            }
        } else {
            self.notif.error(self.backend.transform('error'), self.backend.transform('login.noMatch'));
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
        if(this.new_name != this.new_name2) {
            self.notif.error(self.backend.transform('error'), self.backend.transform('login.noUserMatch'));
            window.$('.inewname').addClass('has-error');
            return;
        }
        this.new_name = this.new_name.replace(/ /g, '');
        if(this.dataservice.isWhigi(this.new_name)) {
            self.notif.error(self.backend.transform('error'), self.backend.transform('login.usedWhigi'));
            window.$('.inewname').addClass('has-error');
            return;
        }
        if(/[^a-zA-Z0-9\-]/.test(this.new_name)) {
            self.notif.error(self.backend.transform('error'), self.backend.transform('login.badChars'));
            window.$('.inewname').addClass('has-error');
            return;
        }
        this.backend.changeUsername(this.new_name, this.current_pwd).then(function() {
            var now = self.backend.profile._id;
            self.backend.profile._id = self.new_name;
            self.backend.createToken(self.new_name, self.current_pwd, false).then(function(ticket) {
                self.auth.changedUname(now, self.new_name);
                self.auth.switchLogin(self.new_name, ticket._id);
                self.notif.success(self.backend.transform('success'), self.backend.transform('profile.chUname'));
            }, function(e) {
                self.auth.deleteUid(undefined, false);
                self.backend.forceReload();
                self.router.navigate(['/']);
            });
            self.current_pwd = self.pwd;
            self.new_name = '';
            self.new_name2 = '';
        }, function(e) {
            self.notif.error(self.backend.transform('error'), self.backend.transform('profile.noChange'));
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
        if(window.confirm(this.backend.transform('profile.confirm') + this.revoke_id)) {
            this.backend.getUser(this.revoke_id).then(function(user) {
                keys.forEach(function(val) {
                    if(user._id in self.backend.profile[val].shared_to) {
                        self.backend.revokeVault(self.backend.profile.data[val].shared_to[user._id]).then(function() {
                            delete self.backend.profile.data[val].shared_to[user._id];
                            delete self.backend.my_shares[self.revoke_id];
                        }, function(e) {
                            self.notif.error(self.backend.transform('error'), self.backend.transform('profile.noRevoke'));
                        });
                    }
                });
            }, function(e) {
                self.notif.error(self.backend.transform('error'), self.backend.transform('filesystem.noUser'));
            });
        }
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

    /**
     * Keys.
     * @function regables
     * @public
     * @return {String[]} Keys.
     */
    regables(): string[] {
        if(!this.backend.my_shares)
            return [];
        return Object.getOwnPropertyNames(this.backend.my_shares).filter(function(el) {
            return !/whigi/i.test(el);
        });
    }
    
}
