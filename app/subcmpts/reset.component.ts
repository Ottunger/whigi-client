/**
 * Component displaying a reset screen.
 * @module reset.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/reset.html';

@Component({
    template: template
})
export class Reset implements OnInit, OnDestroy {

    public password: string;
    public password2: string;
    public use_file: boolean;
    private id: string;
    private pwd: string;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private router: Router,
        private notif: NotificationsService, private routed: ActivatedRoute, private dataservice: Data) {
        this.use_file = false;
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            var encPwd = window.atob(window.decodeURIComponent(params['pwd']));
            self.id = params['id'].toLowerCase();
            self.backend.getRestore(params['key']).then(function(res) {
                self.backend.decryptAES(self.backend.str2arr(encPwd), self.dataservice.workerMgt(false, function(got) {
                    self.pwd = got;
                }, false), self.backend.str2arr(res.aes));
            }, function(e) {
                self.router.navigate(['/endPwd']);
            });
        });
    }

    /**
     * Called upon destroy.
     * @function ngOnInit
     * @public
     */
    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    /**
     * Toggles whether to see password.
     * @function toggleShow
     * @public
     */
    toggleShow() {
        window.$('#cpwd').attr('type', (window.$('#cpwd').attr('type') == 'password')? 'text' : 'password');
    }

    /**
     * Tries to reset password.
     * @function enter
     * @public
     */
    enter() {
        var self = this;
        window.$('.form-group').removeClass('has-error');
        if(this.password.length < 8) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.tooShort'));
            window.$('.form-group').addClass('has-error');
            return;
        }
        if(this.password == this.password2) {
            this.backend.createToken(this.id, this.pwd, false).then(function(token) {
                localStorage.setItem('token', token._id);
                self.dataservice.mPublic().then(function(user) {
                    //Router.go...
                    self.backend.profile = user;
                    self.dataservice.wentLogin = true;
                    self.dataservice.extendModules();
                    localStorage.setItem('key_decryption', window.sha256(self.pwd + user.salt));
                    localStorage.setItem('psha', window.sha256(self.password));
                    self.dataservice.listData(false).then(function() {
                        self.backend.updateProfile(self.password, self.pwd).then(function() {
                            self.dataservice.modifyData('keys/pwd/mine1', self.password.slice(0, 4), false, 0, self.backend.profile.data['keys/pwd/mine1'].shared_to, false, undefined).then(function() {
                                self.dataservice.modifyData('keys/pwd/mine2', self.password.slice(4), false, 0, self.backend.profile.data['keys/pwd/mine2'].shared_to, false, undefined).then(function() {
                                    self.router.navigate(['/generics', 'generics.profile']);
                                }, function(e) {
                                    self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
                                });
                            }, function(e) {
                                self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
                            });
                        }, function(e) {
                            self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
                        });
                    });
                }, function(e) {
                    self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
                });
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('reset.noReset'));
            });
        } else {
            self.notif.error(self.translate.instant('error'), self.translate.instant('login.noMatch'));
            window.$('.form-group').addClass('has-error');
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
    
}
