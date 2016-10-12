/**
 * Component to display the public info of a user.
 * @module userinfo.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, ApplicationRef, OnInit} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/userinfo.html';

@Component({
    selector: 'user-info',
    template: template
})
export class Userinfo implements OnInit {

    @Input() user: any;
    public bce: string;
    private pict: string;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param notif Notification service.
     * @param backend App service.
     * @param dataservice Data service.
     * @param check Check service.
     */
    constructor(private translate: TranslateService, private notif: NotificationsService, private backend: Backend,
        private dataservice: Data, private check: ApplicationRef) {

    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        window.$('#eidform').ready(function() {
            window.$('#eidform').attr('method', 'get');
        });
        var test = setInterval(function() {
            if(Object.getOwnPropertyNames(self.user).length == 0)
                return;
            clearInterval(test);
            self.dataservice.picts(self.user, 'pict-user');
        }, 30);
    }

    /**
     * Modify public data
     * @function modify
     * @public
     */
    modify() {
        var self = this;
        this.backend.goCompany(self.backend.profile.company_info).then(function() {
            self.backend.profile.is_company = 1;
            self.notif.success(self.translate.instant('success'), self.translate.instant('userinfo.changed'));
            self.check.tick();
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('userinfo.notChanged'));
            self.check.tick();
        });
    }

    /**
     * Modify public data
     * @function modifyPict
     * @public
     */
    modifyPict() {
        var self = this;
        this.backend.goCompany({picture: this.pict}).then(function() {
            self.backend.profile.company_info.picture = self.pict;
            window.$('#mypict').attr('src', self.pict);
            self.check.tick();
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('userinfo.notChanged'));
            self.check.tick();
        });
    }

    /**
     * Load public data
     * @function load
     * @public
     */
    load() {
        var self = this;
        if(!!this.backend.profile.data['profile/last_name'] && !!this.backend.profile.data['profile/first_name']) {
            this.backend.getData(this.backend.profile.data['profile/last_name'].id).then(function(data) {
                var encr_data = self.backend.str2arr(data.encr_data);
                self.backend.decryptAES(encr_data, self.dataservice.workerMgt(false, function(lname) {
                    self.backend.getData(self.backend.profile.data['profile/last_name'].id).then(function(data) {
                        var encr_data = self.backend.str2arr(data.encr_data);
                        self.backend.decryptAES(encr_data, self.dataservice.workerMgt(false, function(fname) {
                            self.backend.profile.company_info.name = fname + ' ' + lname;
                            self.modify();
                        }));
                    }, function(e) {
                        self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noData'));
                    });
                }));
            }, function(e) {
                self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noData'));
            });
        } else {
            self.notif.error(self.translate.instant('error'), self.translate.instant('dataview.noData'));
        }
    }

    /**
     * Computes adress
     * @function getAddr
     * @public
     * @return {String} Address.
     */
    getAddr(): string {
        if(!!this.user.company_info && !!this.user.company_info.address) {
            var ret = JSON.parse(this.user.company_info.address);
            return ret['generics.street'] + ' ' + ret['generics.num'] + ', ' + ret['generics.postcode'] + ' ' + ret['generics.city']; 
        }
        return '';
    }

    /**
     * Loads a file as data.
     * @function fileLoad
     * @public
     * @param {Event} e The change event.
     */
    fileLoad(e: any) {
        var self = this;
        var file: File = e.target.files[0]; 
        var r: FileReader = new FileReader();
        r.onloadend = function(e) {
            self.pict = r.result;
        }
        r.readAsDataURL(file);
    }

    /**
     * Moves to goCompany.
     * @function goCompany
     * @public
     * @return {String} hash of pass.
     */
    goCompany(): string {
        return localStorage.getItem('psha');
    }

    /**
     * Sets company name from BCE code.
     * @function goBCE
     * @public
     */
    goBCE() {
        var self = this;
        this.backend.goBCE(this.bce).then(function() {
            self.notif.success(self.translate.instant('success'), self.translate.instant('userinfo.changed'));
        }, function(e) {
            self.notif.error(self.translate.instant('error'), self.translate.instant('userinfo.notChanged'));
        });
    }

}
