/**
 * Component displaying the input block
 * @module input_block.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window: any
import {Component, enableProdMode, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {Backend} from '../app.service';
import {Data} from '../data.service';
enableProdMode();
import * as template from './templates/input_block.html';

@Component({
    selector: 'input_block',
    template: template
})
export class InputBlock implements OnInit {

    private new_data: string;
    private new_data_file: string;
    private new_datas: {[id: string]: string};
    @Input() g: string;
    @Input() writeDesc: boolean;
    @Output() out: EventEmitter<any[]>;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param backend App service.
     * @param dataservice Data service.
     */
    constructor(private backend: Backend, private dataservice: Data) {
        this.new_datas = {};
        this.out = new EventEmitter<any[]>();
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        window.$('.json' + this.dataservice.sanit(this.g)).ready(function() {
            window.$('.json' + self.dataservice.sanit(self.g)).addClass(self.writeDesc? 'form-group' : 'row');
            if(!self.writeDesc) {
                window.$('.json' + self.dataservice.sanit(self.g)).css('height', '5ex');
            }
        });
    }

    /**
     * Loads a file as data.
     * @function fileLoad
     * @public
     * @param {Event} e The change event.
     * @param {String} key For json_keyded.
     */
    fileLoad(e: any, key?: string) {
        var self = this;
        var file: File = e.target.files[0]; 
        var r: FileReader = new FileReader();
        r.onloadend = function(e) {
            var res;
            if(/^data:;base64,/.test(r.result))
                res = atob(r.result.split(',')[1]);
            else
                res = r.result;
            if(!!key) {
                self.new_datas[key] = res;
                self.iChange(3);
            } else {
                self.new_data_file = res;
                self.iChange(2);
            }
        }
        r.readAsDataURL(file);
    }

    /**
     * Make change spread.
     * @function iChange
     * @public
     * @param {Number} mode Mode changed.
     */
    iChange(mode: number) {
        var val;
        switch(mode) {
            case 1:
                val = this.new_data;
                break;
            case 2:
                val = this.new_data_file;
                break;
            case 3:
                val = this.new_datas;
                break;
        }
        this.out.emit([mode, val]);
    }

}
