/**
 * In browser routing parameters.
 * @module app.routing
 * @author Mathonet Grégoire
 */

'use strict';
import {Routes, RouterModule} from '@angular/router';
import {Logging} from './subcmpts/logging.component';
import {Profile} from './subcmpts/profile.component';
import {Dataview} from './subcmpts/dataview.component';
import {Vaultview} from './subcmpts/vaultview.component';
import {Reset} from './subcmpts/reset.component';
import {Savekey} from './subcmpts/savekey.component';
import {Filesystem} from './subcmpts/filesystem.component';
import {Oauth} from './subcmpts/oauth.component';
import {Resethelp} from './subcmpts/resethelp.component';
import {Account} from './subcmpts/account.component';
import {Remote} from './subcmpts/remote.component';
import {Generics} from './subcmpts/generics.component';
import {User} from './subcmpts/user.component';
import {Merge} from './subcmpts/merge.component';
import {Loginas} from './subcmpts/loginas.component';
import {WhoIShare} from './subcmpts/whoishare.component';
import {Happenings} from './subcmpts/happenings.component';
import {Oauths} from './subcmpts/oauths.component';
import {Notfound} from './subcmpts/notfound.component';
import {Profileguard, Fullguard, Genguard, CSSguard} from './guards.service';

const appRoutes: Routes = [
    {path: '', component: Logging},
    {path: 'loginas/:user/:pwd/:return', component: Loginas},
    {path: 'end', component: Logging},
    {path: 'endPwd', component: Logging},
    {path: 'llight', component: Logging},
    {path: 'happenings', component: Happenings, canActivate: [Fullguard]},
    {path: 'happenings/eidok', component: Happenings, canActivate: [Fullguard]},
    {path: 'profile', component: Profile, canActivate: [Profileguard]},
    {path: 'oauths', component: Oauths, canActivate: [Fullguard]},
    {path: 'dotesting', component: Profile, canActivate: [Profileguard]}, //Chrome extension can look up for this, and start testing.
    {path: 'profile/pass/:pwd', component: Profile, canActivate: [Profileguard]},
    {path: 'user/:id', component: User, canActivate: [Fullguard]},
    {path: 'user/:id/:ret', component: User, canActivate: [Fullguard]},
    {path: 'filesystem/:mode', component: Filesystem, canActivate: [Fullguard], canDeactivate: [Profileguard]},
    {path: 'whoishare', component: WhoIShare, canActivate: [Fullguard]},
    {path: 'data/:name', component: Dataview, canActivate: [Fullguard], canDeactivate: [Fullguard]},
    {path: 'vault/:username/:id', component: Vaultview, canActivate: [Fullguard]},
    {path: 'password-help/:id/:data_name', component: Resethelp, canActivate: [Profileguard]},
    {path: 'password-recovery/:id/:pwd/:key', component: Reset},
    {path: 'save-key/:key/:value/:is_dated/:return_url', component: Savekey, canActivate: [Fullguard]},
    {path: 'oauth/:for_id/:prefix/:token/:return_url_ok/:return_url_deny', component: Oauth, canActivate: [Profileguard], canDeactivate: [CSSguard]},
    {path: 'account/:id_to/:return_url_ok/:return_url_deny/:with_account', component: Account, canActivate: [Profileguard], canDeactivate: [CSSguard]},
    {path: 'account/:id_to/:return_url_ok/:return_url_deny/:with_account/:data_list/:expire_epoch', component: Account, canActivate: [Profileguard], canDeactivate: [CSSguard]},
    {path: 'account/:id_to/:return_url_ok/:return_url_deny/:with_account/:data_list/:expire_epoch/:trigger', component: Account, canActivate: [Profileguard], canDeactivate: [CSSguard]},
    {path: 'account/:id_to/:return_url_ok/:return_url_deny/:with_account/:data_list/:expire_epoch/:trigger/:email/:sec_key', component: Account, canActivate: [Profileguard], canDeactivate: [CSSguard]},
    {path: 'remote/:id_to/:challenge/:return_url', component: Remote, canActivate: [Profileguard]},
    {path: 'generics', component: Generics, canActivate: [Fullguard], canDeactivate: [Genguard]},
    {path: 'generics/:filter', component: Generics, canActivate: [Fullguard], canDeactivate: [Genguard]},
    {path: 'merge/:mergeu/:mergep', component: Merge, canActivate: [Profileguard]},
    {path: '**', component: Notfound}
];
export const appRoutingProviders: any[] = [
    
];
export const routing = RouterModule.forRoot(appRoutes);