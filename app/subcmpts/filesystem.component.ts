/**
 * Component displaying the files as folders.
 * @module filesystem.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit, OnDestroy, ApplicationRef, EventEmitter} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {NotificationsService} from 'angular2-notifications';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/filesystem.html';

@Component({
    template: template
})
export class Filesystem implements OnInit {

    public data_value_file: string;
    public folders: string;
    private mode: string;
    private lighted: number;
    private sub: Subscription;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param backend App service.
     * @param router Routing service.
     * @param routed Route snapshot service.
     * @param notif Notification service.
     * @param dataservice Data service.
     * @param check Check service.
     * @param render Renderer.
     */
    constructor(private backend: Backend, private router: Router, private routed: ActivatedRoute,
        private notif: NotificationsService, private dataservice: Data, private check: ApplicationRef) {
        this.folders = '';
        this.lighted = 1;
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            if(!!params['folders'])
                self.folders = params['folders'];
            self.mode = params['mode'];
            window.$('#pick1').ready(function() {
                window.$('#pick1').datetimepicker();
                window.$('#pick1').datetimepicker('date', window.moment());
            });
            window.$('#pick2').ready(function() {
                window.$('#pick2').datetimepicker();
                window.$('#pick2').datetimepicker('date', window.moment());
            });
            self.regUpdate();
            //Breadcrump
            window.$('#breadcrump').ready(function() {
                self.dataservice.ev.emit([self.folders, true]);
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
     * Register a new data.
     * @function register
     * @public
     * @param {Boolean} is_dated Dated or not.
     * @param {String} new_name New name.
     * @param {String} new_data New data.
     */
    register(is_dated: boolean, new_name: string, new_data: string) {
        var self = this, send;
        window.$('.inaming').removeClass('has-error');
        if(this.completeName(new_name) in this.backend.generics || (this.folders.slice(0, -1) in this.backend.generics && 
            this.backend.generics[this.folders.slice(0, -1)][this.backend.generics[this.folders.slice(0, -1)].length - 1].instantiable)) {
            self.notif.error(self.backend.transform('error'), self.backend.transform('filesystem.generics'));
            window.$('.inaming').addClass('has-error');
            return;
        }
        if(is_dated) {
            send = JSON.stringify([{
                value: new_data,
                from: window.$('#pick1').datetimepicker('date').toDate().getTime()
            }]);
        } else {
            send = new_data;
        }
        this.dataservice.newData(true, this.completeName(new_name), send, is_dated, 0).then(function() {
            self.check.tick();
        }, function(err) {
            if(err[0] == 'server') {
                if(err[1].status == 413)
                    self.notif.error(self.backend.transform('error'), self.backend.transform('tooLarge'));
                else
                    self.notif.error(self.backend.transform('error'), self.backend.transform('server'));
            } else {
                self.notif.error(self.backend.transform('error'), self.backend.transform('filesystem.exists'));
                window.$('.inaming').addClass('has-error');
            }
        });
    }

    /**
     * Get a folder up.
     * @function getUp
     * @public
     */
    getUp() {
        this.router.navigate(['/filesystem', this.mode, {folders: this.folders.replace(/[^\/]+\/$/, '')}]);
    }

    /**
     * Access a folder.
     * @function select
     * @public
     * @param {String} name Folder name.
     */
    select(name: string) {
        name = name.replace(/\//g, ':').substr(0, 63);
        this.router.navigate(['/filesystem', this.mode, {folders: this.folders + name + '/'}]);
    }

    /**
     * Navigate to details panel.
     * @function view
     * @public
     * @param {String} name Name of data.
     */
    view(name: string) {
        if(this.mode == 'data') {
            this.router.navigate(['/data', window.encodeURIComponent(this.folders + name)]);
        } else if(this.mode == 'vault') {
            var mail = this.folders.substr(0, this.folders.indexOf('/'));
            this.router.navigate(['/vault', window.encodeURIComponent(mail), this.backend.shared_with_me_trie.find(this.folders + name).value, {
                route_back: this.folders,
                data_name: this.folders + name
            }]);
        }
    }

    /**
     * List this level.
     * @function listLevel
     * @public
     * @return {Array} Known fields.
     */
    listLevel(): string[] {
        if(this.mode == 'data') {
            return this.backend.data_trie.suggestions(this.folders, '/').sort();
        } else if(this.mode == 'vault') {
            return this.backend.shared_with_me_trie.suggestions(this.folders, '/').sort();
        }
        return [];
    }

    /**
     * Keys of data names known.
     * @function dataNames
     * @public
     * @return {Array} Known fields.
     */
    dataNames(): string[] {
        return this.listLevel().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) != '/';
        }).map(function(el: string): string {
            return el.replace(/.+\//, '');
        });
    }

    /**
     * Keys of folder names known.
     * @function folderNames
     * @public
     * @return {Array} Known fields.
     */
    folderNames(): string[] {
        return this.listLevel().filter(function(el: string): boolean {
            return el.charAt(el.length - 1) == '/';
        }).map(function(el: string): string {
            return el.slice(0, -1).replace(/.+\//, '');
        });
    }

    /**
     * Returns a name based on directory structure.
     * @function completeName
     * @private
     * @param {String} name Orginal name.
     * @return {String} Describing name.
     */
    private completeName(name: string): string {
        return this.folders + name.replace(/\//g, ':').substr(0, 63);
    } 

    /**
     * Create a confirmation.
     * @function dialog
     * @public
     * @param {String} msg Message.
     * @return {Promise} OK or not.
     */
    dialog(msg: string): Promise {
        var self = this;
        return new Promise<boolean>(function(resolve, reject) {
            if(window.confirm(msg)) {
                //On route change, reset the route
                self.folders = '';
                resolve(true);
            } else {
                resolve(false);
            }
        });
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
                self.data_value_file = atob(r.result.split(',')[1]);
            else
                self.data_value_file = r.result;
            window.$('.load-button').removeClass('default').addClass('green');
        }
        r.readAsDataURL(file);
    }

    /**
     * Allows to display a context of the folder.
     * @function hasKey
     * @param {String} mode Return long description.
     * @return {String} A key to describe the folder or undefined.
     */
    hasKey(mode: string): string {
        if(!this.folders) {
            this.folders = '';
        }
        var test = (this.mode == 'data')? this.folders : this.folders.replace(/^[^\/]*\//, '');
        if(!(test in this.backend.generics_paths))
            return undefined;
        switch(mode) {
            case 'descr':
                return this.backend.generics_paths[test].descr_key;
            case 'long':
                return this.backend.generics_paths[test].long_descr_key;
            case 'url':
                return this.backend.generics_paths[test].help_url;
        }
    }

    /**
     * Return which item to light up.
     * @function getLight
     * @public
     * @return {Number} Item.
     */
    getLight(): number {
        return (this.mode == 'data'? 3 : 4);
    }

    /**
     * Register an update of lighter.
     * @function regUpdate
     * @public
     */
    regUpdate() {
        var self = this;
        setImmediate(function() {
            self.lighted = self.getLight();
        });
    }
    
}
