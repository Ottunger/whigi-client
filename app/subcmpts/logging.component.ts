/**
 * Component displaying a logging screen.
 * @module logging.component
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
import * as template from './templates/logging.html';

@Component({
    template: template
})
export class Logging implements OnInit {

    public username: string;
    public password: string;
    public password2: string;
    public email: string;
    public recup_id: string;
    public persistent: boolean;
    public recuperable: boolean;
    public safe: boolean;
    public use_pwd: boolean;

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
        this.persistent = false;
        this.recuperable = true;
        this.safe = false;
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
        if('token' in localStorage) {
            this.backend.getProfile().then(function(profile) {
                //Router.go...
                self.backend.profile = profile;
                if(!!set) {
                    localStorage.setItem('key_decryption', window.sha256(self.password + profile.salt));
                    localStorage.setItem('psha', window.sha256(self.password));
                }
                self.router.navigate(['/profile']);
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
     * Tries to sign up.
     * @function signUp
     * @public
     */
    signUp() {
        var self = this;

        function safe() {
            self.dataservice.newData('keys/pwd/mine1', self.password.slice(0, 4), false, 0).then(function() {
                self.dataservice.newData('keys/pwd/mine2', self.password.slice(4), false, 0).then(function() {
                    if(self.safe) {
                        self.dataservice.grantVault('whigi-restore', 'keys/pwd/mine1', 'keys/pwd/mine1', self.password.slice(0, 4), 0, new Date(0)).then(function() {
                            self.dataservice.grantVault('whigi-restore', 'profile/recup_id', 'profile/recup_id', self.recup_id, 0, new Date(0)).then(function() {
                                self.dataservice.grantVault(self.recup_id, 'keys/pwd/mine2', 'keys/pwd/mine2', self.password.slice(4), 0, new Date(0)).then(function() {
                                    self.notif.success(self.translate.instant('success'), self.translate.instant('login.sent'));
                                    self.logout();
                                }, function(e) {
                                    self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                                    self.logout();
                                });
                            }, function(e) {
                                self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                                self.logout();
                            });
                        }, function(e) {
                            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                            self.logout();
                        });
                    } else {
                        self.dataservice.grantVault('whigi-restore', 'keys/pwd/mine1', 'keys/pwd/mine1', self.password.slice(0, 4), 0, new Date(0)).then(function() {
                            self.dataservice.grantVault('whigi-restore', 'keys/pwd/mine2', 'keys/pwd/mine2', self.password.slice(4), 0, new Date(0)).then(function() {
                                self.notif.success(self.translate.instant('success'), self.translate.instant('login.sent'));
                                self.logout();
                            }, function(e) {
                                self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                                self.logout();
                            });
                        }, function(e) {
                            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                            self.logout();
                        });
                    }
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                    self.logout();
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                self.logout();
            });
        }
        function complete() {
            self.backend.createUser(self.username, self.password).then(function() {
                self.backend.createToken(self.username, self.password, false).then(function(token) {
                    localStorage.setItem('token', token._id);
                    self.backend.getProfile().then(function(user) {
                        self.backend.profile = user;
                        localStorage.setItem('key_decryption', window.sha256(self.password + user.salt));
                        localStorage.setItem('psha', window.sha256(self.password));
                        self.dataservice.listData().then(function() {
                            self.dataservice.newData('profile/email/restore', self.email, false, 0, true).then(function(email) {
                                self.dataservice.newData('profile/recup_id', self.recup_id, false, 0, true).then(function(email) {
                                    if(self.recuperable) {
                                        self.dataservice.grantVault('whigi-restore', 'profile/email/restore', 'profile/email/restore', self.email, 0, new Date(0)).then(function() {
                                            safe();
                                        }, function() {
                                            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                                            self.logout();
                                        });
                                    } else {
                                        self.notif.success(self.translate.instant('success'), self.translate.instant('login.sent'));
                                        self.logout();
                                    }
                                }, function(e) {
                                    self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                                    self.logout();
                                });
                            }, function() {
                                self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                                self.logout();
                            });
                        });
                    }, function(e) {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                        self.logout();
                    });
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
            });
        }

        if(this.password.length < 8 || /whigi/i.test(this.username)) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noMatch'));
            return;
        }
        if(this.password == this.password2) {
            if(!/^([\w-]+(?:\.[\w-]+)*)@(.)+\.(.+)$/i.test(this.email)) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('login.noMatch'));
                return;
            }
            if(this.safe && this.recuperable) {
                this.backend.peekUser(this.recup_id).then(function() {
                    complete();
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.noUser'));
                });
            } else {
                complete();
            }
        } else {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noMatch'));
        }
    }

    /**
     * Tries to have a reset link.
     * @function forgot
     * @public
     */
    forgot() {
        var self = this;
        this.backend.requestRestore(this.username).then(function() {
            self.notif.success(self.translate.instant('success'), self.translate.instant('login.sent'));
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noReset'));
        });
    }

    /**
     * Logouts.
     * @function logout
     * @private
     */
    logout() {
        var self = this;
        this.backend.removeTokens(false).then(function() {
            localStorage.removeItem('token');
            localStorage.removeItem('key_decryption');
            localStorage.removeItem('psha');
            self.backend.forceReload();
            delete self.backend.profile;
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noLogout'));
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
