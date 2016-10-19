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
    @Input() prefill: string;
    @Input() reset: EventEmitter<any>;
    @Output() out: EventEmitter<any[]>;

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param backend App service.
     * @param dataservice Data service.
     */
    constructor(private backend: Backend, private dataservice: Data) {
        this.out = new EventEmitter<any[]>();
    }

    /**
     * Called upon display.
     * @function ngOnInit
     * @public
     */
    ngOnInit(): void {
        var self = this;
        this.def();
        this.new_data = (!!this.prefill)? this.prefill : this.new_data;
        window.$('.json' + this.dataservice.sanit(this.g)).ready(function() {
            window.$('.json' + self.dataservice.sanit(self.g)).addClass(self.writeDesc? 'form-group' : 'row');
            if(!self.writeDesc) {
                window.$('.json' + self.dataservice.sanit(self.g)).css('height', '5ex');
            } else {
                window.$('.json' + self.dataservice.sanit(self.g)).css('display', 'block');
            }
        });
        if(!!this.reset) {
            this.reset.subscribe(function() {
                self.def();
                self.collapse();
            });
        }
    }

    /**
     * Default values.
     * @function def
     * @public
     */
    def() {
        this.new_datas = {};
        this.new_data_file = '';
        this.new_data = (this.backend.generics[this.g][this.backend.generics[this.g].length - 1].mode == 'select')? 'false' : '';
        if(this.backend.generics[this.g][this.backend.generics[this.g].length - 1].mode == 'json_keys') {
            for(var i = 0; i < this.backend.generics[this.g][this.backend.generics[this.g].length - 1].json_keys.length; i++) {
                this.new_datas[this.backend.generics[this.g][this.backend.generics[this.g].length - 1].json_keys[i].descr_key] = 
                    (this.backend.generics[this.g][this.backend.generics[this.g].length - 1].json_keys[i].mode == 'select')? 'false' : '';
            }
        }
        this.iChange(1);
        this.iChange(2);
        this.iChange(3);
    }

    /**
     * Collapse/Expand.
     * @function collapse
     * @public
     */
    collapse() {
        window.$('.json' + this.dataservice.sanit(this.g)).css('display', (window.$('.json' + this.dataservice.sanit(this.g)).css('display') == 'block'? 'none' : 'block'));
        window.$('.keys' + this.dataservice.sanit(this.g)).css('display',
            (window.$('.keys' + this.dataservice.sanit(this.g)).css('display') == 'block' || window.innerWidth <= 991? 'none' : 'block'));
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
                window.$('#fsb' + self.dataservice.sanit(self.g) + self.dataservice.sanit(key)).removeClass('default').addClass('green');
                self.iChange(3);
            } else {
                self.new_data_file = res;
                window.$('#fsb' + self.dataservice.sanit(self.g)).removeClass('default').addClass('green');
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

    /**
     * Register an iChange.
     * @function regChange
     * @public
     * @param {Number} mode Mode changed.
     */
    regChange(mode: number) {
        var self = this;
        setImmediate(function() {
            self.iChange(mode);
        });
    }

}
