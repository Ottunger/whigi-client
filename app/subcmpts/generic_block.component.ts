/**
 * Component displaying the generic block
 * @module generics.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, ApplicationRef, Input, Output, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NotificationsService} from 'angular2-notifications';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/generic_block.html';

@Component({
    selector: 'generic_block',
    template: template
})
export class GenericBlock {

    public ass_name: string;
    public new_data: string;
    public new_datas: {[id: string]: string};
    public new_data_file: string;
    @Input() group: string;
    @Input() data_list: string[];
    @Output() compute: EventEmitter<number>;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param translate Translation service.
     * @param backend App service.
     * @param notif Notification service.
     * @param dataservice Data service.
     * @param check Check service.
     * @param router Routing service.
     */
    constructor(private translate: TranslateService, private backend: Backend, private notif: NotificationsService,
        private dataservice: Data, private check: ApplicationRef, private router: Router) {
        this.ass_name = '';
        this.new_datas = {};
        this.compute = new EventEmitter<number>();
    }

    /**
     * Register a new data.
     * @function register
     * @public
     * @param {String} name Name of recorded file.
     * @param {Boolean} as_file Load from file.
     * @param {String} new_name Subfolder name for foldered data.
     */
    register(name: string, as_file: boolean, new_name?: string) {
        var self = this, send;
        new_name = (!!new_name)? ('/' + new_name.replace('/', ':')) : '';
        //Build and test
        send = this.dataservice.recGeneric(this.new_data, this.new_data_file, this.new_datas, name, as_file);
        if(!send) {
            this.notif.error(this.translate.instant('error'), this.translate.instant('generics.regexp'));
            return;
        }
        //Create it
        this.dataservice.newData(name + new_name, send, this.backend.generics[name][this.backend.generics[name].length - 1].is_dated, this.backend.generics[name].length - 1).then(function() {
            self.new_name = '';
            self.new_data = '';
            self.new_data_file = '';
            self.new_datas = {};
            self.check.tick();
        }, function(err) {
            if(err == 'server')
                self.notif.error(self.translate.instant('error'), self.translate.instant('server'));
            else
                self.notif.error(self.translate.instant('error'), self.translate.instant('filesystem.exists'));
        });
    }

    /**
     * Keys of data names known.
     * @function dataNames
     * @public
     * @param {String} folder to list.
     * @return {Array} Known fields.
     */
    dataNames(folder: string): string[] {
        return this.backend.data_trie.suggestions(folder + '/', '/').sort().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) != '/';
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
        });
    }

    /**
     * Navigate to details panel.
     * @function select
     * @public
     * @param {String} name Name of data.
     */
    select(name: string) {
        this.router.navigate(['/data', window.encodeURIComponent(name)]);
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
            if(/^data:;base64,/.test(r.result))
                self.new_data_file = atob(r.result.split(',')[1]);
            else
                self.new_data_file = r.result;
        }
        r.readAsDataURL(file);
    }

}
