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

    public within: string;
    private isClosed: boolean;
    private new_data: string;
    private new_data_file: string;
    private new_datas: {[id: string]: string};
    @Input() standalone: boolean;
    @Input() g: string;
    @Input() writeDesc: boolean;
    @Input() json_from_ask: boolean;
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
        this.isClosed = true;
        this.def();
        this.prefill = this.prefill || '';
        this.standalone = this.standalone || false;
        if(!this.standalone || this.prefill != '') {
            window.$('.json' + this.dataservice.sanit(this.g) + this.dataservice.sanit(this.prefill)).ready(function() {
                window.$('.json' + self.dataservice.sanit(self.g) + self.dataservice.sanit(self.prefill)).addClass(self.writeDesc? 'form-group' : 'row');
                if(!self.writeDesc) {
                    window.$('.json' + self.dataservice.sanit(self.g) + self.dataservice.sanit(self.prefill)).addClass('whigi-ex');
                } else {
                    window.$('.json' + self.dataservice.sanit(self.g) + self.dataservice.sanit(self.prefill)).css('display', 'block');
                }
            });
        }
        if(!!this.reset) {
            this.reset.subscribe(function(params) {
                if(!!params && params.constructor === Array) {
                    self.collapse(true);
                    if(params.length > 0)
                        self.def();
                } else {
                    delete self.within;
                    if(!!params)
                        self.within = params;
                    self.def();
                }
            });
        }
        //Prepare the dates
        if(this.backend.generics[this.g][this.backend.generics[this.g].length - 1].mode == 'date') {
            window.$('.pickgen' + this.dataservice.sanit(this.g)).ready(function() {
                window.$('.pickgen' + self.dataservice.sanit(self.g)).datetimepicker().datetimepicker('options', {format: 'DD/MM/YYYY'}).on('dp.change', function(e) {
                    self.new_data = e.date.format('DD/MM/YYYY');
                });
            });
        } else if(this.backend.generics[this.g][this.backend.generics[this.g].length - 1].mode == 'json_keys') {
            for(var i = 0; i < this.backend.generics[this.g][this.backend.generics[this.g].length - 1].json_keys.length; i++) {
                if(this.backend.generics[this.g][this.backend.generics[this.g].length - 1].json_keys[i].mode == 'date') {
                    window.$('.pickgen' + self.dataservice.sanit(self.g) + this.dataservice.sanit(this.backend.generics[this.g][this.backend.generics[this.g].length - 1].json_keys[i].descr_key)).ready(function() {
                        window.$('.pickgen' + self.dataservice.sanit(self.g) + self.dataservice.sanit(self.backend.generics[self.g][self.backend.generics[self.g].length - 1].json_keys[this].descr_key)).datetimepicker()
                            .datetimepicker('options', {format: 'DD/MM/YYYY'}).on('dp.change', function(e) {
                                self.new_datas[self.backend.generics[self.g][self.backend.generics[self.g].length - 1].json_keys[this].descr_key] = e.date.format('DD/MM/YYYY');
                        }.bind(this));
                    }.bind(i));
                }
            }
        }
        if(this.backend.generics[this.g][this.backend.generics[this.g].length - 1].json_from_ask) {
            window.$('.pickgen' + self.dataservice.sanit(self.g) + 'json_from_ask').ready(function() {
                window.$('.pickgen' + self.dataservice.sanit(self.g) + 'json_from_ask').datetimepicker()
                    .datetimepicker('options', {format: 'DD/MM/YYYY'}).on('dp.change', function(e) {
                        self.new_datas['json_from_ask'] = e.date.format('DD/MM/YYYY');
                });
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
        delete this.new_data_file;
        delete this.new_data;
        //Prefill?
        if(!!this.within) {
            if(this.backend.generics[this.g][this.backend.generics[this.g].length - 1].mode == 'json_keys') {
                var obj = JSON.parse(this.within);
                for(var i = 0; i < this.backend.generics[this.g][this.backend.generics[this.g].length - 1].json_keys.length; i++) {
                    this.new_datas[this.backend.generics[this.g][this.backend.generics[this.g].length - 1].json_keys[i].descr_key] = 
                        obj[this.backend.generics[this.g][this.backend.generics[this.g].length - 1].json_keys[i].descr_key];
                }
            } else {
                this.new_data = this.new_data_file = this.within;
            }
        }
        this.iChange(1);
        this.iChange(2);
        this.iChange(3);
    }

    getMyText(): string {
        return this.isClosed? 'generics.moreData' : 'generics.lessData';
    }

    /**
     * Collapse/Expand.
     * @function collapse
     * @public
     * @param {Boolean} force Force close.
     */
    collapse(force?: boolean) {
        force = force === true;
        this.isClosed = !this.isClosed || force;
        window.$('.json' + this.dataservice.sanit(this.g) + this.dataservice.sanit(this.prefill)).css('display',
            (this.isClosed? 'none' : 'block'));
        window.$('.keys' + this.dataservice.sanit(this.g) + this.dataservice.sanit(this.prefill)).css('display',
            (this.isClosed || window.innerWidth <= 991? 'none' : 'block'));
        //Those are too sticky...
        window.$('.tooltip').remove();
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
