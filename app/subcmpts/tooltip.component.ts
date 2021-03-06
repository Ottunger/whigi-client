/**
 * Component to display a tooltip.
 * @module tooltip.component
 * @author Mathonet Grégoire
 */

'use strict';
declare var window : any
import {Component, Input} from '@angular/core';
import {NotificationsService} from 'angular2-notifications/components';
import {Backend} from '../app.service';
import {Data} from '../data.service';

@Component({
    selector: 'tooltip',
    templateUrl: './templates/tooltip.html'
})
export class Tooltip {

    @Input() uri: string;
    @Input() mode: string;
    @Input() right: boolean;
    public mapping: {[id: string]: string};

    /**
     * Creates the component.
     * @function constructor
     * @public
     * @param backend App service.
     * @param notif Event service.
     * @param dataservice Data service.
     */
    constructor(public backend: Backend, public notif: NotificationsService, public dataservice: Data) {
        this.mapping = {};
    }

    /**
     * Launch.
     * @function Launch
     * @public
     */
    launch() {
        var self = this;
        if(!self.uri || self.uri == '')
            return;
        if(this.mode.indexOf('shares') == 0) {
            //We are asked for showing who we share a data with
            var shares = '', keys = Object.getOwnPropertyNames(this.backend.profile.data[this.uri].shared_to);
            for(var i = 0; i < keys.length; i++) {
                this.mapping[keys[i]] = this.backend.generateRandomString(12);
                shares += '<li id="li__' + this.mapping[keys[i]] + '" class="list-group-item"><img id="pict__' + this.mapping[keys[i]] + keys[i] + '" height="20px" alt="" style="float: left;margin-right: 10px;" />'
                   + '<a href="javascript:;" onclick="window.$(\'.tp-close\').click(); window.ngUserMove(\'' + keys[i] + '\')">' + keys[i] + '</a>'
                   + (this.dataservice.isWhigi(keys[i])? '' : ('<button style="float: right; margin-top: -5px;" class="btn btn-link" onclick="delUserShare(\'' + keys[i] + '\', \''
                   + this.mapping[keys[i]] + '\')"><i class="fa fa-trash"></i></button>'))
                   + '</li>';
            }
            shares = (shares == '')? '<li class="list-group-item">' + this.backend.transform('nothing') + '</li>' : shares;
            //Modal
            window.$(`
                <div class="modal">
                    <h3>` + self.backend.transform('dataview.grants') + `</h3>
                    <div class="row text-center">
                        <script type="text/javascript">
                            function delUserShare(key, lid) {
                                window.ngData.revoke('` + this.uri + `', key).then(function() {
                                    $('#li__' + lid).remove();
                                    if(!$($('.modal')[$('.modal').length - 1]).find('li').length || $($('.modal')[$('.modal').length - 1]).find('li').length == 0) {
                                        $('.tp-close').click();
                                    }
                                }, function(e) {
                                    $('#li__' + lid).find('button').remove();
                                });
                            }
                        </script>
                        <ul class="list-group">` + shares + `</ul>
                    </div>
                </div>
            `).appendTo('body').modal({closeClass: 'tp-close'});
            //Pictures
            keys.forEach(function(key) {
                self.backend.getUser(key).then(function(user) {
                    window.$('#pict__' + self.mapping[key] + key).ready(function() {
                        if(!!user && !!user.company_info && !!user.company_info.picture)
                            window.$('#pict__' + self.mapping[key] + key).attr('src', user.company_info.picture);
                        else
                            window.$('#pict__' + self.mapping[key] + key).attr('src', 'assets/logo.png');
                    });
                }, function(e) {
                    window.$('#pict__' + self.mapping[key] + key).ready(function() {
                        window.$('#pict__' + self.mapping[key] + key).attr('src', 'assets/logo.png');
                    });
                });
            });
        } else if(this.mode == 'info') {
            this.dataservice.tryHelp(this.uri);
        }
    }

}
