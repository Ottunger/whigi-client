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
    public use_file: boolean;
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
        this.persistent = false;
        this.recuperable = false;
        this.safe = false;
        this.use_file = false;
        this.onEnd = true;
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     * @param {Boolean} set Set the decryption key.
     */
    ngOnInit(set: boolean): void {
        var self = this;
        window.$('#ggccpt').ready(function() {
            var test = setInterval(function() {
                if(!!window.grecaptcha) {
                    clearInterval(test);
                    if(!window.$('#ggccpt').html() || window.$('#ggccpt').html().length == 0) {
                        try {
                            window.grecaptcha.render('ggccpt', {
                                'sitekey' : '6LfleigTAAAAALOtJgNBGWu4A0ZiHRvetRorXkDx'
                            });
                        } catch(e) {
                            console.log(e);
                        }
                    }
                }
            }, 30);
        });
        if(this.onEnd && /end/.test(window.location.href)) {
            //Session has expired
            this.onEnd = false;
            localStorage.removeItem('token');
            localStorage.removeItem('key_decryption');
            localStorage.removeItem('psha');
            window.setTimeout(function() {
                self.notif.remove();
                self.notif.alert(self.translate.instant('error'), self.translate.instant(/endPwd/.test(window.location.href)? 'reset.noLink' : 'sessionExpired'));
            }, 500);
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
                    self.router.navigate(['/generics/generics.profile']);
                }
            }, function(e) {
                localStorage.removeItem('token');
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
        window.$('#forget-password').click(function() {
            window.$('.login-form').hide();
            window.$('.forget-form').show();
        });
        window.$('#back-btn').click(function() {
            window.$('.login-form').show();
            window.$('.forget-form').hide();
        });
        window.$('#register-btn').click(function() {
            window.$('.login-form').hide();
            window.$('.register-form').show();
        });
        window.$('#register-back-btn').click(function() {
            window.$('.login-form').show();
            window.$('.register-form').hide();
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
        this.backend.createToken(this.username, this.password, this.persistent).then(function(ticket) {
            localStorage.setItem('token', ticket._id);
            self.ngOnInit(true);
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noLogin'));
            window.$('.ilogging').addClass('has-error');
        });
    }

    /**
     * Tries to sign up.
     * @function signUp
     * @public
     */
    signUp() {
        var self = this;

        function safe(recup: number[]) {
            self.dataservice.newData(false, 'keys/pwd/mine1', self.password.slice(0, 4), false, 0).then(function() {
                self.dataservice.newData(false, 'keys/pwd/mine2', self.password.slice(4), false, 0).then(function() {
                    if(self.safe) {
                        self.dataservice.grantVault('whigi-restore', 'keys/pwd/mine1', 'keys/pwd/mine1', self.password.slice(0, 4), 0, new Date(0), '', false, undefined).then(function() {
                            self.dataservice.grantVault('whigi-restore', 'profile/recup_id', 'profile/recup_id', self.recup_id, 0, new Date(0), '', false, recup).then(function() {
                                self.dataservice.grantVault(self.recup_id, 'keys/pwd/mine2', 'keys/pwd/mine2', self.password.slice(4), 0, new Date(0), '', false, undefined).then(function() {
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
            self.backend.createUser(self.username, self.password).then(function() {
                self.backend.createToken(self.username, self.password, false).then(function(token) {
                    localStorage.setItem('token', token._id);
                    self.backend.getProfile().then(function(user) {
                        self.backend.profile = user;
                        localStorage.setItem('key_decryption', window.sha256(self.password + user.salt));
                        localStorage.setItem('psha', window.sha256(self.password));
                        self.dataservice.listData(false).then(function() {
                            self.dataservice.newData(true, 'profile/email/restore', self.email, false, 0, true).then(function(email: number[]) {
                                self.dataservice.newData(true, 'profile/recup_id', self.recup_id, false, 0, true).then(function(recup: number[]) {
                                    self.dataservice.newData(true, 'profile/first_name', self.fname, false, 0, true).then(function(fname: number[]) {
                                        self.dataservice.newData(true, 'profile/last_name', self.lname, false, 0, true).then(function(lname: number[]) {
                                            self.dataservice.grantVault('whigi-wissl', 'profile/email/restore', 'profile/email/restore', self.email, 0, new Date(0), '', false, email).then(function() {
                                                self.dataservice.grantVault('whigi-wissl', 'profile/first_name', 'profile/first_name', self.fname, 0, new Date(0), '', false, fname).then(function() {
                                                    self.dataservice.grantVault('whigi-wissl', 'profile/last_name', 'profile/last_name', self.lname, 0, new Date(0), '', false, lname).then(function() {
                                                        if(self.recuperable) {
                                                            self.dataservice.grantVault('whigi-restore', 'profile/email/restore', 'profile/email/restore', self.email, 0, new Date(0), '', false, email).then(function() {
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
        if(!this.fname || this.fname == '') {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.names'));
            window.$('.ifname').addClass('has-error');
            return;
        }
        if(!this.lname || this.lname == '') {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.names'));
            window.$('.ilname').addClass('has-error');
            return;
        }
        if(this.dataservice.isWhigi(this.username)) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.usedWhigi'));
            window.$('.iuname').addClass('has-error');
            return;
        }
        if(/[^a-zA-Z0-9\-]/.test(this.username)) {
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
                this.backend.peekUser(this.recup_id).then(function() {
                    complete();
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('login.noUser'));
                     window.$('.irecupid').addClass('has-error');
                });
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
                localStorage.removeItem('token');
                localStorage.removeItem('key_decryption');
                localStorage.removeItem('psha');
                self.backend.forceReload();
                resolve();
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('profile.noLogout'));
                resolve();
            });
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
