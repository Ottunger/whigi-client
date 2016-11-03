exports.m = {
    "keys": {
        "generics.profile": {
            "is_i18n": true,
            "left_num": 1000,
            "holds": ["generics.perso1", "generics.perso2"]
        },
        "generics.corporate": {
            "is_i18n": true,
            "left_num": 1001,
            "holds": ["generics.corp1", "generics.corp2"]
        }
    },
    "holds": {
        "generics.perso1": {
            "open": true,
            "is_i18n": true,
            "holds": ["profile/country", "profile/first_name", "profile/last_name", "profile/email", "profile/tel"]
        },
        "generics.perso2": {
            "open": true,
            "is_i18n": true,
            "holds": ["profile/address"]
        },
        "generics.corp1": {
            "open": true,
            "is_i18n": true,
            "holds": ["profile/corporate/name", "profile/corporate/country", "profile/corporate/address"]
        },
        "generics.corp2": {
            "open": false,
            "is_i18n": true,
            "holds": ["profile/corporate/type/franco", "profile/corporate/type/open"]
        }
    }
};