/**
 * Component to display the sidebar.
 * @module sidebar.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, enableProdMode, Input, OnInit, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/sidebar.html';

@Component({
    selector: 'sidebar',
    template: template
})
export class Sidebar implements OnInit {

    @Input() lighted: EventEmitter<number> | number;

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
    ngOnInit(): void {
        if(typeof this.lighted === 'number') {
            window.$('.linkbars').removeClass('start active').remove('.selected');
            window.$('#linkbars' + this.lighted).addClass('start active').find('a').append('<span class="selected"></span>');
        } else if(typeof this.lighted !== 'undefined') {
            this.lighted.asObservable().subscribe(function(vals) {
                window.$('.linkbars').removeClass('start active').remove('.selected');
                window.$('#linkbars' + vals).addClass('start active').find('a').append('<span class="selected"></span>');
            });
        }
    }

}
