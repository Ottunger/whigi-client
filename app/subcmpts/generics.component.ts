/**
 * Component displaying the generic values
 * @module generics.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, OnInit, EventEmitter} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {NotificationsService} from 'angular2-notifications/components';
import {Subscription} from 'rxjs/Subscription';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
//import * as template from './templates/generics.html';

@Component({
    //template: template
    templateUrl: './templates/generics.html'
})
export class Generics implements OnInit {

    public filter: string;
    public new_name: string;
    public lighted: number;
    public sub: Subscription;
    public lists: {[id: string]: any};

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param backend App service.
     * @param router Routing service.
     * @param notif Notification service.
     * @param routed Current route.
     */
    constructor(public backend: Backend, public router: Router, public notif: NotificationsService,
        public routed: ActivatedRoute, public dataservice: Data) {
        this.filter = 'generics.any';
        this.lighted = 1;
        this.lists = {}
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.sub = this.routed.params.subscribe(function(params) {
            self.filter = !!params['filter']? params['filter'] : 'generics.any';
            self.filter = (self.filter in self.dataservice.m.keys)? self.filter : 'generics.any';
            self.regUpdate();
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
     * Returns the keys of generics.
     * @function generics
     * @public
     * @return {String[][][]} Keys.
     */
    generics(): string[][][] {
        var self = this, obj;
        if(this.filter in this.lists)
            return this.lists[this.filter];
        if(this.filter == 'generics.any')
            obj = Object.getOwnPropertyNames(this.dataservice.m.holds);
        else
            obj = Object.getOwnPropertyNames(this.dataservice.m.holds).filter(function(el): boolean {
                return self.dataservice.m.keys[self.filter].holds.indexOf(el) != -1;
            });
        var toRet = [];
        for(var i = 0; i < obj.length; i++) {
            toRet.push([this.dataservice.m.holds[obj[i]].holds, obj[i], this.dataservice.m.holds[obj[i]].is_i18n, !this.dataservice.m.holds[obj[i]].open]);
        }
        this.lists[this.filter] = toRet;
        return toRet;
    }

    /**
     * Return which item to light up.
     * @function getLight
     * @public
     * @return {Number} Item.
     */
    getLight(): number {
        if(this.filter in this.dataservice.m.keys)
            return this.dataservice.m.keys[this.filter].left_num;
        return -1;
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

    /**
     * Create a confirmation.
     * @function dialog
     * @public
     * @param {String} msg Message.
     * @return {Promise} OK or not.
     */
    dialog(msg: string): Promise<boolean> {
        return new Promise<boolean>(function(resolve, reject) {
            resolve(window.confirm(msg));
        });
    }

    /**
     * Adds an empty removable temp block.
     * 
     */
    addBlock() {
        if(!(this.new_name in this.dataservice.m.holds)) {
            this.dataservice.m.holds[this.new_name] = {
                is_i18n: false,
                open: true,
                holds: []
            }
            this.dataservice.m.keys[this.filter].holds.push(this.new_name);
            this.new_name = '';
            this.lists = {};
            this.dataservice.warnM();
        }
    }

    /**
     * Removes the link in topology, removing the group.
     * @function unlink
     * @public
     * @param {String} target Target to remove.
     */
    unlink(target: string) {
        delete this.dataservice.m.holds[target];
        var inp = this.dataservice.m.keys[this.filter].holds.indexOf(target);
        this.dataservice.m.keys[this.filter].holds.splice(inp, 1);
        this.lists = {};
        this.dataservice.warnM();
    }
    
}
