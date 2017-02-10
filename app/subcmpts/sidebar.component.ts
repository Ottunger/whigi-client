/**
 * Component to display the sidebar.
 * @module sidebar.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, OnInit, OnChanges} from '@angular/core';
import {Router} from '@angular/router';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/sidebar.html';

@Component({
    selector: 'sidebar',
    template: template
})
export class Sidebar implements OnInit, OnChanges {

    public new_name: string;
    @Input() lighted: number;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param router Routing service.
     * @param backend App service.
     * @param dataservice Data service.
     */
    constructor(private router: Router, private backend: Backend, private dataservice: Data) {

    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit() {
        var self = this;
        window.$('.linkbars').ready(function() {
            window.$('.linkbars').on('click', function($e) {
                self.lighted = window.$($e.target).closest('li').attr('data-num');
                self.set(self.lighted);
            });
        });
    }

    /**
     * Called upon display.
     * @function ngOnChanges
     * @public
     */
    ngOnChanges(now: any) {
        this.set(now.lighted.currentValue);
    }

    /**
     * Set value.
     * @function set
     * @param {Number} vals Value.
     */
    set(vals: number) {
        window.$('.linkbars').removeClass('start active').remove('.selected');
        window.$('#linkbars' + vals).addClass('start active').find('a').append('<span class="selected"></span>');
        setTimeout(function() {
            window.$('.linkbars').removeClass('start active').remove('.selected');
            window.$('#linkbars' + vals).addClass('start active').find('a').append('<span class="selected"></span>');
        }, 150);
    }

    /**
     * Adds a temp column.
     * @function addColumn
     * @public
     */
    addColumn() {
        if(!(this.new_name in this.dataservice.m.keys)) {
            this.dataservice.m.keys[this.new_name] = {
                is_i18n: false,
                left_num: Math.floor(Math.random() * 100000) + 1010,
                holds: []
            }
            this.new_name = '';
            this.dataservice.warnM();
        }
    }

    /**
     * Removes a temp column.
     * @function removeColumn
     * @public
     * @param {String} key Key to remove.
     */
    removeColumn(key: string) {
        for(var i = 0; i < this.dataservice.m.keys[key].holds.length; i++)
            delete this.dataservice.m.holds[this.dataservice.m.keys[key].holds[i]];
        delete this.dataservice.m.keys[key];
        this.dataservice.warnM();
    }

}
