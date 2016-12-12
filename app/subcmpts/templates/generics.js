exports.m = {
    "keys": {
        "generics.profile": {
            "is_i18n": true,
            "left_num": 1000,
            "holds": ["generics.perso1", "generics.perso2", "generics.perso3"]
        },
        "generics.corporate": {
            "is_i18n": true,
            "left_num": 1001,
            "holds": ["generics.corp1"]
        },
        "generics.family": {
            "is_i18n": true,
            "left_num": 1002,
            "holds": ["generics.family1", "generics.family2", "generics.family3"]
        }
    },
    "holds": {
        "generics.perso1": {
            "open": true,
            "is_i18n": true,
            "holds": ["profile/name", "profile/email", "profile/lang", "profile/country", "profile/birthdata"]
        },
        "generics.perso2": {
            "open": true,
            "is_i18n": true,
            "holds": ["profile/communications", "profile/tel", "profile/address"]
        },
        "generics.perso3": {
            "open": false,
            "is_i18n": true,
            "holds": ["profile/identity", "profile/bank"]
        },
        "generics.corp1": {
            "open": true,
            "is_i18n": true,
            "holds": ["corporate", "corporate/address"]
        },
        "generics.family1": {
            "open": true,
            "is_i18n": true,
            "holds": ["family/father", "family/mother", "family/children"]
        },
        "generics.family3": {
            "open": true,
            "is_i18n": true,
            "holds": ["family/employers"]
        },
        "generics.family2": {
            "open": true,
            "is_i18n": true,
            "holds": ["family/status", "family/partners"]
        }
    }
};