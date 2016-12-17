/**
 * Component to display the public info of a user.
 * @module userinfo.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, ApplicationRef, OnInit, EventEmitter} from '@angular/core';
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
    @Input() ready: EventEmitter<any>;
    public bce: string;
    public erase_name: string;
    public erase_addr: string;
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
        this.erase_addr = this.translate.instant('__no');
        this.erase_name = this.translate.instant('__no');
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
        setTimeout(function() {
            window.$("input[name='erase_addr']").attr('list', 'dtladdr');
        }, 500);
        if(!!this.ready) {
            this.ready.subscribe(function(user) {
                self.user = user;
                self.dataservice.picts(self.user, 'pict-user');
            });
        } else {
            var test = setInterval(function() {
                if(Object.getOwnPropertyNames(self.user).length == 0)
                    return;
                clearInterval(test);
                self.dataservice.picts(self.user, 'pict-user');
            }, 30);
        }
    }

    /**
     * Datas we have.
     * @function datasAt
     * @public
     * @param {String} Path.
     * @return {String[]} Names we have.
     */
    datasAt(path: string): string[] {
        return this.backend.data_trie.suggestions(path + '/', '/').sort().filter(function(el) {
            return el.charAt(el.length - 1) != '/';
        }).map(function(el) {
            return el.replace(/.+\//, '');
        });
    }

    /**
     * Prepares to save data.
     * @function toReturn
     * @public
     */
    toReturn() {
        var val = JSON.stringify({
           erase_name: this.erase_name.charAt(2) == 'R',
           erase_addr: this.erase_addr 
        });
        window.$("input[name='toreturn']").val(val);
        window.$('#eidform').submit();
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
        if(!!this.backend.profile.data['profile/name']) {
            self.dataservice.getData(self.backend.profile.data['profile/name'].id).then(function(data) {
                var decr = JSON.parse(data.decr_data);
                self.backend.profile.company_info.name = decr['generics.first_name'] + ' ' + decr['generics.last_name'];
                self.modify();
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
            var i = new Image();
            i.onload = function() {
                if(i.width > i.height) {
                    self.resizeBase64Img(r.result, (i.width / i.height) * 32, 32).then(function(res) {
                        self.pict = res;
                        window.$('.load-button').removeClass('default').addClass('green');
                    });
                } else {
                    self.resizeBase64Img(r.result, 32, (i.height / i.width) * 32).then(function(res) {
                        self.pict = res;
                        window.$('.load-button').removeClass('default').addClass('green');
                    });
                }
            };
            i.src = r.result;
        }
        r.readAsDataURL(file);
    }

    /**
     * Resize picture in JS.
     * @function resizeBase64Img
     * @public
     * @param {String} base64 Data.
     * @param {Number} width New width.
     * @param {Number} height New height.
     */
    resizeBase64Img(base64, width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext('2d');
        var deferred = window.$.Deferred();
        window.$('<img src="' + base64 + '" />').on('load', function() {
            context.scale(width/this.width, height/this.height);
            context.drawImage(this, 0, 0); 
            deferred.resolve(canvas.toDataURL());               
        });
        return deferred.promise();    
    }

    /**
     * Moves to goCompany.
     * @function goCompany
     * @public
     * @return {String} Hash of pass.
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
