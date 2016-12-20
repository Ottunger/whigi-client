exports.m = {
    "keys": {
        "generics.profile": {
            "is_i18n": true,
            "left_num": 1000,
            "holds": ["generics.perso1", "generics.perso2", "generics.perso3"]
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
            "holds": ["profile/name", "profile/email", "profile/lang", "profile/nationalities"]
        },
        "generics.perso2": {
            "open": true,
            "is_i18n": true,
            "holds": ["profile/communications", "profile/tel", "profile/address"]
        },
        "generics.perso3": {
            "open": false,
            "is_i18n": true,
            "holds": ["profile/birthdata", "profile/identity", "profile/bank"]
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