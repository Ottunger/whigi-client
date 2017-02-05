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
import {Auth} from '../auth.service';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/logging.html';

@Component({
    template: template
})
export class Logging implements OnInit {

    public fname: string;
    public lname: string;
    public username: string;
    public password: string;
    public password2: string;
    public email: string;
    public recup_id: string;
    public persistent: boolean;
    public recuperable: boolean;
    public safe: boolean;
    public is_company: boolean;
    public pubkey: string;
    public cert: string;
    public mk: string;
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
     * @param auth Auth service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router, private notif: NotificationsService,
        private dataservice: Data, private auth: Auth) {
        this.persistent = false;
        this.recuperable = false;
        this.safe = false;
        this.onEnd = true;
        this.is_company = false;
        this.password = '';
        window.whigiLogin = this.ngOnInit.bind(this, false);
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     * @param {Boolean} set Set the decryption key.
     */
    ngOnInit(set: boolean): void {
        var self = this;
        window.$('#wlogin-pass,#wlogin-login').ready(function() {
            window.$('#wlogin-pass,#wlogin-login').keyup(function(e) {
                if(e.keyCode == 13)
                    window.$('#wlogin-btn').click();
            });
        });
        if(this.onEnd && /end/.test(window.location.href)) {
            //Session has expired, now moves will be done normally
            this.onEnd = false;
            this.backend.forceMove = false;
            this.auth.deleteUid(undefined, true);
            if(this.dataservice.wentLogin) {
                window.setTimeout(function() {
                    self.notif.remove();
                    self.notif.alert(self.translate.instant('error'), self.translate.instant(/endPwd/.test(window.location.href)? 'reset.noLink' : 'sessionExpired'));
                }, 500);
            }
        }
        if(this.auth.isLogged()) {
            this.dataservice.mPublic().then(function(profile) {
                //Router.go...
                self.backend.profile = profile;
                self.dataservice.wentLogin = true;
                self.dataservice.extendModules();
                if(self.backend.profile._id.indexOf('wiuser-') == 0 && (!sessionStorage.getItem('return_url') || !/account/.test(sessionStorage.getItem('return_url')))) {
                    window.$(`
                        <div class="modal">
                            <h3>` + self.translate.instant('help') + `</h3>
                            <p>` + self.translate.instant('login.wiuser') + `</p>
                        </div>
                    `).appendTo('body').modal();
                }
                if(!!set) {
                    self.auth.regPuzzle(undefined, window.sha256(self.password + profile.salt), window.sha256(self.password));
                }
                if(!!sessionStorage.getItem('return_url') && sessionStorage.getItem('return_url').length > 1) {
                    var ret = sessionStorage.getItem('return_url');
                    ret = JSON.parse(ret);
                    sessionStorage.removeItem('return_url');
                    self.router.navigate(ret);
                } else {
                    sessionStorage.removeItem('return_url');
                    self.router.navigate(['/generics', 'generics.profile']);
                }
            }, function(e) {
                self.auth.deleteUid(undefined, false);
                //Fallback to a request
                window.$('#ctn-log').ready(function() {
                    window.$('#ctn-log').css('display', 'block');
                });
            });
        } else {
            //Fallback to a request
            window.$('#ctn-log').ready(function() {
                window.$('#ctn-log').css('display', 'block');
            });
        }
        //Ticking towards a request
        setTimeout(function() {
            window.$('#ctn-log').css('display', 'block');
        }, 1000);
        window.$('#forget-password').click(function() {
            window.$('.login-form').hide();
            window.$('.forget-form').show();
        });
        window.$('#back-btn').click(function() {
            window.$('.forget-form').hide();
            window.$('.login-form').show();
        });
        window.$('#register-btn').click(function() {
            window.$('.login-form').hide();
            window.$('#reg1').show();
        });
        window.$('#register-btn-safe').click(function() {
            window.$('.login-form').hide();
            window.$('#reg2').show();
        });
        window.$('.register-back-btn').click(function() {
            window.$('.register-form').hide();
            window.$('.login-form').show();
        });
        if(!this.recuperable) {
            window.$('#recupcheck').ready(function() {
                window.$('#recupcheck').click();
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
        window.$('.ilogging').removeClass('has-error');
        self.username = self.username.replace(/ /g, '');
        self.backend.createToken(self.username, self.password, self.persistent).then(function(ticket) {
            self.auth.switchLogin(self.username, ticket._id);
            self.ngOnInit(true);
        }, function(e) {
            if(e.status == 412) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('login.412'));
            } else {
                self.notif.error(self.translate.instant('error'), self.translate.instant('login.noLogin'));
                window.$('.ilogging').addClass('has-error');
            }
        });
    }

    /**
     * Use a known mapping.
     * @function loginas
     * @public
     * @param {String} uid User.
     */
    loginas(uid: string) {
        this.auth.switchLogin(uid);
        this.ngOnInit(false);
    }

    /**
     * Tries to sign up.
     * @function dummyUp
     * @public
     */
    dummyUp() {
        var self = this;
        //Handlers
        function complete() {
            self.backend.ackUser(self.username, self.pubkey, self.is_company).then(function(nuser) {
                self.notif.success(self.translate.instant('success'), self.translate.instant('login.sent'));
                self.cert = nuser.cert;
                self.mk = '[';
                var nb = self.backend.newAES();
                for(var i = 0; i < nb.length - 1; i++)
                    self.mk += nb[i] + ', ';
                self.mk += nb[nb.length - 1] + ']';
                self.username = '';
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
            });
        }

        window.$('.iuname,.ipubkey').removeClass('has-error');
        self.cert = '';
        self.mk = '';
        if(this.dataservice.isWhigi(this.username)) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.usedWhigi'));
            window.$('.iuname').addClass('has-error');
            return;
        }
        if(/[^a-zA-Z0-9\-\_]/.test(this.username)) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.badChars'));
            window.$('.iuname').addClass('has-error');
            return;
        }
        var enc = new window.JSEncrypt.JSEncrypt();
        enc.setPublicKey(this.pubkey);
        if(!enc.encrypt('heythere')) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.badKey'));
            window.$('.ipubkey').addClass('has-error');
        } else {
            complete();
        }
    }

    /**
     * Tries to sign up.
     * @function signUp
     * @public
     */
    signUp() {
        var self = this, asEmail = false, towards: string;
        var bl: number = (!!this.password)? Math.floor(this.password.length / 2) : 0;
        var naming = JSON.stringify({'generics.last_name': this.lname, 'generics.first_name': this.fname});
        //Handlers
        function end(recup: number[], towards: string) {
            self.dataservice.grantVault('whigi-restore', 'profile/recup_id', 'profile/recup_id', towards, 0, new Date(0), '', false, recup).then(function() {
                self.dataservice.grantVault(towards, 'keys/pwd/mine2', 'keys/pwd/mine2', self.password.slice(4), 0, new Date(0), '', false, undefined).then(function() {
                    self.notif.success(self.translate.instant('success'), self.translate.instant('login.sent'));
                    self.logout().then(function() {self.enter();});
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                    self.logout();
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                self.logout();
            });
        }
        function safe(recup: number[]) {
            self.dataservice.newData(false, 'keys/pwd/mine1', self.password.slice(0, 4), false, 0).then(function() {
                self.dataservice.newData(false, 'keys/pwd/mine2', self.password.slice(4), false, 0).then(function() {
                    if(self.safe) {
                        self.dataservice.grantVault('whigi-restore', 'keys/pwd/mine1', 'keys/pwd/mine1', self.password.slice(0, 4), 0, new Date(0), '', false, undefined).then(function() {
                            if(asEmail == false) {
                                end(recup, self.recup_id);
                            } else {
                                self.backend.createUser(towards, self.backend.generateRandomString(12), [{
                                    data: self.recup_id,
                                    real_name: 'profile/email/restore',
                                    is_dated: false,
                                    shared_as: 'profile/email',
                                    shared_trigger: '',
                                    shared_epoch: 0,
                                    shared_to: ['whigi-restore'],
                                    version: 0
                                }], self.recup_id).then(function() {
                                    end(recup, towards);
                                }, function(e) {
                                    self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                                    self.logout();
                                });
                            }
                        }, function(e) {
                            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                            self.logout();
                        });
                    } else {
                        self.dataservice.grantVault('whigi-restore', 'keys/pwd/mine1', 'keys/pwd/mine1', self.password.slice(0, 4), 0, new Date(0), '', false, undefined).then(function() {
                            self.dataservice.grantVault('whigi-restore', 'keys/pwd/mine2', 'keys/pwd/mine2', self.password.slice(4), 0, new Date(0), '', false, undefined).then(function() {
                                self.notif.success(self.translate.instant('success'), self.translate.instant('login.sent'));
                                self.logout().then(function() {self.enter();});
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
            self.backend.createUser(self.username, self.password, [{
                real_name: 'profile/lang',
                is_dated: false,
                data: self.translate.currentLang,
                version: 0,
                shared_to: []
            }], undefined, self.is_company).then(function() {
                self.backend.createToken(self.username, self.password, false).then(function(token) {
                    self.auth.switchLogin(self.username, token._id);
                    self.dataservice.mPublic().then(function(user) {
                        self.backend.profile = user;
                        self.auth.regPuzzle(undefined, window.sha256(self.password + user.salt), window.sha256(self.password));
                        self.dataservice.listData(false).then(function() {
                            towards = 'wiuser-' + self.backend.generateRandomString(10);
                            self.dataservice.newData(true, 'profile/email/restore', self.email, false, 0, true).then(function(email: number[]) {
                                self.dataservice.newData(true, 'profile/recup_id', asEmail? towards : self.recup_id, false, 0, true).then(function(recup: number[]) {
                                    self.dataservice.newData(true, 'profile/name', naming, false, 0, true).then(function(fname: number[]) {
                                        self.dataservice.grantVault('whigi-wissl', 'profile/email', 'profile/email/restore', self.email, 0, new Date(0), '', false, email).then(function() {
                                            self.dataservice.grantVault('whigi-wissl', 'profile/name', 'profile/name', naming, 0, new Date(0), '', false, fname).then(function() {
                                                if(self.recuperable) {
                                                    self.dataservice.grantVault('whigi-restore', 'profile/email', 'profile/email/restore', self.email, 0, new Date(0), '', false, email).then(function() {
                                                        safe(recup);
                                                    }, function() {
                                                        self.notif.error(self.translate.instant('error'), self.translate.instant('login.noSignup'));
                                                        self.logout();
                                                    });
                                                } else {
                                                    self.notif.success(self.translate.instant('success'), self.translate.instant('login.sent'));
                                                    self.logout().then(function() {self.enter();});
                                                }
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

        window.$('.iuname,.ipass,.imail,.irecupid,.ifname,.ilname').removeClass('has-error');
        if(!this.is_company && (!this.fname || this.fname == '')) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.names'));
            window.$('.ifname').addClass('has-error');
            return;
        }
        if(!this.is_company && (!this.lname || this.lname == '')) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.names'));
            window.$('.ilname').addClass('has-error');
            return;
        }
        if(this.dataservice.isWhigi(this.username)) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.usedWhigi'));
            window.$('.iuname').addClass('has-error');
            return;
        }
        if(/[^a-zA-Z0-9\-\_]/.test(this.username)) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.badChars'));
            window.$('.iuname').addClass('has-error');
            return;
        }
        if(this.password.length < 8) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.tooShort'));
            window.$('.ipass').addClass('has-error');
            return;
        }
        if(this.password == this.password2) {
            if(!/^([\w-]+(?:\.[\w-]+)*)@(.)+\.(.+)$/i.test(this.email)) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('login.badEmail'));
                window.$('.imail').addClass('has-error');
                return;
            }
            if(this.safe && this.recuperable) {
                if(/^([\w-]+(?:\.[\w-]+)*)@(.)+\.(.+)$/i.test(this.recup_id)) {
                    asEmail = true;
                    complete();
                } else {
                    this.backend.peekUser(this.recup_id).then(function() {
                        complete();
                    }, function(e) {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('login.noUser'));
                        window.$('.irecupid').addClass('has-error');
                    });
                }
            } else {
                complete();
            }
        } else {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noMatch'));
            window.$('.ipass').addClass('has-error');
        }
    }

    /**
     * Tries to have a reset link.
     * @function forgot
     * @public
     */
    forgot() {
        var self = this;
        window.$('.iforget').removeClass('has-error');
        this.backend.requestRestore(this.username).then(function() {
            self.notif.success(self.translate.instant('success'), self.translate.instant('login.resetSent'));
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noReset'));
            window.$('.iforget').addClass('has-error');
        });
    }

    /**
     * Logouts.
     * @function logout
     * @private
     * @return {Promise} When done.
     */
    logout(): Promise {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.backend.removeTokens(false).then(function() {
                self.auth.deleteUid(undefined, true);
                self.backend.forceReload();
                resolve();
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noLogout'));
                resolve();
            });
        });
    }
    
}
